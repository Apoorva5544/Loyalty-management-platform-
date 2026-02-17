import uuid
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from sqlalchemy.orm import Session
from app.models.models import Notification, User, NotificationSetting, EmailTemplate, Store
from datetime import datetime

# SMTP Configuration
SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")

def send_email_smtp(to_email: str, subject: str, html_content: str):
    """
    Sends an email using SMTP.
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        print(f"[SMTP] Skipping email to {to_email} (SMTP credentials not set)")
        print(f"Subject: {subject}")
        return False

    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USER
        msg["To"] = to_email
        msg["Subject"] = subject

        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.send_message(msg)
        
        print(f"[SMTP] Successfully sent email to {to_email}")
        return True
    except Exception as e:
        print(f"[SMTP] Failed to send email to {to_email}: {e}")
        return False

def send_notification(db: Session, user_id: str, title: str, message: str, type: str = "IN_APP", context: dict = None):
    """
    Creates a notification record and sends (Email/SMS).
    
    Args:
        db: Database session
        user_id: Target user ID
        title: Notification title (or subject)
        message: Notification message (or content)
        type: Notification type (IN_APP, EMAIL, SMS)
        context: Dictionary of data for merge tags (e.g. {"REWARD_NAME": "Free Coffee"})
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return

    # 1. Check Settings & Load Template for EMAIL type
    if type == "EMAIL":
        # Map internal event types to template types
        template_type = None
        if "Welcome" in title: template_type = "welcome"
        elif "Reward" in title: template_type = "reward"
        elif "Birthday" in title: template_type = "birthday"
        elif "Anniversary" in title: template_type = "anniversary"
        elif "Join" in title or "Invite" in title: template_type = "invite"
        
        if template_type:
            # Check if enabled in settings
            settings = db.query(NotificationSetting).filter(
                NotificationSetting.store_id == user.store_id
            ).first()
            
            if settings:
                is_enabled = getattr(settings, f"{template_type}_enabled", True)
                if not is_enabled:
                    print(f"[EMAIL] Skipped {template_type} email to {user.email} (Disabled in settings)")
                    return

            # Load Template
            template = db.query(EmailTemplate).filter(
                EmailTemplate.store_id == user.store_id,
                EmailTemplate.template_type == template_type
            ).first()
            
            if template and template.enabled:
                title = template.subject
                message = template.content
                
                # Resolve Merge Tags
                # Base context
                store = db.query(Store).filter(Store.id == user.store_id).first()
                merge_data = {
                    "MEMBER_FIRST_NAME": user.name or "Member",
                    "COMPANY_NAME": store.name if store else "Loyalty Program",
                    "BRAND_NAME": store.name if store else "Brand",
                    "POINTS_BALANCE": str(user.points),
                    "REWARD_NAME": "Reward", # Default
                    "BONUS_POINTS": "0", # Default
                }
                
                # Overlay provided context
                if context:
                    merge_data.update(context)
                
                # Replace tags
                for key, value in merge_data.items():
                    title = title.replace(f"{{{{{key}}}}}", str(value))
                    message = message.replace(f"{{{{{key}}}}}", str(value))

    # 2. Idempotency Check (Prevent duplicates for same event/day)
    # Simple check: Don't send same title to same user within last 5 minutes
    # In production, use a more robust key or time window
    recent = db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.title == title,
        Notification.created_at > datetime.utcnow().replace(minute=datetime.utcnow().minute - 5)
    ).first()
    
    if recent:
        print(f"[{type}] Skipped duplicate notification to {user.email}: {title}")
        return

    # 3. Create Record
    notification = Notification(
        id=str(uuid.uuid4()),
        store_id=user.store_id,
        user_id=user_id,
        type=type,
        title=title,
        message=message,
        status="SENT" # Simulating instant send
    )
    db.add(notification)
    db.commit()
    
    # 4. Send Real Email
    if type == "EMAIL" and user.email:
        # Convert newlines to <br> if message is plain text but we send HTML
        html_body = message.replace("\n", "<br>")
        send_email_smtp(user.email, title, html_body)
    else:
        print(f"[{type}] Notification to {user.email}: {title}")
