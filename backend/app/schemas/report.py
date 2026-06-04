from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from app.models.report import ReportType

class FieldReportBase(BaseModel):
    client_id: UUID
    device_id: Optional[UUID] = None
    report_type: ReportType
    title: str
    summary: Optional[str] = None
    notes: Optional[str] = None
    report_date: date = date.today()
    attachments: Optional[List[str]] = None

class FieldReportCreate(FieldReportBase):
    pass

class FieldReportUpdate(BaseModel):
    client_id: Optional[UUID] = None
    device_id: Optional[UUID] = None
    report_type: Optional[ReportType] = None
    title: Optional[str] = None
    summary: Optional[str] = None
    notes: Optional[str] = None
    report_date: Optional[date] = None
    attachments: Optional[List[str]] = None

class FieldReportInDB(FieldReportBase):
    id: UUID
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
