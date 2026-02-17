from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.database import engine, Base
from app.routers import auth, settings, campaigns, rewards, admin, widget, public, notifications
from app.models import models
from sqlalchemy import text

# Create tables
Base.metadata.create_all(bind=engine)

# Lightweight SQLite migration: add users.visitor_id if missing
try:
    with engine.begin() as conn:
        # Ensure new tables are created (e.g., identities)
        # (SQLAlchemy create_all above already handles this for missing tables)

        cols = conn.execute(text("PRAGMA table_info(users)")).fetchall()
        col_names = {c[1] for c in cols}  # (cid, name, type, notnull, dflt_value, pk)
        if "visitor_id" not in col_names:
            conn.execute(text("ALTER TABLE users ADD COLUMN visitor_id VARCHAR"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_visitor_id ON users (visitor_id)"))
except Exception as e:
    # Don't block startup on migration issues; log for visibility.
    print(f"Warning: could not apply visitor_id migration: {e}")

app = FastAPI(title="Loyalty Program API", version="1.0.0")

# Static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(rewards.router)
app.include_router(campaigns.router)
app.include_router(widget.router)
app.include_router(public.router)
app.include_router(settings.router)
app.include_router(notifications.router)

@app.get("/")
async def root():
    return {"message": "Loyalty Program API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
