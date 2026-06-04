from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Numeric, Integer, Text, JSON, Date
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional, List
import uuid
from datetime import date
from decimal import Decimal

class InventoryItem(Base, IDMixin, TimestampMixin):
    __tablename__ = "inventory_items"

    name: Mapped[str] = mapped_column(String, nullable=False)
    sku: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    quantity: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    vendor: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    procurements: Mapped[List["Procurement"]] = relationship(back_populates="item")

class Procurement(Base, IDMixin, TimestampMixin):
    __tablename__ = "procurements"

    item_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("inventory_items.id"), nullable=False)
    vendor_details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    order_date: Mapped[date] = mapped_column(Date, nullable=False)
    batch_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    total_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    media_urls: Mapped[Optional[list[str]]] = mapped_column(JSON, nullable=True) # Array of image URLs

    item: Mapped["InventoryItem"] = relationship(back_populates="procurements")
