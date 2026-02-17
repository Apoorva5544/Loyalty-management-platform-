from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.models import Reward, User
from app.schemas.schemas import RewardCreate, RewardResponse
from app.services.auth import get_current_admin
import uuid

router = APIRouter(prefix="/api/admin/rewards", tags=["admin-rewards"])

@router.get("", response_model=List[RewardResponse])
async def get_rewards(
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    rewards = db.query(Reward).filter(Reward.store_id == current_user.store_id).all()
    return rewards

@router.post("", response_model=RewardResponse)
async def create_reward(
    reward_data: RewardCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    new_reward = Reward(
        id=str(uuid.uuid4()),
        store_id=current_user.store_id,
        **reward_data.dict()
    )
    db.add(new_reward)
    db.commit()
    db.refresh(new_reward)
    return new_reward

@router.put("/{reward_id}", response_model=RewardResponse)
async def update_reward(
    reward_id: str,
    reward_data: RewardCreate,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    for field, value in reward_data.dict().items():
        setattr(reward, field, value)
    
    db.commit()
    db.refresh(reward)
    return reward

@router.delete("/{reward_id}")
async def delete_reward(
    reward_id: str,
    current_user: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    reward = db.query(Reward).filter(Reward.id == reward_id).first()
    if not reward:
        raise HTTPException(status_code=404, detail="Reward not found")
    
    db.delete(reward)
    db.commit()
    return {"message": "Reward deleted successfully"}
