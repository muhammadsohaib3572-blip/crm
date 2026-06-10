from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from app.models.device import Device, DeviceHistory, DeviceStatus
from app.schemas.device import DeviceCreate, DeviceUpdate
from app.services.device_service import DeviceService
from uuid import UUID
from typing import List, Optional
from fastapi import HTTPException

class DeviceRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Device]:
        result = await self.db.execute(
            select(Device)
            .options(selectinload(Device.history).selectinload(DeviceHistory.changed_by))
            .order_by(desc(Device.updated_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, device_id: UUID) -> Optional[Device]:
        result = await self.db.execute(
            select(Device)
            .options(selectinload(Device.history).selectinload(DeviceHistory.changed_by))
            .where(Device.id == device_id)
        )
        return result.scalars().first()

    async def create(self, device_in: DeviceCreate, user_id: UUID) -> Device:
        # Prepare device data without client_id if it's None
        device_data = device_in.model_dump()
        if device_data.get('client_id') is None:
            device_data.pop('client_id', None)
        
        db_device = Device(**device_data)
        self.db.add(db_device)
        await self.db.flush() # To get the device ID

        # Create initial history log
        history = DeviceHistory(
            device_id=db_device.id,
            previous_status=None,
            new_status=db_device.status,
            changed_by_id=user_id,
            notes="Initial creation"
        )
        self.db.add(history)

        await self.db.commit()
        return await self.get_by_id(db_device.id)

    async def delete(self, db_device: Device) -> None:
        await self.db.delete(db_device)
        await self.db.commit()

    async def update(self, db_device: Device, device_in: DeviceUpdate, user_id: UUID) -> Device:
        update_data = device_in.model_dump(exclude_unset=True)
        old_status = db_device.status
        new_status = update_data.get("status")
        effective_client_id = update_data.get("client_id", db_device.client_id)

        if new_status and new_status != old_status:
            try:
                await DeviceService._validate_status_transition(old_status, new_status)
                DeviceService.validate_installed_client(effective_client_id, new_status)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))

        final_status = new_status if new_status else db_device.status
        if final_status == DeviceStatus.INSTALLED:
            try:
                DeviceService.validate_installed_client(effective_client_id, DeviceStatus.INSTALLED)
            except ValueError as e:
                raise HTTPException(status_code=422, detail=str(e))

        for field, value in update_data.items():
            setattr(db_device, field, value)

        if new_status and new_status != old_status:
            history = DeviceHistory(
                device_id=db_device.id,
                previous_status=old_status,
                new_status=new_status,
                changed_by_id=user_id,
                notes=update_data.get("notes") or f"Status changed from {old_status} to {new_status}"
            )
            self.db.add(history)

        await self.db.commit()
        return await self.get_by_id(db_device.id)
