from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime, date, timezone
from typing import Optional, List
from decimal import Decimal
from app.models.task import TaskStatus, TaskPriority
from app.models.billing import InvoiceStatus
from app.schemas.user import UserInDB

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: Optional[datetime] = None
    assigned_to_id: UUID
    device_id: Optional[UUID] = None
    client_id: Optional[UUID] = None

    @field_validator("due_date", mode="before")
    @classmethod
    def strip_timezone(cls, v):
        """Strip timezone info so it matches TIMESTAMP WITHOUT TIME ZONE column."""
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if isinstance(v, datetime) and v.tzinfo is not None:
            # Convert to UTC first, then remove tzinfo
            v = v.astimezone(timezone.utc).replace(tzinfo=None)
        return v

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[datetime] = None
    assigned_to_id: Optional[UUID] = None

    @field_validator("due_date", mode="before")
    @classmethod
    def strip_timezone(cls, v):
        """Strip timezone info so it matches TIMESTAMP WITHOUT TIME ZONE column."""
        if v is None:
            return v
        if isinstance(v, str):
            v = datetime.fromisoformat(v)
        if isinstance(v, datetime) and v.tzinfo is not None:
            v = v.astimezone(timezone.utc).replace(tzinfo=None)
        return v

class TaskInDB(TaskBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    assigned_to: UserInDB

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    client_id: UUID
    amount: Decimal
    status: InvoiceStatus = InvoiceStatus.DRAFT
    file_path: Optional[str] = None
    due_date: date

class InvoiceCreate(InvoiceBase):
    pass

class InvoiceInDB(InvoiceBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class PaymentBase(BaseModel):
    client_id: UUID
    invoice_id: UUID
    amount: Decimal
    payment_date: date = date.today()

class PaymentCreate(PaymentBase):
    pass

class PaymentInDB(PaymentBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
