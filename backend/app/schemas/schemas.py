from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

# Auth Schemas
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    name: str

class UserResponse(UserBase):
    id: str
    role: str
    points: int
    lifetime_points: int
    tier_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Store/Company Schemas
class CompanyDetailsUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    org_id: Optional[str] = None
    client_portal_id: Optional[str] = None
    company_url: Optional[str] = None
    currency: Optional[str] = None
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

class CompanyDetailsResponse(BaseModel):
    id: str
    name: str
    logo_url: Optional[str] = None
    org_id: Optional[str] = None
    client_portal_id: Optional[str] = None
    company_url: Optional[str] = None
    currency: str
    street: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None

    class Config:
        from_attributes = True

# Campaign Schemas
class CampaignCreate(BaseModel):
    name: str
    description: str
    trigger_type: str  # PURCHASE, SIGNUP, REFERRAL, REVIEW
    points_type: str = "FIXED"
    points_value: float
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class CampaignResponse(BaseModel):
    id: str
    name: str
    description: str
    trigger_type: str
    points_type: str
    points_value: float
    active: bool
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Activity Schemas
class ActivityCreate(BaseModel):
    type: str
    data: Optional[str] = None

class ActivityResponse(BaseModel):
    id: str
    type: str
    data: Optional[str] = None
    processed: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Ledger Schemas
class PointsTransactionResponse(BaseModel):
    id: str
    type: str
    amount: int
    reason: str
    reference_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# Reward Schemas
class RewardCreate(BaseModel):
    name: str
    description: str
    cost: int
    image: Optional[str] = None
    stock: Optional[int] = None

class RewardResponse(BaseModel):
    id: str
    name: str
    description: str
    cost: int
    image: Optional[str] = None
    stock: Optional[int] = None
    active: bool
    created_at: datetime

    class Config:
        from_attributes = True

# Widget Schemas
class WidgetSettingsUpdate(BaseModel):
    header_title: Optional[str] = None
    header_subtitle: Optional[str] = None
    join_button_text: Optional[str] = None
    primary_color: Optional[str] = None
    text_color: Optional[str] = None
    button_color: Optional[str] = None
    position: Optional[str] = None
    side_padding: Optional[int] = None
    bottom_padding: Optional[int] = None

class WidgetSettingsResponse(BaseModel):
    header_title: str
    header_subtitle: str
    join_button_text: str
    primary_color: str
    text_color: str
    button_color: str
    position: str
    side_padding: int
    bottom_padding: int

    class Config:
        from_attributes = True
