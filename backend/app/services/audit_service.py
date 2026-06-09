"""
AuditService — query helpers over the audit_log table.
All writes use ActivityLogService; this module only provides read helpers
for the activity-logs router.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from app.models.activity_log import ActivityLog


class AuditService:

    @staticmethod
    async def get_audit_logs(
        db: AsyncSession,
        user_id: Optional[str] = None,
        action_type: Optional[str] = None,
        entity_type: Optional[str] = None,
        limit: int = 100,
        offset: int = 0,
    ):
        query = select(ActivityLog)
        if user_id:
            import uuid as _uuid
            try:
                query = query.where(ActivityLog.user_id == _uuid.UUID(str(user_id)))
            except ValueError:
                pass
        if action_type:
            query = query.where(ActivityLog.action == action_type)
        if entity_type:
            query = query.where(ActivityLog.entity_type == entity_type)
        query = query.order_by(ActivityLog.created_at.desc()).offset(offset).limit(limit)
        result = await db.execute(query)
        return result.scalars().all()
