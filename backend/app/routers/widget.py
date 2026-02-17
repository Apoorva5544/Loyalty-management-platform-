from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database import get_db
from app.models import models
from app.schemas import schemas
from app.services.auth import get_current_user

router = APIRouter(
    prefix="/api/admin/widget",
    tags=["widget"]
)

@router.get("", response_model=schemas.WidgetSettingsResponse)
def get_widget_settings(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    settings = db.query(models.WidgetSettings).filter(models.WidgetSettings.store_id == current_user.store_id).first()
    
    if not settings:
        # Create default settings if not exists
        settings = models.WidgetSettings(
            id=str(uuid.uuid4()),
            store_id=current_user.store_id
        )
        db.add(settings)
        db.commit()
        db.refresh(settings)
    
    return settings

@router.put("", response_model=schemas.WidgetSettingsResponse)
def update_widget_settings(
    settings_update: schemas.WidgetSettingsUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    settings = db.query(models.WidgetSettings).filter(models.WidgetSettings.store_id == current_user.store_id).first()
    
    if not settings:
        settings = models.WidgetSettings(
            id=str(uuid.uuid4()),
            store_id=current_user.store_id
        )
        db.add(settings)
    
    update_data = settings_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(settings, key, value)
    
    db.commit()
    db.refresh(settings)
    return settings
