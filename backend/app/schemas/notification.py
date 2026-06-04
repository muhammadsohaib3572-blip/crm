from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.notification import NotificationType

class NotificationBase(BaseModel):
    title: str
    message: str
    type: NotificationType = NotificationType.INFO
    link: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: UUID

class NotificationUpdate(BaseModel):
    is_read: Optional[bool] = None

class NotificationInDB(NotificationBase):
    id: UUID
    user_id: UUID
    is_read: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
