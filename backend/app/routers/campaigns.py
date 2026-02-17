import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import User, Campaign
from app.schemas.schemas import CampaignCreate, CampaignResponse
from app.services.auth import get_current_admin

router = APIRouter(prefix="/api/admin/campaigns", tags=["campaigns"])

@router.get("", response_model=List[CampaignResponse])
async def get_campaigns(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).filter(Campaign.store_id == current_user.store_id).all()
    return campaigns

@router.post("", response_model=CampaignResponse)
async def create_campaign(
    campaign_in: CampaignCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    campaign = Campaign(
        id=str(uuid.uuid4()),
        store_id=current_user.store_id,
        **campaign_in.dict()
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign

@router.put("/{campaign_id}", response_model=CampaignResponse)
async def update_campaign(
    campaign_id: str,
    campaign_in: CampaignCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.store_id == current_user.store_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    for field, value in campaign_in.dict().items():
        setattr(campaign, field, value)
        
    db.commit()
    db.refresh(campaign)
    return campaign

@router.delete("/{campaign_id}")
async def delete_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.store_id == current_user.store_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}

@router.post("/{campaign_id}/toggle")
async def toggle_campaign(
    campaign_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(
        Campaign.id == campaign_id,
        Campaign.store_id == current_user.store_id
    ).first()
    
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
        
    campaign.active = not campaign.active
    db.commit()
    return {"active": campaign.active}
