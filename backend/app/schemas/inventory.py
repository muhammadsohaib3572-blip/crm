from pydantic import BaseModel
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal

class ProcurementBase(BaseModel):
    item_id: UUID
    vendor_details: Optional[str] = None
    order_date: date
    batch_quantity: int
    total_cost: Decimal
    media_urls: Optional[List[str]] = None

class ProcurementCreate(ProcurementBase):
    pass

class ProcurementInDB(ProcurementBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class InventoryItemBase(BaseModel):
    name: str
    sku: str
    quantity: int = 0
    category: Optional[str] = None
    vendor: Optional[str] = None
    cost: Decimal
    notes: Optional[str] = None

class InventoryItemCreate(InventoryItemBase):
    pass

class InventoryItemUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    quantity: Optional[int] = None
    category: Optional[str] = None
    vendor: Optional[str] = None
    cost: Optional[Decimal] = None
    notes: Optional[str] = None

class InventoryItemInDB(InventoryItemBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    procurements: List[ProcurementInDB] = []

    class Config:
        from_attributes = True
