"""
Initialize database tables
"""
from app.database import Base, engine
from app.models.models import User, Store, Tier, Campaign, Activity, PointsTransaction, CustomerTier, Reward, Redemption, Purchase, Organization, WidgetSettings

print("Dropping existing tables...")
Base.metadata.drop_all(bind=engine)
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Tables created successfully!")
