from app.database import SessionLocal
from app.models.models import User, Store, Organization
from app.services.auth import get_password_hash
import uuid

def create_test_admin():
    db = SessionLocal()
    try:
        email = "testadmin@loyalty.com"
        password = "testadmin123"
        
        # Ensure org exists
        org = db.query(Organization).first()
        if not org:
            org = Organization(id=str(uuid.uuid4()), name="Test Org")
            db.add(org)
            db.commit()
            db.refresh(org)
            
        # Ensure store exists
        store = db.query(Store).first()
        if not store:
            store = Store(
                id=str(uuid.uuid4()),
                name="Test Store",
                organization_id=org.id
            )
            db.add(store)
            db.commit()
            db.refresh(store)
            
        # Create user
        user = User(
            id=str(uuid.uuid4()),
            email=email,
            name="Test Admin",
            password=get_password_hash(password),
            role="ADMIN",
            organization_id=org.id,
            store_id=store.id
        )
        db.add(user)
        db.commit()
        print(f"Created test admin: {email} / {password}")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_test_admin()
