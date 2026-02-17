from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.database import get_db
import uuid
from app.models.models import User, Purchase, PointsTransaction, Redemption, Activity, Store, WidgetSettings, Notification
from app.services.auth import get_current_admin, verify_password, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import datetime, timedelta
from typing import Optional
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["admin"])

class AdminLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

@router.post("/login", response_model=Token)
async def admin_login(login_data: AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    user = db.query(User).filter(User.email == login_data.email).first()
    
    if not user or not verify_password(login_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if user.role != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin privileges required.",
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

class StoreCreate(BaseModel):
    name: str
    url: str

class CreateCustomer(BaseModel):
    email: Optional[str] = None
    phone_number: Optional[str] = None
    name: Optional[str] = None
    dob: Optional[str] = None
    

class WidgetSettingsUpdate(BaseModel):
    store_id: Optional[str] = None
    header_title: Optional[str] = None
    header_subtitle: Optional[str] = None
    join_button_text: Optional[str] = None
    guest_welcome_msg: Optional[str] = None
    member_welcome_msg: Optional[str] = None
    
    primary_color: Optional[str] = None
    text_color: Optional[str] = None
    button_color: Optional[str] = None
    button_text_color: Optional[str] = None
    
    launcher_color: Optional[str] = None
    panel_bg_color: Optional[str] = None
    panel_text_color: Optional[str] = None
    
    tab_active_color: Optional[str] = None
    tab_inactive_color: Optional[str] = None
    
    position: Optional[str] = None
    side_padding: Optional[int] = None
    bottom_padding: Optional[int] = None

@router.get("/widget-settings")
async def get_widget_settings(
    store_id: Optional[str] = None,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin_store = db.query(Store).filter(Store.id == current_user.store_id).first()
    if not admin_store:
        raise HTTPException(status_code=400, detail="Admin not linked to a store")
    
    target_store_id = store_id or admin_store.id
    target_store = db.query(Store).filter(Store.id == target_store_id).first()
    
    if not target_store or target_store.organization_id != admin_store.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized for this store")
        
    settings = db.query(WidgetSettings).filter(WidgetSettings.store_id == target_store_id).first()
    if not settings:
        # Create default settings if not exists
        settings = WidgetSettings(
            id=str(uuid.uuid4()),
            store_id=target_store_id
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    return settings

@router.put("/widget-settings")
async def update_widget_settings(
    settings_data: WidgetSettingsUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin_store = db.query(Store).filter(Store.id == current_user.store_id).first()
    if not admin_store:
        raise HTTPException(status_code=400, detail="Admin not linked to a store")
    
    target_store_id = settings_data.store_id or admin_store.id
    target_store = db.query(Store).filter(Store.id == target_store_id).first()
    
    if not target_store or target_store.organization_id != admin_store.organization_id:
        raise HTTPException(status_code=403, detail="Not authorized for this store")
        
    settings = db.query(WidgetSettings).filter(WidgetSettings.store_id == target_store_id).first()
    if not settings:
        settings = WidgetSettings(
            id=str(uuid.uuid4()),
            store_id=target_store_id
        )
        db.add(settings)
    
    # Update fields
    update_data = settings_data.dict(exclude_unset=True)
    if "store_id" in update_data:
        del update_data["store_id"]
        
    for field, value in update_data.items():
        setattr(settings, field, value)
        
    db.commit()
    db.refresh(settings)
    return settings

@router.get("/stores")
async def get_stores(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Get all stores for the admin's organization
    # Assuming admin is linked to an organization via their store or directly
    # For now, we resolve org from the admin's store
    admin_store = db.query(Store).filter(Store.id == current_user.store_id).first()
    if not admin_store:
        return {"stores": []}
        
    stores = db.query(Store).filter(Store.organization_id == admin_store.organization_id).all()
    return {"stores": stores}

@router.post("/stores")
async def create_store(
    store_data: StoreCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    admin_store = db.query(Store).filter(Store.id == current_user.store_id).first()
    if not admin_store:
        raise HTTPException(status_code=400, detail="Admin not linked to a store")

    new_store = Store(
        id=str(uuid.uuid4()),
        organization_id=admin_store.organization_id,
        name=store_data.name,
        company_url=store_data.url,
        owner_id=current_user.id
    )
    db.add(new_store)
    db.commit()
    db.refresh(new_store)
    return new_store

@router.get("/customers")
async def get_customers(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    customers = db.query(User).filter(
        User.role == "CUSTOMER",
        User.store_id == current_user.store_id
    ).all()
    return {"customers": customers}

@router.post("/customers")
async def create_customer(
    customer_data: CreateCustomer,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Check if user exists
    existing_user = None
    if customer_data.email:
        existing_user = db.query(User).filter(User.email == customer_data.email).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Customer with this email already exists")
        
    # Create new user
    new_user = User(
        id=str(uuid.uuid4()),
        organization_id=current_user.organization_id, # Same org as admin
        store_id=current_user.store_id,
        role="CUSTOMER",
        email=customer_data.email,
        phone_number=customer_data.phone_number,
        name=customer_data.name,
        dob=customer_data.dob,
        is_member=False, # Always False when created from admin, unless they join via widget
        
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/notifications/non-members")
async def notify_non_members(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Find all non-members for this store
    non_members = db.query(User).filter(
        User.store_id == current_user.store_id,
        User.role == "CUSTOMER",
        User.is_member == False
    ).all()
    
    # Check if invites are enabled
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.store_id == current_user.store_id
    ).first()
    
    if settings and not settings.invite_enabled:
        raise HTTPException(status_code=400, detail="Invitation campaign is disabled in settings")

    count = 0
    from app.services.notifications import send_notification
    for user in non_members:
        # Send notification using the invite template
        send_notification(
            db,
            user.id,
            "Join our Loyalty Program!", # This will be replaced by template subject if exists
            "Unlock exclusive rewards and benefits by joining our loyalty program today.", # This will be replaced by template content if exists
            type="EMAIL"
        )
        count += 1
        
    db.commit()
    
    return {"message": f"Notifications queued for {count} non-members", "count": count}

@router.get("/performance")
async def get_performance(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    granularity: str = "daily",
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Default to last 30 days if no dates provided
    if not end_date:
        end_dt = datetime.utcnow()
    else:
        end_dt = datetime.fromisoformat(end_date)
        
    if not start_date:
        start_dt = end_dt - timedelta(days=30)
    else:
        start_dt = datetime.fromisoformat(start_date)

    # Revenue
    total_revenue = db.query(func.sum(Purchase.amount)).filter(
        Purchase.store_id == current_user.store_id,
        Purchase.created_at >= start_dt,
        Purchase.created_at <= end_dt
    ).scalar() or 0
    
    # Average order value
    avg_order = db.query(func.avg(Purchase.amount)).filter(
        Purchase.store_id == current_user.store_id,
        Purchase.created_at >= start_dt,
        Purchase.created_at <= end_dt
    ).scalar() or 0
    
    # Total points (Current Balance)
    total_points = db.query(func.sum(User.points)).filter(
        User.role == "CUSTOMER",
        User.store_id == current_user.store_id
    ).scalar() or 0
    
    # Redemption Rate
    total_earned = db.query(func.sum(PointsTransaction.amount)).filter(
        PointsTransaction.store_id == current_user.store_id,
        PointsTransaction.type == "EARN",
        PointsTransaction.created_at >= start_dt,
        PointsTransaction.created_at <= end_dt
    ).scalar() or 0
    
    total_redeemed = db.query(func.sum(PointsTransaction.amount)).filter(
        PointsTransaction.store_id == current_user.store_id,
        PointsTransaction.type == "REDEEM",
        PointsTransaction.created_at >= start_dt,
        PointsTransaction.created_at <= end_dt
    ).scalar() or 0
    
    redemption_rate = 0
    if total_earned > 0:
        redemption_rate = (abs(total_redeemed) / total_earned) * 100
    
    # Time-series data (Points Earned vs Redeemed)
    date_format = "%Y-%m-%d" if granularity == "daily" else "%Y-%m"
    
    points_over_time = db.query(
        func.strftime(date_format, PointsTransaction.created_at).label("date"),
        func.sum(case((PointsTransaction.type == "EARN", PointsTransaction.amount), else_=0)).label("earned"),
        func.sum(case((PointsTransaction.type == "REDEEM", PointsTransaction.amount), else_=0)).label("redeemed")
    ).filter(
        PointsTransaction.store_id == current_user.store_id,
        PointsTransaction.created_at >= start_dt,
        PointsTransaction.created_at <= end_dt
    ).group_by("date").order_by("date").all()

    # Task Completion Count
    tasks_over_time = db.query(
        func.strftime(date_format, Activity.created_at).label("date"),
        func.count(Activity.id).label("count")
    ).filter(
        Activity.store_id == current_user.store_id,
        Activity.created_at >= start_dt,
        Activity.created_at <= end_dt
    ).group_by("date").order_by("date").all()
    
    # Top customers
    top_customers = db.query(User).filter(
        User.role == "CUSTOMER",
        User.store_id == current_user.store_id
    ).order_by(User.points.desc()).limit(10).all()
    
    return {
        "revenue": float(total_revenue),
        "average_order_value": float(avg_order),
        "total_points_balance": int(total_points),
        "total_earned": int(total_earned),
        "redemption_rate": round(redemption_rate, 2),
        "points_insights": [
            {"date": p.date, "earned": float(p.earned), "redeemed": float(abs(p.redeemed))} 
            for p in points_over_time
        ],
        "task_insights": [
            {"date": t.date, "count": t.count} 
            for t in tasks_over_time
        ],
        "top_customers": [{"email": c.email, "points": c.points} for c in top_customers]
    }

@router.get("/activities")
async def get_activities(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    
    query = db.query(Activity).filter(Activity.store_id == current_user.store_id)
    
    total = query.count()
    activities = query.order_by(Activity.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for a in activities:
        user_email = "Anonymous"
        if a.user:
            user_email = a.user.email or a.user.phone_number or "Unknown User"
            
        result.append({
            "id": a.id,
            "type": a.type,
            "user": user_email,
            "anonymous_id": a.anonymous_id,
            "data": a.data,
            "created_at": a.created_at.isoformat()
        })
        
    return {
        "data": result,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/leads")
async def get_leads(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    
    # Find unique anonymous_ids that are NOT associated with a user_id yet
    # We group by anonymous_id to get unique leads
    subquery = db.query(
        Activity.anonymous_id,
        func.max(Activity.created_at).label("last_seen"),
        func.count(Activity.id).label("activity_count")
    ).filter(
        Activity.store_id == current_user.store_id,
        Activity.anonymous_id != None,
        Activity.user_id == None
    ).group_by(Activity.anonymous_id).subquery()
    
    total = db.query(subquery).count()
    
    leads = db.query(subquery).order_by(subquery.c.last_seen.desc()).offset(offset).limit(limit).all()
    
    result = []
    for l in leads:
        # Get the first activity to see source data
        first_activity = db.query(Activity).filter(
            Activity.anonymous_id == l.anonymous_id
        ).order_by(Activity.created_at.asc()).first()
        
        source_info = {}
        if first_activity and first_activity.data:
            try:
                # Handle JSON string safely
                import json
                data = first_activity.data
                if isinstance(data, str):
                    data = json.loads(data)
                
                if data and isinstance(data, dict) and "source" in data:
                    source_info = data["source"]
            except Exception as e:
                print(f"Error parsing activity data: {e}")
                pass

        result.append({
            "anonymous_id": l.anonymous_id,
            "last_seen": l.last_seen.isoformat(),
            "activity_count": l.activity_count,
            "source": source_info
        })
        
    return {
        "data": result,
        "total": total,
        "page": page,
        "limit": limit
    }

@router.get("/reviews")
async def get_reviews(
    page: int = 1,
    limit: int = 20,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    offset = (page - 1) * limit
    
    # Get all review activities
    query = db.query(Activity).filter(
        Activity.store_id == current_user.store_id,
        Activity.type == "REVIEW"
    )
    
    total = query.count()
    reviews = query.order_by(Activity.created_at.desc()).offset(offset).limit(limit).all()
    
    result = []
    for review in reviews:
        user_info = {
            "email": "Anonymous",
            "name": "Anonymous User",
            "points": 0
        }
        
        if review.user:
            user_info = {
                "email": review.user.email or "No email",
                "name": review.user.name or "No name",
                "points": review.user.points
            }
        
        # Parse review data
        review_data = {}
        if review.data:
            try:
                import json
                review_data = json.loads(review.data) if isinstance(review.data, str) else review.data
            except:
                review_data = {}
        
        result.append({
            "id": review.id,
            "user": user_info,
            "rating": review_data.get("rating", 0),
            "comment": review_data.get("comment", ""),
            "product": review_data.get("product", ""),
            "created_at": review.created_at.isoformat(),
            "anonymous_id": review.anonymous_id
        })
    
    return {
        "data": result,
        "total": total,
        "page": page,
        "limit": limit
    }

class PointsAwardRequest(BaseModel):
    user_email: str
    points: int
    reason: str

@router.post("/award-points")
async def award_points(
    award_data: PointsAwardRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Find the user by email
    user = db.query(User).filter(User.email == award_data.user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Create points transaction
    transaction = PointsTransaction(
        id=str(uuid.uuid4()),
        store_id=current_user.store_id,
        user_id=user.id,
        type="EARN",
        amount=award_data.points,
        reason=award_data.reason
    )
    
    # Update user points
    user.points += award_data.points
    user.lifetime_points += award_data.points
    
    db.add(transaction)
    db.commit()
    
    return {"message": "Points awarded successfully", "new_balance": user.points}

class CompanyDetailsUpdate(BaseModel):
    name: str
    company_url: Optional[str] = None
    currency: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    points_expiration: Optional[str] = None

@router.get("/company")
async def get_company_details(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get company/store details"""
    store = db.query(Store).filter(Store.id == current_user.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return {
        "id": store.id,
        "name": store.name,
        "org_id": store.org_id,
        "company_url": store.company_url,
        "currency": store.currency,
        "street": store.street,
        "city": store.city,
        "state": store.state,
        "country": store.country,
        "postal_code": store.postal_code,
        "points_expiration": store.points_expiration or "never"
    }

@router.put("/company")
async def update_company_details(
    company_data: CompanyDetailsUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update company/store details"""
    store = db.query(Store).filter(Store.id == current_user.store_id).first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Update store fields
    store.name = company_data.name
    if company_data.company_url is not None:
        store.company_url = company_data.company_url
    if company_data.currency is not None:
        store.currency = company_data.currency
    if company_data.street is not None:
        store.street = company_data.street
    if company_data.city is not None:
        store.city = company_data.city
    if company_data.state is not None:
        store.state = company_data.state
    if company_data.country is not None:
        store.country = company_data.country
    if company_data.postal_code is not None:
        store.postal_code = company_data.postal_code
    if company_data.points_expiration is not None:
        store.points_expiration = company_data.points_expiration
    
    # Auto-generate org_id if not set (using store id as base)
    if not store.org_id:
        store.org_id = f"ORG-{store.id[:8].upper()}"
    
    db.commit()
    
    return {
        "message": "Company details updated successfully",
        "data": {
            "id": store.id,
            "name": store.name,
            "org_id": store.org_id,
            "company_url": store.company_url,
            "currency": store.currency,
            "street": store.street,
            "city": store.city,
            "state": store.state,
            "country": store.country,
            "postal_code": store.postal_code,
            "points_expiration": store.points_expiration
        }
    }