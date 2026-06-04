from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.notification import Notification
from app.schemas.notification import NotificationCreate
from typing import List
import uuid

class NotificationService:
    """Service for managing notifications"""

    @staticmethod
    async def create_notification(
        db: AsyncSession,
        notification_data: NotificationCreate
    ):
        """Create a new notification"""
        notification = Notification(**notification_data.model_dump())
        db.add(notification)
        await db.commit()
        await db.refresh(notification)
        return notification

    @staticmethod
    async def create_bulk_notifications(
        db: AsyncSession,
        user_ids: List[uuid.UUID],
        title: str,
        message: str,
        notification_type: str = "INFO",
        link: str = None
    ):
        """Create notifications for multiple users"""
        notifications = []
        for user_id in user_ids:
            notification = Notification(
                user_id=user_id,
                title=title,
                message=message,
                type=notification_type,
                link=link
            )
            db.add(notification)
            notifications.append(notification)

        await db.commit()
        return notifications
