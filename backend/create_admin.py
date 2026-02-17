"""
Script to create an admin user for the Loyalty Platform
Run this script to create a test admin account
"""

from app.database import SessionLocal
from app.models.models import User, Store
from app.services.auth import get_password_hash
import uuid

def create_admin_user():
    db = SessionLocal()
    
    try:
        # Check if admin already exists
        admin_email = "admin@loyaltyplatform.com"
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        
        if existing_admin:
            print(f"Admin user already exists: {admin_email}")
            return
        
        # Create a default store first
        store = db.query(Store).first()
        if not store:
            store = Store(
                id=str(uuid.uuid4()),
                name="Demo Store",
                company_url="https://demo.loyaltyplatform.com",
                organization_id="default-org"
            )
            db.add(store)
            db.commit()
            db.refresh(store)
            print(f"Created default store: {store.name}")
        
        # Create admin user
        admin_user = User(
            id=str(uuid.uuid4()),
            email=admin_email,
            name="Admin User",
            password=get_password_hash("admin123"),  # Default password
            role="ADMIN",
            store_id=store.id,
            points=0
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        print("\n✅ Admin user created successfully!")
        print(f"Email: {admin_email}")
        print(f"Password: admin123")
        print(f"\nYou can now login at http://localhost:3000/login")
        
    except Exception as e:
        print(f"Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
