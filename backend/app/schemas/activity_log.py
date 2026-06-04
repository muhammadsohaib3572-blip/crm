from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ActivityLogBase(BaseModel):
    action: str
    entity_type: str
    entity_id: Optional[UUID] = None
    description: str
    user_name: str
    previous_value: Optional[str] = None
    new_value: Optional[str] = None
    extra_data: Optional[dict] = None
    ip_address: Optional[str] = None

class ActivityLogCreate(ActivityLogBase):
    user_id: UUID

class ActivityLogInDB(ActivityLogBase):
    id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
