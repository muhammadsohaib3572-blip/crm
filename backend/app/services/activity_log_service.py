from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.activity_log import ActivityLog
from typing import Optional
import uuid

class ActivityLogService:
    """Service for logging user activities"""

    @staticmethod
    async def log_activity(
        db: AsyncSession,
        user_id: uuid.UUID,
        user_name: str,
        action: str,
        entity_type: str,
        description: str,
        entity_id: Optional[uuid.UUID] = None,
        previous_value: Optional[str] = None,
        new_value: Optional[str] = None,
        extra_data: Optional[dict] = None,
        ip_address: Optional[str] = None
    ):
        """Create an activity log entry"""
        log = ActivityLog(
            user_id=user_id,
            user_name=user_name,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            previous_value=previous_value,
            new_value=new_value,
            extra_data=extra_data,
            ip_address=ip_address
        )
        db.add(log)
        await db.commit()
        return log
