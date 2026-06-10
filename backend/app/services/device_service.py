from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models.device import Device, DeviceStatus, DeviceHistory
from app.models.user import User
from uuid import UUID
from datetime import datetime
from typing import Optional, List, Dict, Any


class DeviceService:
    @staticmethod
    async def get_device_status_history(
        db: AsyncSession,
        device_id: str,
        limit: int = 100
    ) -> List[DeviceHistory]:
        """Get status history for a device, ordered by most recent first."""
        query = select(DeviceHistory).options(
            selectinload(DeviceHistory.changed_by)
        ).where(
            DeviceHistory.device_id == device_id
        ).order_by(DeviceHistory.created_at.desc()).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()


    @staticmethod
    def validate_installed_client(client_id: Optional[UUID], new_status: DeviceStatus) -> None:
        if new_status == DeviceStatus.INSTALLED and not client_id:
            raise ValueError("client_id is required when status is INSTALLED")

    @staticmethod
    async def change_device_status(
        db: AsyncSession,
        device_id: str,
        new_status: DeviceStatus,
        changed_by_user: User,
        notes: Optional[str] = None,
        client_id: Optional[UUID] = None,
        installation_location: Optional[str] = None,
    ) -> Device:
        """Change device status with validation and history tracking."""
        # Get current device
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalars().first()

        if not device:
            raise ValueError(f"Device {device_id} not found")

        await DeviceService._validate_status_transition(device.status, new_status)

        if client_id is not None:
            device.client_id = client_id
        if installation_location is not None:
            device.installation_location = installation_location

        DeviceService.validate_installed_client(device.client_id, new_status)

        previous_status = device.status
        device.status = new_status
        device.updated_at = datetime.utcnow()

        # Create history record
        history_entry = DeviceHistory(
            device_id=device.id,
            previous_status=previous_status,
            new_status=new_status,
            changed_by_id=changed_by_user.id,
            notes=notes or f"Status changed from {previous_status.value} to {new_status.value}"
        )
        db.add(history_entry)

        # Commit transaction and refresh device
        await db.commit()
        await db.refresh(device)
        return device

    @staticmethod
    async def _validate_status_transition(
        current_status: DeviceStatus,
        new_status: DeviceStatus
    ) -> None:
        """Validate allowed status transitions."""
        allowed_transitions = {
            DeviceStatus.UNDER_DEVELOPMENT: [DeviceStatus.QA_FOR_AGRONOMIST],
            DeviceStatus.QA_FOR_AGRONOMIST: [
                DeviceStatus.QA_PASSED_IN_INVENTORY,
                DeviceStatus.UNDER_DEVELOPMENT,
            ],
            DeviceStatus.QA_PASSED_IN_INVENTORY: [
                DeviceStatus.INSTALLED,
                DeviceStatus.UNDER_DEVELOPMENT,
            ],
            DeviceStatus.INSTALLED: [
                DeviceStatus.BACK_AT_OFFICE,
                DeviceStatus.QA_FOR_AGRONOMIST,
            ],
            DeviceStatus.BACK_AT_OFFICE: [
                DeviceStatus.QA_FOR_AGRONOMIST,
                DeviceStatus.UNDER_DEVELOPMENT,
                DeviceStatus.INSTALLED,
            ],
        }
        
        if new_status not in allowed_transitions.get(current_status, []):
            raise ValueError(
                f"Invalid status transition: {current_status.value} → {new_status.value}. "
                f"Allowed transitions from {current_status.value}: "
                f"{', '.join([s.value for s in allowed_transitions.get(current_status, [])])}"
            )

    @staticmethod
    async def get_devices_by_status(
        db: AsyncSession,
        status: DeviceStatus,
        limit: int = 100
    ) -> List[Device]:
        """Get devices filtered by status."""
        query = select(Device).where(
            Device.status == status
        ).order_by(Device.updated_at.desc()).limit(limit)
        
        result = await db.execute(query)
        return result.scalars().all()

    @staticmethod
    async def get_device_timeline(
        db: AsyncSession,
        device_id: str
    ) -> Dict[str, Any]:
        """Get complete timeline for a device including status changes and other events."""
        
        # Get device details
        result = await db.execute(select(Device).where(Device.id == device_id))
        device = result.scalars().first()
        
        if not device:
            raise ValueError(f"Device {device_id} not found")
        
        # Get status history
        history = await DeviceService.get_device_status_history(db, device_id)
        
        timeline = {
            "device": {
                "id": str(device.id),
                "name": device.name,
                "serial_number": device.serial_number,
                "current_status": device.status.value,
                "installation_location": device.installation_location,
                "created_at": device.created_at.isoformat(),
                "updated_at": device.updated_at.isoformat() if device.updated_at else None
            },
            "status_history": [
                {
                    "id": str(h.id),
                    "previous_status": h.previous_status.value if h.previous_status else None,
                    "new_status": h.new_status.value,
                    "changed_by": h.changed_by.full_name if h.changed_by else None,
                    "changed_at": h.created_at.isoformat(),
                    "notes": h.notes
                }
                for h in history
            ]
        }
        
        return timeline