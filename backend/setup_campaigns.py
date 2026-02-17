#!/usr/bin/env python3
"""
Setup script to create default campaigns for SIGNUP and REVIEW events.
Run this after setting up your store to enable automatic points awarding.
"""

import uuid
from sqlalchemy.orm import Session
from app.database import get_db, engine
from app.models.models import Campaign, Store

def create_default_campaigns():
    """Create default campaigns for SIGNUP and REVIEW events"""
    
    # Get database session
    db = Session(bind=engine)
    
    try:
        # Get all stores
        stores = db.query(Store).all()
        
        if not stores:
            print("No stores found. Please create a store first.")
            return
        
        for store in stores:
            print(f"Setting up campaigns for store: {store.name} ({store.id})")
            
            # Check if SIGNUP campaign already exists
            signup_campaign = db.query(Campaign).filter(
                Campaign.store_id == store.id,
                Campaign.trigger_type == "SIGNUP"
            ).first()
            
            if not signup_campaign:
                # Create SIGNUP campaign
                signup_campaign = Campaign(
                    id=str(uuid.uuid4()),
                    store_id=store.id,
                    name="Welcome Bonus",
                    description="Welcome bonus points for new members",
                    trigger_type="SIGNUP",
                    points_type="FIXED",
                    points_value=100,
                    active=True
                )
                db.add(signup_campaign)
                print("✅ Created SIGNUP campaign (100 points)")
            else:
                print("ℹ️  SIGNUP campaign already exists")
            
            # Check if REVIEW campaign already exists
            review_campaign = db.query(Campaign).filter(
                Campaign.store_id == store.id,
                Campaign.trigger_type == "REVIEW"
            ).first()
            
            if not review_campaign:
                # Create REVIEW campaign
                review_campaign = Campaign(
                    id=str(uuid.uuid4()),
                    store_id=store.id,
                    name="Review Reward",
                    description="Points for leaving product reviews",
                    trigger_type="REVIEW",
                    points_type="FIXED",
                    points_value=50,
                    active=True
                )
                db.add(review_campaign)
                print("✅ Created REVIEW campaign (50 points)")
            else:
                print("ℹ️  REVIEW campaign already exists")
        
        # Commit all changes
        db.commit()
        print("\n🎉 Campaign setup completed successfully!")
        print("\nNow customers will automatically earn:")
        print("• 100 points for signing up")
        print("• 50 points for leaving reviews")
        
    except Exception as e:
        print(f"❌ Error setting up campaigns: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("Setting up default loyalty campaigns...")
    create_default_campaigns()