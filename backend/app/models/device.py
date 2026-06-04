from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum as SQLAlchemyEnum, ForeignKey, Text, DateTime, func
from app.models.base import Base, IDMixin, TimestampMixin
import enum
from typing import Optional, List
import uuid
from datetime import datetime

class DeviceStatus(str, enum.Enum):
    UNDER_DEVELOPMENT = "UNDER_DEVELOPMENT"
    QA_FOR_AGRONOMIST = "QA_FOR_AGRONOMIST"
    QA_PASSED_IN_INVENTORY = "QA_PASSED_IN_INVENTORY"
    INSTALLED = "INSTALLED"
    BACK_AT_OFFICE = "BACK_AT_OFFICE"

class Device(Base, IDMixin, TimestampMixin):
    __tablename__ = "devices"

    name: Mapped[str] = mapped_column(String, nullable=False)
    serial_number: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    status: Mapped[DeviceStatus] = mapped_column(SQLAlchemyEnum(DeviceStatus), default=DeviceStatus.UNDER_DEVELOPMENT, nullable=False)
    installation_location: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    client_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("clients.id"), nullable=True)
    assigned_hardware_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_agronomist_id: Mapped[Optional[uuid.UUID]] = mapped_column(ForeignKey("users.id"), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    client: Mapped[Optional["Client"]] = relationship("Client", back_populates="devices")
    assigned_hardware: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_hardware_id])
    assigned_agronomist: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_agronomist_id])
    history: Mapped[List["DeviceHistory"]] = relationship(back_populates="device", cascade="all, delete-orphan")

class DeviceHistory(Base, IDMixin):
    __tablename__ = "device_history"

    device_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("devices.id"), nullable=False)
    status: Mapped[DeviceStatus] = mapped_column(SQLAlchemyEnum(DeviceStatus), nullable=False)
    changed_by_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    device: Mapped["Device"] = relationship(back_populates="history")
