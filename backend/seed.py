"""
Seed script to populate the database with initial data
"""
from app.database import SessionLocal
from app.models.models import User, Store, Tier, Campaign, Reward, WidgetSettings, Organization
from app.services.auth import get_password_hash
import uuid

def seed_database():
    db = SessionLocal()
    
    try:
        # Create Organization
        org = Organization(
            id=str(uuid.uuid4()),
            name="Demo Organization"
        )
        db.add(org)
        db.commit() # Commit to get ID if needed, though we set it manually
        
        # Create admin user
        admin = User(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            email="admin@loyaltyapp.com",
            name="Admin User",
            password=get_password_hash("admin123"),
            role="ADMIN"
        )
        db.add(admin)
        
        # Create demo customer
        customer = User(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            email="customer@example.com",
            phone_number="555-0199",
            dob="1990-01-01",
            name="Demo Customer",
            password=get_password_hash("customer123"),
            role="CUSTOMER",
            store_id="demo-store",
            points=1500,
            lifetime_points=2500
        )
        db.add(customer)
        
        # Create demo store (Dummy Store)
        store = Store(
            id="demo-store",
            organization_id=org.id,
            name="Dummy Store",
            owner_id=admin.id,
            currency="INR",
            org_id="6006352752",
            client_portal_id="5003777921",
            company_url="http://localhost:3000"
        )
        db.add(store)
        
        # Link admin to store (as owner/manager context)
        admin.store_id = store.id
        
        # Create second store (Fashion Store)
        store2 = Store(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            name="Fashion Store",
            owner_id=admin.id,
            currency="USD",
            company_url="https://fashion.example.com"
        )
        db.add(store2)
        
        # Create tiers (Linked to Store 1 for now, or we can make tiers Org-level later if needed)
        # Current model has Tier linked to Store. Let's add tiers for Dummy Store.
        tiers_data = [
            {"id": "bronze", "name": "Bronze", "min_points": 0, "multiplier": 1.0, "benefits": '["Basic Rewards", "Email Support"]'},
            {"id": "silver", "name": "Silver", "min_points": 1000, "multiplier": 1.2, "benefits": '["1.2x Points", "Priority Support", "Exclusive Offers"]'},
            {"id": "gold", "name": "Gold", "min_points": 5000, "multiplier": 1.5, "benefits": '["1.5x Points", "VIP Events", "Personal Account Manager"]'},
        ]
        
        for tier_data in tiers_data:
            tier = Tier(store_id=store.id, **tier_data)
            db.add(tier)
            
        # Clone tiers for Store 2
        for tier_data in tiers_data:
            # Generate new IDs for store 2 tiers
            new_data = tier_data.copy()
            new_data["id"] = f"{tier_data['id']}_2"
            tier = Tier(store_id=store2.id, **new_data)
            db.add(tier)
        
        # Create campaigns for Dummy Store
        campaigns_data = [
            {"name": "Become a Member", "description": "Sign up and join our loyalty program", "trigger_type": "SIGNUP", "points_value": 100},
            {"name": "Make Your First Purchase", "description": "Complete your first order", "trigger_type": "PURCHASE", "points_value": 500},
            {"name": "Write a Review", "description": "Share your feedback with us", "trigger_type": "REVIEW", "points_value": 200},
        ]
        
        for campaign_data in campaigns_data:
            campaign = Campaign(id=str(uuid.uuid4()), store_id=store.id, **campaign_data)
            db.add(campaign)
            
        # Create campaigns for Fashion Store
        for campaign_data in campaigns_data:
            campaign = Campaign(id=str(uuid.uuid4()), store_id=store2.id, **campaign_data)
            db.add(campaign)
        
        # Create widget settings for Dummy Store
        widget = WidgetSettings(
            id=str(uuid.uuid4()),
            store_id=store.id,
            header_title="Dummy Store Loyalty",
            primary_color="#5c7cfa",
            button_color="#5c7cfa"
        )
        db.add(widget)
        
        # Create widget settings for Fashion Store
        widget2 = WidgetSettings(
            id=str(uuid.uuid4()),
            store_id=store2.id,
            header_title="Fashion Rewards",
            primary_color="#e91e63", # Pink for fashion
            button_color="#e91e63"
        )
        db.add(widget2)
        
        # Create rewards for Main Store
        rewards_data = [
            {"name": "$10 Off Coupon", "description": "Get $10 off your next purchase", "cost": 1000},
            {"name": "Free Shipping", "description": "Free shipping on your next order", "cost": 500},
            {"name": "Exclusive Product", "description": "Access to limited edition products", "cost": 2000},
        ]
        
        for reward_data in rewards_data:
            reward = Reward(id=str(uuid.uuid4()), store_id=store.id, **reward_data)
            db.add(reward)
            
        # Create rewards for Fashion Store
        for reward_data in rewards_data:
            reward = Reward(id=str(uuid.uuid4()), store_id=store2.id, **reward_data)
            db.add(reward)
        
        db.commit()
        print("✅ Database seeded successfully!")
        print(f"🏢 Organization: {org.name} ({org.id})")
        print(f"🏪 Main Store ID: {store.id}")
        print(f"🏪 Fashion Store ID: {store2.id}")
        print("📧 Admin Login: admin@loyaltyapp.com")
        print("🔑 Password: admin123")
        
    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
