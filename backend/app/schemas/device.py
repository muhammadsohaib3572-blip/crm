from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional, List
from app.models.device import DeviceStatus

class DeviceHistoryBase(BaseModel):
    status: DeviceStatus
    notes: Optional[str] = None

class DeviceHistoryCreate(DeviceHistoryBase):
    device_id: UUID
    changed_by_id: UUID

class DeviceHistoryInDB(DeviceHistoryBase):
    id: UUID
    device_id: UUID
    changed_by_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class DeviceBase(BaseModel):
    name: str
    serial_number: str
    status: DeviceStatus = DeviceStatus.UNDER_DEVELOPMENT
    installation_location: Optional[str] = None
    client_id: Optional[UUID] = None
    assigned_hardware_id: Optional[UUID] = None
    assigned_agronomist_id: Optional[UUID] = None
    notes: Optional[str] = None

class DeviceCreate(DeviceBase):
    pass

class DeviceUpdate(BaseModel):
    name: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[DeviceStatus] = None
    installation_location: Optional[str] = None
    client_id: Optional[UUID] = None
    assigned_hardware_id: Optional[UUID] = None
    assigned_agronomist_id: Optional[UUID] = None
    notes: Optional[str] = None

class DeviceInDB(DeviceBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    history: List[DeviceHistoryInDB] = []

    class Config:
        from_attributes = True
