from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.issue import IssueStatus, IssuePriority

class IssueBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: IssueStatus = IssueStatus.OPEN
    priority: IssuePriority = IssuePriority.MEDIUM
    assigned_to_id: Optional[UUID] = None

class IssueCreate(IssueBase):
    pass

class IssueUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[IssueStatus] = None
    priority: Optional[IssuePriority] = None
    assigned_to_id: Optional[UUID] = None

class IssueInDB(IssueBase):
    id: UUID
    client_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
