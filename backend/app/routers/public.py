from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Store, WidgetSettings, User, Campaign, Reward, PointsTransaction, CampaignCompletion, Identity
from app.services.loyalty import record_activity
import uuid
from datetime import datetime

from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api/public", tags=["public"])

class JoinRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    dob: Optional[str] = None
    user_id: Optional[str] = None

@router.get("/widget-config")
async def get_widget_config(store_id: str, db: Session = Depends(get_db)):
    settings = db.query(WidgetSettings).filter(WidgetSettings.store_id == store_id).first()
    if not settings:
        raise HTTPException(status_code=404, detail="Widget settings not found")
    return settings

@router.get("/member-data")
async def get_member_data(
    store_id: str, 
    user_id: str = None,
    email: str = None, 
    phone: str = None, 
    dob: str = None, 
    db: Session = Depends(get_db)
):
    # Resolve Organization
    store = db.query(Store).filter(Store.id == store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    organization_id = store.organization_id

    user = None
    
    # Priority 1: User ID (Unified Tracking)
    if user_id:
        user = db.query(User).filter(User.id == user_id).first()

    # Priority 2: Phone + DOB
    if not user and phone and dob:
        user = db.query(User).filter(
            User.organization_id == organization_id,
            User.phone_number == phone,
            User.dob == dob
        ).first()
    
    # Priority 3: Email
    if not user and email:
        user = db.query(User).filter(
            User.organization_id == organization_id,
            User.email == email
        ).first()

    # Priority 4: ASG Details
    if not user:
        query = db.query(User).filter(User.organization_id == organization_id)
        if email:
            user = query.filter(User.asg_email == email).first()
        if not user and phone:
            user = query.filter(User.asg_phone == phone).first()
            
    # Priority 5: Vasan Details
    if not user:
        query = db.query(User).filter(User.organization_id == organization_id)
        if email:
            user = query.filter(User.vasan_email == email).first()
        if not user and phone:
            user = query.filter(User.vasan_phone == phone).first()

    if not user:
        return {"is_member": False}
    
    # Get recent transactions
    transactions = db.query(PointsTransaction).filter(
        PointsTransaction.user_id == user.id
    ).order_by(PointsTransaction.created_at.desc()).limit(5).all()

    return {
        "is_member": True,
        "user_id": user.id,
        "role": user.role,
        "points": user.points,
        "lifetime_points": user.lifetime_points,
        "tier": user.tier.name if user.tier else "Bronze",
        "recent_activity": [
            {"type": t.type, "amount": t.amount, "reason": t.reason, "date": t.created_at.isoformat()}
            for t in transactions
        ]
    }

@router.get("/available-campaigns")
async def get_available_campaigns(
    store_id: str, 
    user_id: str = None,
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).filter(
        Campaign.store_id == store_id,
        Campaign.active == True
    ).all()
    
    result = []
    for c in campaigns:
        completed = False
        if user_id:
            completion = db.query(CampaignCompletion).filter(
                CampaignCompletion.campaign_id == c.id,
                CampaignCompletion.user_id == user_id
            ).first()
            if completion:
                completed = True
        
        result.append({
            "id": c.id,
            "name": c.name,
            "description": c.description,
            "points_value": c.points_value,
            "trigger_type": c.trigger_type,
            "completed": completed
        })
        
    return result

@router.get("/available-rewards")
async def get_available_rewards(store_id: str, db: Session = Depends(get_db)):
    rewards = db.query(Reward).filter(
        Reward.store_id == store_id
    ).all()
    return rewards

@router.post("/track")
async def track_event(
    store_id: str,
    event_type: str,
    user_id: str = None,
    anonymous_id: str = None,
    data: dict = None,
    db: Session = Depends(get_db)
):
    """
    Public endpoint to record customer activities.
    Triggers the loyalty rules engine.
    """
    try:
        # 1. Record Activity
        activity = record_activity(db, store_id, user_id, event_type, data, anonymous_id)

        # Helpful debug signal for integrations: are we tracking anonymously or identified?
        # (Keeps response backwards compatible.)
        tracking_mode = "identified" if activity.user_id else "anonymous"

        # Keep identity mapping fresh (LUID -> CUID) and enable cross-device merge.
        # - If we have anonymous_id (LUID), ensure Identity exists.
        # - If we resolved a user (CUID) and have LUID, link them and stitch history.
        if anonymous_id:
            store = db.query(Store).filter(Store.id == store_id).first()
            if store:
                identity = db.query(Identity).filter(
                    Identity.store_id == store_id,
                    Identity.luid == anonymous_id
                ).first()
                if not identity:
                    identity = Identity(
                        id=str(uuid.uuid4()),
                        organization_id=store.organization_id,
                        store_id=store_id,
                        luid=anonymous_id,
                        visitor_id=(data.get("visitor_id") if isinstance(data, dict) else None),
                        user_id=None
                    )
                    db.add(identity)
                    db.commit()
                    db.refresh(identity)
                else:
                    identity.last_seen = datetime.utcnow()
                    if isinstance(data, dict) and data.get("visitor_id") and not identity.visitor_id:
                        identity.visitor_id = data.get("visitor_id")
                    db.commit()

                # If this event resolved to a user, link identity.user_id and stitch anonymous history
                if activity.user_id:
                    if identity.user_id != activity.user_id:
                        identity.user_id = activity.user_id
                        db.commit()
        
        # 3. Check for Campaign Triggers
        # If we don't have a user_id (anonymous), we can't award points yet.
        if not activity.user_id:
             return {"status": "success", "mode": tracking_mode, "activity_id": activity.id, "points_earned": 0}

        user = db.query(User).filter(User.id == activity.user_id).first()
        
        # CRITICAL: Only award points if they are a loyalty member
        if not user.is_member:
            return {
                "status": "success", 
                "mode": tracking_mode, 
                "activity_id": activity.id, 
                "points_earned": 0,
                "message": "Activity tracked, but points not awarded (not a loyalty member)"
            }
        
        # Trigger Welcome Email on SIGNUP
        if event_type == "SIGNUP":
            from app.services.notifications import send_notification
            send_notification(
                db, 
                user.id, 
                "Welcome to the Club!", 
                "Welcome to our loyalty program!", 
                type="EMAIL"
            )
        
        # Identity Stitching: If we have a user and an anonymous_id, link past anonymous activities
        if user and anonymous_id:
            from app.models.models import Activity
            try:
                # Find all activities with this anonymous_id and NO user_id
                anonymous_activities = db.query(Activity).filter(
                    Activity.anonymous_id == anonymous_id,
                    Activity.user_id == None
                ).all()
                
                for anon_act in anonymous_activities:
                    anon_act.user_id = user.id
                    # Retroactive Loyalty: If the activity was earnable, process it now
                    if anon_act.type in ["PURCHASE", "REVIEW"]:
                         try:
                             # We need to import this inside to avoid potential circular imports if moved, 
                             # but here it is safe as we import from services
                             from app.services.loyalty import process_loyalty_for_activity
                             process_loyalty_for_activity(db, anon_act)
                         except Exception as e:
                             print(f"Error processing retroactive loyalty: {e}")
                
                db.commit()
            except Exception as e:
                print(f"Error in identity stitching: {e}")
                # Don't fail the request, just log it
                pass

        campaigns = db.query(Campaign).filter(
            Campaign.store_id == store_id,
            Campaign.active == True,
            Campaign.trigger_type == event_type
        ).all()
        
        total_points = 0
        
        for campaign in campaigns:
            # Check if already completed (for one-time campaigns)
            existing_completion = db.query(CampaignCompletion).filter(
                CampaignCompletion.campaign_id == campaign.id,
                CampaignCompletion.user_id == user.id
            ).first()
            
            if not existing_completion:
                # Award Points
                points = int(campaign.points_value)
                
                # Create Transaction
                transaction = PointsTransaction(
                    id=str(uuid.uuid4()),
                    store_id=store_id,
                    user_id=user.id,
                    campaign_id=campaign.id,
                    type="EARN",
                    amount=points,
                    reason=f"Earned via campaign: {campaign.name}"
                )
                db.add(transaction)
                
                # Update User Balance
                user.points += points
                user.lifetime_points += points
                
                # Record Completion
                completion = CampaignCompletion(
                    id=str(uuid.uuid4()),
                    user_id=user.id,
                    campaign_id=campaign.id
                )
                db.add(completion)
                
                total_points += points
        
        db.commit()
        
        return {
            "status": "success", 
            "mode": tracking_mode,
            "activity_id": activity.id, 
            "points_earned": total_points,
            "new_balance": user.points
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/redeem")
async def redeem_reward(
    store_id: str,
    reward_id: str,
    user_id: str,
    db: Session = Depends(get_db)
):
    try:
        # 1. Validate User & Reward
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
            
        reward = db.query(Reward).filter(Reward.id == reward_id, Reward.store_id == store_id).first()
        if not reward:
            raise HTTPException(status_code=404, detail="Reward not found")
            
        # 2. Check Balance
        if user.points < reward.cost:
            raise HTTPException(status_code=400, detail="Insufficient points")
            
        # 3. Deduct Points
        user.points -= reward.cost
        
        # 4. Create Transaction
        transaction = PointsTransaction(
            id=str(uuid.uuid4()),
            store_id=store_id,
            user_id=user.id,
            type="REDEEM",
            amount=-reward.cost,
            reason=f"Redeemed: {reward.name}"
        )
        db.add(transaction)
        
        # 5. Create Redemption Record
        redemption = Redemption(
            id=str(uuid.uuid4()),
            store_id=store_id,
            user_id=user.id,
            reward_id=reward.id,
            status="COMPLETED", # Auto-complete for digital rewards
            code=f"RW-{uuid.uuid4().hex[:8].upper()}" # Generate unique code
        )
        db.add(redemption)
        
        # Notify User
        from app.services.notifications import send_notification
        send_notification(
            db, 
            user.id, 
            "Reward Redeemed!", 
            f"You successfully redeemed {reward.name}. Your code is {redemption.code}.",
            type="EMAIL",
            context={
                "REWARD_NAME": reward.name,
                "POINTS_USED": str(reward.cost),
                "REDEMPTION_CODE": redemption.code
            }
        )
        
        db.commit()
        
        return {
            "status": "success",
            "new_balance": user.points,
            "redemption_code": redemption.code,
            "message": f"Successfully redeemed {reward.name}"
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/init")
async def init_guest_user(
    store_id: str,
    visitor_id: str = None,
    luid: str = None,
    db: Session = Depends(get_db)
):
    """
    WebEngage-style init:
    - Ensure we have an anonymous LUID identity.
    - If this device was identified before, recover the known user (CUID) via identity mapping.
    """
    try:
        # Resolve Organization
        store = db.query(Store).filter(Store.id == store_id).first()
        if not store:
            raise HTTPException(status_code=404, detail="Store not found")
        
        # 1) Ensure we have an Identity row for this anonymous profile (LUID)
        if not luid:
            luid = f"luid_{uuid.uuid4().hex}"

        identity = db.query(Identity).filter(
            Identity.store_id == store_id,
            Identity.luid == luid
        ).first()

        if not identity:
            identity = Identity(
                id=str(uuid.uuid4()),
                organization_id=store.organization_id,
                store_id=store_id,
                luid=luid,
                visitor_id=visitor_id,
                user_id=None,
                created_at=datetime.utcnow(),
                last_seen=datetime.utcnow()
            )
            db.add(identity)
            db.commit()
            db.refresh(identity)
        else:
            identity.last_seen = datetime.utcnow()
            if visitor_id and not identity.visitor_id:
                identity.visitor_id = visitor_id
            db.commit()

        # 2) If we can recover a known user on this device, return it (CUID recovery)
        recovered = False
        known_user_id = None
        known_role = "ANONYMOUS"

        if visitor_id:
            known_identity = db.query(Identity).filter(
                Identity.store_id == store_id,
                Identity.visitor_id == visitor_id,
                Identity.user_id != None
            ).order_by(Identity.last_seen.desc()).first()

            if known_identity and known_identity.user_id:
                known_user = db.query(User).filter(User.id == known_identity.user_id).first()
                if known_user:
                    recovered = True
                    known_user_id = known_user.id
                    known_role = known_user.role
                    # Link this current LUID to the same known user too (cross-session merge)
                    if identity.user_id != known_user.id:
                        identity.user_id = known_user.id
                        db.commit()

        # We no longer create "GUEST users" for anonymous browsing.
        return {
            "status": "success",
            "luid": luid,
            "user_id": known_user_id,
            "role": known_role,
            "recovered": recovered
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/join")
async def join_loyalty(
    join_data: JoinRequest,
    db: Session = Depends(get_db)
):
    """
    Public endpoint for a user to join the loyalty program.
    """
    user = None
    if join_data.user_id:
        user = db.query(User).filter(User.id == join_data.user_id).first()
    elif join_data.email:
        user = db.query(User).filter(User.email == join_data.email).first()
        if not user:
            user = db.query(User).filter(User.asg_email == join_data.email).first()
        if not user:
            user = db.query(User).filter(User.vasan_email == join_data.email).first()
    
    if not user and join_data.phone:
        user = db.query(User).filter(User.phone_number == join_data.phone).first()
        if not user:
            user = db.query(User).filter(User.asg_phone == join_data.phone).first()
        if not user:
            user = db.query(User).filter(User.vasan_phone == join_data.phone).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please ensure you are registered or tracked.")
    
    if user.is_member:
        return {"message": "User is already a loyalty member", "user_id": user.id}
    
    # Activate membership
    user.is_member = True
    
    # Trigger Welcome Notification
    from app.services.notifications import send_notification
    send_notification(
        db, 
        user.id, 
        "Welcome to the Loyalty Program!", 
        "You have successfully joined our loyalty program. Start earning points today!", 
        type="EMAIL"
    )
    
    db.commit()
    return {"message": "Successfully joined loyalty program", "user_id": user.id}
