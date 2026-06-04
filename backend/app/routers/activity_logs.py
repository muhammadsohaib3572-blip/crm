from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.models.activity_log import ActivityLog
from app.schemas.activity_log import ActivityLogInDB
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role

router = APIRouter()

@router.get("/", response_model=List[ActivityLogInDB])
async def get_activity_logs(
    skip: int = 0,
    limit: int = 100,
    entity_type: str = None,
    entity_id: UUID = None,
    user_id: UUID = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Get activity logs with filters (Admin/Manager only)"""
    query = select(ActivityLog)

    if entity_type:
        query = query.where(ActivityLog.entity_type == entity_type)

    if entity_id:
        query = query.where(ActivityLog.entity_id == entity_id)

    if user_id:
        query = query.where(ActivityLog.user_id == user_id)

    query = query.order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/my-activity", response_model=List[ActivityLogInDB])
async def get_my_activity(
    skip: int = 0,
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get activity logs for current user"""
    query = select(ActivityLog).where(
        ActivityLog.user_id == current_user.id
    ).order_by(ActivityLog.created_at.desc()).offset(skip).limit(limit)

    result = await db.execute(query)
    return result.scalars().all()
