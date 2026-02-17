from app.database import SessionLocal
from app.models.models import PointsTransaction, Activity, User, Store
from datetime import datetime, timedelta
import random
import uuid

def seed_performance_data():
    db = SessionLocal()
    try:
        store_id = "demo-store"
        # Get a user to associate transactions with
        user = db.query(User).filter(User.role == "CUSTOMER").first()
        if not user:
            print("No customer found. Please run seed.py first.")
            return

        print("Seeding performance data...")
        
        # Seed data for the last 30 days
        now = datetime.utcnow()
        for i in range(30):
            date = now - timedelta(days=i)
            
            # Seed Activities (Task Completions)
            num_activities = random.randint(2, 8)
            for _ in range(num_activities):
                activity = Activity(
                    id=str(uuid.uuid4()),
                    store_id=store_id,
                    user_id=user.id,
                    type=random.choice(["SIGNUP", "PURCHASE", "REVIEW"]),
                    data=None,
                    processed=True,
                    created_at=date
                )
                db.add(activity)
            
            # Seed PointsTransactions (Earned vs Redeemed)
            # Earned
            earned_amount = random.randint(100, 1000)
            txn_earn = PointsTransaction(
                id=str(uuid.uuid4()),
                store_id=store_id,
                user_id=user.id,
                type="EARN",
                amount=earned_amount,
                reason="Mock Earning",
                created_at=date
            )
            db.add(txn_earn)
            
            # Redeemed (occasionally)
            if random.random() > 0.7:
                redeemed_amount = random.randint(50, 300)
                txn_redeem = PointsTransaction(
                    id=str(uuid.uuid4()),
                    store_id=store_id,
                    user_id=user.id,
                    type="REDEEM",
                    amount=-redeemed_amount,
                    reason="Mock Redemption",
                    created_at=date
                )
                db.add(txn_redeem)

        db.commit()
        print("✅ Performance data seeded successfully!")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_performance_data()
