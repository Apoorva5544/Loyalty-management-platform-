from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
from app.database import get_db
from app.models.models import EmailTemplate, NotificationSetting, User
from app.services.auth import get_current_admin
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/api/admin/notifications", tags=["notifications"])

class EmailTemplateCreate(BaseModel):
    template_type: str
    from_email: Optional[str] = "noreply@notification.loyaltyplatform.in"
    subject: str
    content: str
    enabled: bool = True

class EmailTemplateResponse(BaseModel):
    id: str
    store_id: str
    template_type: str
    from_email: str
    subject: str
    content: str
    enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class NotificationSettingUpdate(BaseModel):
    welcome_enabled: Optional[bool] = None
    reward_enabled: Optional[bool] = None
    birthday_enabled: Optional[bool] = None
    anniversary_enabled: Optional[bool] = None
    invite_enabled: Optional[bool] = None

class NotificationSettingResponse(BaseModel):
    id: str
    store_id: str
    welcome_enabled: bool
    reward_enabled: bool
    birthday_enabled: bool
    anniversary_enabled: bool
    invite_enabled: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Default email templates
DEFAULT_TEMPLATES = {
    "welcome": {
        "subject": "Welcome to {{BRAND_NAME}}'s Loyalty Program",
        "content": """Dear {{MEMBER_FIRST_NAME}},

Welcome on board!
Earn points for each task you complete, and use them to redeem exciting rewards.

Here's what we have in store for you:

{{REWARDMAP_CRITERIA_REWARD}}

Explore the store to get started.

Cheers,
{{COMPANY_NAME}} Team"""
    },
    "reward": {
        "subject": "You've Earned a Reward!",
        "content": """Dear {{MEMBER_FIRST_NAME}},

Congratulations! You've earned a new reward.

Reward: {{REWARD_NAME}}
Points Used: {{POINTS_USED}}

Thank you for being a loyal customer!

Cheers,
{{COMPANY_NAME}} Team"""
    },
    "birthday": {
        "subject": "Happy Birthday from {{BRAND_NAME}}!",
        "content": """Dear {{MEMBER_FIRST_NAME}},

Happy Birthday! 🎉

To celebrate your special day, we've added {{BONUS_POINTS}} bonus points to your account.

Enjoy your day!

Cheers,
{{COMPANY_NAME}} Team"""
    },
    "anniversary": {
        "subject": "Happy Anniversary!",
        "content": """Dear {{MEMBER_FIRST_NAME}},

Happy Anniversary! 🎊

Thank you for being with us. We've added {{BONUS_POINTS}} bonus points to celebrate this special milestone.

Cheers,
{{COMPANY_NAME}} Team"""
    },
    "invite": {
        "subject": "Join {{BRAND_NAME}}'s Loyalty Program",
        "content": """Dear Valued Customer,

You're missing out on amazing rewards! Join our loyalty program today and start earning points with every purchase.

Here's what you'll get:

{{REWARDMAP_CRITERIA_REWARD}}

Join now and get {{BONUS_POINTS}} welcome bonus points!

Click here to join: {{JOIN_LINK}}

Cheers,
{{COMPANY_NAME}} Team"""
    }
}

@router.get("/settings", response_model=NotificationSettingResponse)
async def get_notification_settings(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get notification settings for the store"""
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.store_id == current_user.store_id
    ).first()
    
    if not settings:
        # Create default settings
        settings = NotificationSetting(
            id=str(uuid.uuid4()),
            store_id=current_user.store_id
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings

@router.put("/settings", response_model=NotificationSettingResponse)
async def update_notification_settings(
    settings_data: NotificationSettingUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update notification settings"""
    settings = db.query(NotificationSetting).filter(
        NotificationSetting.store_id == current_user.store_id
    ).first()
    
    if not settings:
        settings = NotificationSetting(
            id=str(uuid.uuid4()),
            store_id=current_user.store_id
        )
        db.add(settings)
    
    # Update only provided fields
    update_data = settings_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(settings, field, value)
    
    db.commit()
    db.refresh(settings)
    return settings

@router.get("/templates", response_model=List[EmailTemplateResponse])
async def get_email_templates(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get all email templates for the store"""
    templates = db.query(EmailTemplate).filter(
        EmailTemplate.store_id == current_user.store_id
    ).all()
    
    # If no templates exist, create defaults
    if not templates:
        for template_type, template_data in DEFAULT_TEMPLATES.items():
            template = EmailTemplate(
                id=str(uuid.uuid4()),
                store_id=current_user.store_id,
                template_type=template_type,
                subject=template_data["subject"],
                content=template_data["content"]
            )
            db.add(template)
        db.commit()
        
        templates = db.query(EmailTemplate).filter(
            EmailTemplate.store_id == current_user.store_id
        ).all()
    
    return templates

@router.get("/templates/{template_type}", response_model=EmailTemplateResponse)
async def get_email_template(
    template_type: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Get specific email template"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.store_id == current_user.store_id,
        EmailTemplate.template_type == template_type
    ).first()
    
    if not template and template_type in DEFAULT_TEMPLATES:
        # Create default template
        template_data = DEFAULT_TEMPLATES[template_type]
        template = EmailTemplate(
            id=str(uuid.uuid4()),
            store_id=current_user.store_id,
            template_type=template_type,
            subject=template_data["subject"],
            content=template_data["content"]
        )
        db.add(template)
        db.commit()
        db.refresh(template)
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return template

@router.put("/templates/{template_type}", response_model=EmailTemplateResponse)
async def update_email_template(
    template_type: str,
    template_data: EmailTemplateCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Update email template"""
    template = db.query(EmailTemplate).filter(
        EmailTemplate.store_id == current_user.store_id,
        EmailTemplate.template_type == template_type
    ).first()
    
    if not template:
        # Create new template
        template = EmailTemplate(
            id=str(uuid.uuid4()),
            store_id=current_user.store_id,
            template_type=template_type
        )
        db.add(template)
    
    # Update fields
    template.from_email = template_data.from_email
    template.subject = template_data.subject
    template.content = template_data.content
    template.enabled = template_data.enabled
    
    db.commit()
    db.refresh(template)
    return template
class EmailPreviewRequest(BaseModel):
    template_type: str
    subject: str
    content: str
    from_email: str

class EmailPreviewResponse(BaseModel):
    subject: str
    content: str
    from_email: str
    preview_html: str

@router.post("/preview", response_model=EmailPreviewResponse)
async def preview_email_template(
    preview_data: EmailPreviewRequest,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """Preview email template with sample data"""
    from app.models.models import Store
    
    # Get store information for template variables
    store = db.query(Store).filter(Store.id == current_user.store_id).first()
    
    # Sample data for template variables
    sample_data = {
        "{{MEMBER_FIRST_NAME}}": "John",
        "{{COMPANY_NAME}}": store.name if store else "Your Company",
        "{{BRAND_NAME}}": store.name if store else "Your Brand",
        "{{REWARD_NAME}}": "10% Off Coupon",
        "{{POINTS_USED}}": "500",
        "{{BONUS_POINTS}}": "100",
        "{{POINTS_BALANCE}}": "1,250",
        "{{JOIN_LINK}}": "https://yourstore.com/join",
        "{{REWARDMAP_CRITERIA_REWARD}}": """• Spend ₹1000 - Get 100 points
• Write a review - Get 50 points  
• Refer a friend - Get 200 points
• Birthday bonus - Get 100 points"""
    }
    
    # Replace template variables in subject and content
    preview_subject = preview_data.subject
    preview_content = preview_data.content
    
    for placeholder, value in sample_data.items():
        preview_subject = preview_subject.replace(placeholder, value)
        preview_content = preview_content.replace(placeholder, value)
    
    # Generate HTML preview
    preview_html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Email Preview</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f5f5f5;
            }}
            .email-container {{
                background-color: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }}
            .email-header {{
                border-bottom: 2px solid #e5e7eb;
                padding-bottom: 20px;
                margin-bottom: 30px;
            }}
            .email-subject {{
                font-size: 24px;
                font-weight: bold;
                color: #1f2937;
                margin: 0;
            }}
            .email-from {{
                color: #6b7280;
                font-size: 14px;
                margin-top: 5px;
            }}
            .email-content {{
                white-space: pre-line;
                font-size: 16px;
                line-height: 1.8;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="email-header">
                <h1 class="email-subject">{preview_subject}</h1>
                <div class="email-from">From: {preview_data.from_email}</div>
            </div>
            <div class="email-content">{preview_content}</div>
        </div>
    </body>
    </html>
    """
    
    return EmailPreviewResponse(
        subject=preview_subject,
        content=preview_content,
        from_email=preview_data.from_email,
        preview_html=preview_html
    )