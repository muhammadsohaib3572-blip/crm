from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from app.models.lead import LeadStage
from app.schemas.device import DeviceInDB

class LeadBase(BaseModel):
    name: str
    company_name: str
    stage: LeadStage = LeadStage.NEW_LEAD
    contact_info: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    service_tags: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    proposal_link: Optional[str] = None
    quotation_amount: Optional[float] = None
    client_id: Optional[UUID] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    stage: Optional[LeadStage] = None
    contact_info: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    service_tags: Optional[List[str]] = None
    follow_up_date: Optional[date] = None
    proposal_link: Optional[str] = None
    quotation_amount: Optional[float] = None
    client_id: Optional[UUID] = None

class LeadInDB(LeadBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ClientBase(BaseModel):
    name: str
    company_name: str
    farm_size: Optional[float] = None
    address: Optional[str] = None
    contact_info: Optional[str] = None
    onboarding_date: Optional[date] = None
    crop_cycle_end_date: Optional[date] = None
    services: Optional[List[str]] = None
    farm_location: Optional[str] = None
    third_party_credentials: Optional[dict] = None

class ClientCreate(ClientBase):
    pass

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    company_name: Optional[str] = None
    farm_size: Optional[float] = None
    address: Optional[str] = None
    contact_info: Optional[str] = None
    onboarding_date: Optional[date] = None
    crop_cycle_end_date: Optional[date] = None
    services: Optional[List[str]] = None
    farm_location: Optional[str] = None
    third_party_credentials: Optional[dict] = None

class ClientInDB(ClientBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    devices: List[DeviceInDB] = []

    class Config:
        from_attributes = True
