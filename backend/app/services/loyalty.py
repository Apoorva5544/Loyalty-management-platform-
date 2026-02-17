import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.models import User, Activity, Campaign, PointsTransaction, CustomerTier, Tier, Redemption, Reward, Purchase, Store

def record_activity(db: Session, store_id: str, user_id: str, activity_type: str, data: dict = None, anonymous_id: str = None):
    """
    Step 1 & 2: Customer does something and activity is recorded.
    """
    # Resolve Organization from Store
    from app.models.models import Store
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise ValueError("Store not found")
    
    organization_id = store.organization_id
    
    # Extract identifiers
    email = data.get("email") if data and isinstance(data, dict) else None
    phone = data.get("phone") if data and isinstance(data, dict) else None
    dob = data.get("dob") if data and isinstance(data, dict) else None
    visitor_id = data.get("visitor_id") if data and isinstance(data, dict) else None
    
    # Fallback to user_id as email if not in data (legacy/simple support)
    if user_id and not email and "@" in user_id:
        email = user_id

    # If an explicit user_id (CUID) is provided, prefer it (e.g., recovered identity on returning visit)
    user = None
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    # Try to find user by Phone + DOB (Strongest Identity)
    if not user and phone and dob:
        user = db.query(User).filter(
            User.organization_id == organization_id,
            User.phone_number == phone,
            User.dob == dob
        ).first()
    
    # Fallback: Try to find by Email if no user found yet
    if not user and email:
        user = db.query(User).filter(
            User.organization_id == organization_id,
            User.email == email
        ).first()

    # Fallback: Try to find by ASG details
    if not user and (data.get("asg_id") or data.get("asg_email") or data.get("asg_phone")):
        query = db.query(User).filter(User.organization_id == organization_id)
        if data.get("asg_id"):
            user = query.filter(User.asg_id == data.get("asg_id")).first()
        if not user and data.get("asg_email"):
            user = query.filter(User.asg_email == data.get("asg_email")).first()
        if not user and data.get("asg_phone"):
            user = query.filter(User.asg_phone == data.get("asg_phone")).first()

    # Fallback: Try to find by Vasan details
    if not user and (data.get("vasan_id") or data.get("vasan_email") or data.get("vasan_phone")):
        query = db.query(User).filter(User.organization_id == organization_id)
        if data.get("vasan_id"):
            user = query.filter(User.vasan_id == data.get("vasan_id")).first()
        if not user and data.get("vasan_email"):
            user = query.filter(User.vasan_email == data.get("vasan_email")).first()
        if not user and data.get("vasan_phone"):
            user = query.filter(User.vasan_phone == data.get("vasan_phone")).first()

    # Create User if not found and it's a SIGNUP/IDENTIFY event
    if not user and (activity_type == "SIGNUP" or activity_type == "IDENTIFY"):
        user = User(
            id=str(uuid.uuid4()),
            organization_id=organization_id,
            store_id=store_id, # Home store
            email=email,
            phone_number=phone,
            dob=dob,
            visitor_id=visitor_id,
            role="CUSTOMER",
            points=0,
            lifetime_points=0,
            is_member=False # Default to False, will be set to True if they join
        )
        
        # If it's a SIGNUP, they are becoming a member
        if activity_type == "SIGNUP":
            user.is_member = True
            
        db.add(user)
        db.commit()
        db.refresh(user)
    elif user:
        # Update fields if provided
        updated = False
        if email and not user.email:
            user.email = email
            updated = True
        if phone and not user.phone_number:
            user.phone_number = phone
            updated = True
        if dob and not user.dob:
            user.dob = dob
            updated = True
        if visitor_id and not getattr(user, "visitor_id", None):
            user.visitor_id = visitor_id
            updated = True
            
        # If it's a SIGNUP, ensure they are marked as a member
        if activity_type == "SIGNUP" and not user.is_member:
            user.is_member = True
            updated = True
            
        if updated:
            db.commit()
    
    # WebEngage-style:
    # - If user is resolved (known CUID), store activity under that user_id.
    # - Otherwise store as anonymous (user_id = NULL) and rely on anonymous_id (LUID) for later stitching.
    actual_user_id = user.id if user else None

    activity = Activity(
        id=str(uuid.uuid4()),
        store_id=store_id,
        user_id=actual_user_id,
        anonymous_id=anonymous_id,
        type=activity_type,
        data=json.dumps(data) if data else None,
        processed=False
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    
    # Trigger loyalty logic only if we have a valid user
    if user:
        process_loyalty_for_activity(db, activity)
    
    return activity

def process_loyalty_for_activity(db: Session, activity: Activity):
    """
    Step 3-7: Campaign evaluation, points calculation, ledger update, balance update, tier re-evaluation.
    """
    # 0. If it's a purchase, record it for performance metrics
    if activity.type == "PURCHASE":
        try:
            activity_data = json.loads(activity.data) if activity.data else {}
            amount = float(activity_data.get("amount", 0))
            if amount > 0:
                purchase = Purchase(
                    id=str(uuid.uuid4()),
                    store_id=activity.store_id,
                    user_id=activity.user_id,
                    amount=amount,
                    created_at=activity.created_at
                )
                db.add(purchase)
        except Exception as e:
            print(f"Error recording purchase: {e}")

    # 3. Campaign Evaluation
    campaigns = db.query(Campaign).filter(
        Campaign.store_id == activity.store_id,
        Campaign.trigger_type == activity.type,
        Campaign.active == True
    ).all()
    
    if not campaigns:
        activity.processed = True
        db.commit()
        return

    for campaign in campaigns:
        # 4. Points Calculation
        points_to_add = calculate_points(db, activity.user_id, campaign)
        
        if points_to_add > 0:
            # Calculate expiration date based on store settings
            expires_at = None
            store = db.query(Store).filter(Store.id == activity.store_id).first()
            if store and store.points_expiration and store.points_expiration != "never":
                from datetime import timedelta
                if store.points_expiration == "6_months":
                    expires_at = datetime.utcnow() + timedelta(days=180)
                elif store.points_expiration == "1_year":
                    expires_at = datetime.utcnow() + timedelta(days=365)
                elif store.points_expiration == "2_years":
                    expires_at = datetime.utcnow() + timedelta(days=730)
            
            # 5. Ledger Update (Immutable Transaction)
            transaction = PointsTransaction(
                id=str(uuid.uuid4()),
                store_id=activity.store_id,
                user_id=activity.user_id,
                campaign_id=campaign.id,
                activity_id=activity.id,
                type="EARN",
                amount=points_to_add,
                reason=f"Earned via campaign: {campaign.name}",
                expires_at=expires_at
            )
            db.add(transaction)
            
            # 6. Customer Balance Update (Cached)
            user = db.query(User).filter(User.id == activity.user_id).first()
            if user:
                user.points += points_to_add
                user.lifetime_points += points_to_add
                
                # Notify User
                from app.services.notifications import send_notification
                send_notification(
                    db, 
                    user.id, 
                    "Points Earned!", 
                    f"You earned {points_to_add} points from {campaign.name}."
                )
                
                # 7. Tier Re-evaluation
                evaluate_tier(db, user)

    activity.processed = True
    db.commit()

def calculate_points(db: Session, user_id: str, campaign: Campaign):
    """
    Calculates points based on campaign rules and tier multipliers.
    """
    user = db.query(User).filter(User.id == user_id).first()
    base_points = campaign.points_value
    
    # Apply tier multiplier if applicable
    multiplier = 1.0
    if user and user.tier:
        multiplier = user.tier.multiplier
        
    return int(base_points * multiplier)

def evaluate_tier(db: Session, user: User):
    """
    Step 7: Re-evaluate customer tier based on lifetime points.
    """
    # Find the highest tier the user qualifies for
    new_tier = db.query(Tier).filter(
        Tier.store_id == user.store_id,
        Tier.min_points <= user.lifetime_points
    ).order_by(Tier.min_points.desc()).first()
    
    if new_tier and (not user.tier_id or user.tier_id != new_tier.id):
        # Record tier change history
        history = CustomerTier(
            id=str(uuid.uuid4()),
            user_id=user.id,
            tier_id=new_tier.id,
            reason=f"Reached {user.lifetime_points} lifetime points"
        )
        db.add(history)
        
        # Update user's current tier
        user.tier_id = new_tier.id
        
        # Notify User
        from app.services.notifications import send_notification
        send_notification(
            db, 
            user.id, 
            "Tier Upgrade!", 
            f"Congratulations! You have been upgraded to {new_tier.name} tier."
        )

def process_redemption(db: Session, store_id: str, user_id: str, reward_id: str):
    """
    Standard Execution Flow: Redeeming Rewards
    """
    user = db.query(User).filter(User.id == user_id).first()
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    
    if not user or not reward:
        raise ValueError("User or Reward not found")
        
    if user.points < reward.cost:
        raise ValueError("Insufficient points balance")
        
    # 1. Create Ledger Entry (Negative)
    ledger_entry = PointsTransaction(
        id=str(uuid.uuid4()),
        store_id=store_id,
        user_id=user_id,
        type="REDEEM",
        amount=-reward.cost,
        reason=f"Redeemed reward: {reward.name}"
    )
    db.add(ledger_entry)
    
    # 2. Record Redemption
    redemption = Redemption(
        id=str(uuid.uuid4()),
        store_id=store_id,
        user_id=user_id,
        reward_id=reward_id,
        ledger_id=ledger_entry.id
    )
    db.add(redemption)
    
    # 3. Update Balance
    user.points -= reward.cost
    
    db.commit()
    return redemption
