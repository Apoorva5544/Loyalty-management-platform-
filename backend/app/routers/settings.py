from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import User, Store
from app.schemas.schemas import CompanyDetailsUpdate, CompanyDetailsResponse
from app.services.auth import get_current_admin

router = APIRouter(prefix="/api/admin/settings", tags=["admin-settings"])

@router.get("/company", response_model=CompanyDetailsResponse)
async def get_company_details(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    # Get the demo store (in production, get from user's store)
    store = db.query(Store).filter(Store.id == "demo-store").first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    return store

@router.put("/company", response_model=CompanyDetailsResponse)
async def update_company_details(
    company_data: CompanyDetailsUpdate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    store = db.query(Store).filter(Store.id == "demo-store").first()
    if not store:
        raise HTTPException(status_code=404, detail="Store not found")
    
    # Update fields
    update_data = company_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(store, field, value)
    
    db.commit()
    db.refresh(store)
    
    return store
