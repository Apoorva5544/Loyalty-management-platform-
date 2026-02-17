from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Float, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base

class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    stores = relationship("Store", back_populates="organization")
    users = relationship("User", back_populates="organization")

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"))
    
    # Identifiers
    email = Column(String, nullable=True) # Optional now
    phone_number = Column(String, nullable=True)
    dob = Column(String, nullable=True) # YYYY-MM-DD
    # Stable device/browser identifier (FingerprintJS visitorId). Optional.
    # NOTE: WebEngage-style tracking should primarily use LUID->CUID mapping (see Identity table below).
    visitor_id = Column(String, index=True, nullable=True)
    
    name = Column(String, nullable=True)
    password = Column(String, nullable=True)
    role = Column(String, default="CUSTOMER")  # ADMIN, CUSTOMER
    is_member = Column(Boolean, default=False) # True if joined loyalty program

    
    # Loyalty Balance (Cached - Global for Org)
    points = Column(Integer, default=0)
    lifetime_points = Column(Integer, default=0)
    
    # Referral
    referral_code = Column(String, unique=True, nullable=True)
    referred_by = Column(String, ForeignKey("users.id"), nullable=True)
    
    # VIP
    tier_id = Column(String, ForeignKey("tiers.id"), nullable=True)
    
    # Store (Last visited or Home store - optional reference)
    store_id = Column(String, ForeignKey("stores.id"), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    tier = relationship("Tier", back_populates="users")
    store = relationship("Store", back_populates="customers", foreign_keys=[store_id])
    ledger_entries = relationship("PointsTransaction", back_populates="user")
    activities = relationship("Activity", back_populates="user")
    tier_history = relationship("CustomerTier", back_populates="user")
    redemptions = relationship("Redemption", back_populates="user")
    purchases = relationship("Purchase", back_populates="user")
    campaign_completions = relationship("CampaignCompletion", back_populates="user")
    identities = relationship("Identity", back_populates="user")

class Identity(Base):
    """
    WebEngage-style identity mapping.
    - LUID (local user id) is generated client-side for anonymous visitors.
    - Once identified, we map LUID -> CUID (users.id).
    - visitor_id (FingerprintJS) is optional and helps recover identity across sessions.
    """
    __tablename__ = "identities"

    id = Column(String, primary_key=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"))
    store_id = Column(String, ForeignKey("stores.id"))

    # Local User ID (anonymous profile id)
    luid = Column(String, index=True, nullable=False)

    # Optional device/browser fingerprint id
    visitor_id = Column(String, index=True, nullable=True)

    # Customer User ID (known profile id)
    user_id = Column(String, ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="identities")

class Store(Base):
    __tablename__ = "stores"

    id = Column(String, primary_key=True, index=True)
    organization_id = Column(String, ForeignKey("organizations.id"))
    name = Column(String)
    owner_id = Column(String, ForeignKey("users.id"), nullable=True)
    
    # Company Details
    logo_url = Column(String, nullable=True)
    org_id = Column(String, nullable=True) # Legacy field, keeping for now
    client_portal_id = Column(String, nullable=True)
    company_url = Column(String, nullable=True)
    currency = Column(String, default="INR")
    street = Column(String, nullable=True)
    city = Column(String, nullable=True)
    state = Column(String, nullable=True)
    country = Column(String, nullable=True)
    postal_code = Column(String, nullable=True)
    points_expiration = Column(String, default="never")  # never, 6_months, 1_year, 2_years
    
    # Integration
    platform = Column(String, nullable=True)
    api_key = Column(String, nullable=True)
    webhook_secret = Column(String, nullable=True)
    
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    organization = relationship("Organization", back_populates="stores")
    customers = relationship("User", back_populates="store", foreign_keys="[User.store_id]")
    campaigns = relationship("Campaign", back_populates="store")
    rewards = relationship("Reward", back_populates="store")
    tiers = relationship("Tier", back_populates="store")
    widget_settings = relationship("WidgetSettings", back_populates="store", uselist=False)

class Tier(Base):
    __tablename__ = "tiers"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    name = Column(String)
    min_points = Column(Integer)
    multiplier = Column(Float, default=1.0)
    benefits = Column(String)  # JSON string
    
    # Relationships
    store = relationship("Store", back_populates="tiers")
    users = relationship("User", back_populates="tier")
    tier_history = relationship("CustomerTier", back_populates="tier")

class Activity(Base):
    __tablename__ = "activities"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    user_id = Column(String, ForeignKey("users.id"), nullable=True)
    anonymous_id = Column(String, index=True, nullable=True)
    type = Column(String)  # PURCHASE, SIGNUP, REFERRAL, REVIEW, PAGE_VIEW
    data = Column(String, nullable=True)  # JSON string for extra info
    processed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="activities")

class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    name = Column(String)
    description = Column(String)
    trigger_type = Column(String)  # Matches Activity.type
    points_type = Column(String, default="FIXED")  # FIXED, PERCENTAGE
    points_value = Column(Float)
    active = Column(Boolean, default=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    store = relationship("Store", back_populates="campaigns")
    ledger_entries = relationship("PointsTransaction", back_populates="campaign")
    completions = relationship("CampaignCompletion", back_populates="campaign")

class CampaignCompletion(Base):
    __tablename__ = "campaign_completions"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    campaign_id = Column(String, ForeignKey("campaigns.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="campaign_completions")
    campaign = relationship("Campaign", back_populates="completions")

class PointsTransaction(Base):
    __tablename__ = "points_transactions"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    user_id = Column(String, ForeignKey("users.id"))
    campaign_id = Column(String, ForeignKey("campaigns.id"), nullable=True)
    activity_id = Column(String, ForeignKey("activities.id"), nullable=True)
    
    type = Column(String)  # EARN, REDEEM, ADJUSTMENT
    amount = Column(Integer)
    reason = Column(String)
    reference_id = Column(String, nullable=True)
    expires_at = Column(DateTime, nullable=True)  # Points expiration date
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="ledger_entries")
    campaign = relationship("Campaign", back_populates="ledger_entries")

class CustomerTier(Base):
    __tablename__ = "customer_tiers"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"))
    tier_id = Column(String, ForeignKey("tiers.id"))
    reason = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="tier_history")
    tier = relationship("Tier", back_populates="tier_history")

class Reward(Base):
    __tablename__ = "rewards"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    name = Column(String)
    description = Column(String)
    cost = Column(Integer)
    image = Column(String, nullable=True)
    stock = Column(Integer, nullable=True)
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    store = relationship("Store", back_populates="rewards")
    redemptions = relationship("Redemption", back_populates="reward")

class Redemption(Base):
    __tablename__ = "redemptions"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    user_id = Column(String, ForeignKey("users.id"))
    reward_id = Column(String, ForeignKey("rewards.id"))
    ledger_id = Column(String, ForeignKey("points_transactions.id"))
    status = Column(String, default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="redemptions")
    reward = relationship("Reward", back_populates="redemptions")

class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    user_id = Column(String, ForeignKey("users.id"))
    order_id = Column(String)
    amount = Column(Float)
    points_earned = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="purchases")

class WidgetSettings(Base):
    __tablename__ = "widget_settings"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"), unique=True)
    
    # Text
    header_title = Column(String, default="Test Loyalty Program")
    header_subtitle = Column(String, default="Welcome to")
    join_button_text = Column(String, default="Join Now")
    guest_welcome_msg = Column(String, default="Join our loyalty program to earn points and unlock exclusive rewards.")
    member_welcome_msg = Column(String, default="Available Balance")
    
    # Theme - Colors
    primary_color = Column(String, default="#5c7cfa")
    text_color = Column(String, default="#ffffff")
    button_color = Column(String, default="#5c7cfa")
    button_text_color = Column(String, default="#ffffff")
    
    launcher_color = Column(String, default="#5c7cfa")
    panel_bg_color = Column(String, default="#ffffff")
    panel_text_color = Column(String, default="#333333")
    
    tab_active_color = Column(String, default="#5c7cfa")
    tab_inactive_color = Column(String, default="#999999")
    
    # Placement
    position = Column(String, default="right") # left, right
    side_padding = Column(Integer, default=20)
    bottom_padding = Column(Integer, default=20)
    
    # Relationships
    store = relationship("Store", back_populates="widget_settings")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    user_id = Column(String, ForeignKey("users.id"))
    type = Column(String) # EMAIL, SMS, IN_APP
    title = Column(String)
    message = Column(String)
    status = Column(String, default="PENDING") # PENDING, SENT, FAILED, READ
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")

class EmailTemplate(Base):
    __tablename__ = "email_templates"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"))
    template_type = Column(String)  # welcome, reward, birthday, anniversary
    from_email = Column(String, default="noreply@notification.loyaltyplatform.in")
    subject = Column(String)
    content = Column(String)  # HTML/Text content with template variables
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class NotificationSetting(Base):
    __tablename__ = "notification_settings"

    id = Column(String, primary_key=True, index=True)
    store_id = Column(String, ForeignKey("stores.id"), unique=True)
    
    # Toggle settings for each notification type
    welcome_enabled = Column(Boolean, default=True)
    reward_enabled = Column(Boolean, default=True)
    birthday_enabled = Column(Boolean, default=True)
    anniversary_enabled = Column(Boolean, default=True)
    invite_enabled = Column(Boolean, default=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Add relationship to User model
User.notifications = relationship("Notification", back_populates="user")
