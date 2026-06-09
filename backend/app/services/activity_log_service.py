from sqlalchemy.ext.asyncio import AsyncSession
from app.models.activity_log import ActivityLog
from app.models.user import UserRole
from typing import Optional
import uuid


class ActivityLogService:
    """Central service for audit logging — writes to the audit_log table."""

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
        ip_address: Optional[str] = None,
        role: Optional[UserRole] = None,
    ) -> ActivityLog:
        log = ActivityLog(
            user_id=user_id,
            user_name=user_name,
            role=role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            old_values=previous_value,
            new_values=new_value,
            extra_data=extra_data,
            ip_address=ip_address,
        )
        db.add(log)
        await db.commit()
        return log
