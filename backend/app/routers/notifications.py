from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationInDB
from app.models.user import User
from app.routers.deps import get_current_user_for_middleware

router = APIRouter()

@router.get("/", response_model=List[NotificationInDB])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Get notifications for current user"""
    query = select(Notification).where(Notification.user_id == current_user.id)

    if unread_only:
        query = query.where(Notification.is_read == False)

    query = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/unread-count")
async def get_unread_count(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Get count of unread notifications"""
    query = select(func.count(Notification.id)).where(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    )
    result = await db.execute(query)
    count = result.scalar()
    return {"unread_count": count}

@router.patch("/{notification_id}", response_model=NotificationInDB)
async def mark_notification_read(
    notification_id: UUID,
    notification_in: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Mark notification as read/unread"""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalars().first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    if notification_in.is_read is not None:
        notification.is_read = notification_in.is_read

    await db.commit()
    await db.refresh(notification)
    return notification

@router.post("/mark-all-read")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Mark all notifications as read"""
    result = await db.execute(
        select(Notification).where(
            Notification.user_id == current_user.id,
            Notification.is_read == False
        )
    )
    notifications = result.scalars().all()

    for notification in notifications:
        notification.is_read = True

    await db.commit()
    return {"message": f"Marked {len(notifications)} notifications as read"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Delete a notification"""
    result = await db.execute(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == current_user.id
        )
    )
    notification = result.scalars().first()

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    await db.delete(notification)
    await db.commit()
    return {"message": "Notification deleted"}
@router.post("/", response_model=NotificationInDB, status_code=status.HTTP_201_CREATED)
async def create_notification(
    notification_in: NotificationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
) -> NotificationInDB:
    """Create a new notification for the current user"""
    new_notification = Notification(
        user_id=current_user.id,
        title=notification_in.title,
        message=notification_in.message,
        type=notification_in.type,
        link=notification_in.link,
    )
    db.add(new_notification)
    await db.commit()
    await db.refresh(new_notification)
    return new_notification

