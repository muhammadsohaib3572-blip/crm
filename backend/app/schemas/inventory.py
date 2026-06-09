from pydantic import BaseModel, field_validator
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List
from decimal import Decimal
from app.models.inventory import ComponentType

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

# ── Component (Hardware) Schemas ──────────────────────────
class ProcurementComponentBase(BaseModel):
    supplier: Optional[str] = None
    vendor: Optional[str] = None
    quantity: int
    cost: Decimal
    purchase_date: date
    image_url: Optional[str] = None

class ProcurementComponentCreate(ProcurementComponentBase):
    component_id: UUID

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v: int) -> int:
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v

    @field_validator("cost")
    @classmethod
    def cost_positive(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Cost must be greater than 0")
        return v

class ProcurementComponentInDB(ProcurementComponentBase):
    id: UUID
    component_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ComponentBase(BaseModel):
    name: str
    type: ComponentType
    stock_quantity: int = 0
    notes: Optional[str] = None

class ComponentCreate(ComponentBase):
    pass

class ComponentUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[ComponentType] = None
    stock_quantity: Optional[int] = None
    notes: Optional[str] = None

class ComponentInDB(ComponentBase):
    id: UUID
    created_at: datetime
    updated_at: datetime
    procurements: List[ProcurementComponentInDB] = []

    class Config:
        from_attributes = True
