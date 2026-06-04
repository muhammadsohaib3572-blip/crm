from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.device_repository import DeviceRepository
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceInDB, DeviceHistoryInDB
from app.models.user import User, UserRole
from app.models.device import DeviceHistory
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[DeviceInDB])
async def read_devices(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = DeviceRepository(db)
    return await repo.get_all(skip=skip, limit=limit)

@router.post("/", response_model=DeviceInDB)
async def create_device(
    device_in: DeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE, UserRole.AGRONOMY]))
):
    repo = DeviceRepository(db)
    device = await repo.create(device_in, current_user.id)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "Device",
        f"Created device '{device.name}' (serial: {device.serial_number})",
        entity_id=device.id
    )

    return device

@router.get("/{device_id}", response_model=DeviceInDB)
async def read_device(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = DeviceRepository(db)
    device = await repo.get_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")
    return device

@router.get("/{device_id}/history", response_model=List[DeviceHistoryInDB])
async def get_device_history(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get complete device lifecycle history"""
    query = select(DeviceHistory).where(
        DeviceHistory.device_id == device_id
    ).order_by(DeviceHistory.created_at.desc())

    result = await db.execute(query)
    history = result.scalars().all()
    return history

@router.delete("/{device_id}", response_model=DeviceInDB)
async def delete_device(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE, UserRole.AGRONOMY]))
):
    repo = DeviceRepository(db)
    device = await repo.get_by_id(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Device not found")

    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "DELETE",
        "Device",
        f"Deleted device '{device.name}' (serial: {device.serial_number})",
        entity_id=device.id
    )

    await repo.delete(device)
    return device


@router.patch("/{device_id}", response_model=DeviceInDB)
async def update_device(
    device_id: UUID,
    device_in: DeviceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = DeviceRepository(db)
    db_device = await repo.get_by_id(device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE, UserRole.AGRONOMY] and \
            current_user.id not in [db_device.assigned_hardware_id, db_device.assigned_agronomist_id]:
        raise HTTPException(status_code=403, detail="Not authorized to update this device")

    updated = await repo.update(db_device, device_in, current_user.id)

    # Audit log for updates
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "Device",
        f"Updated device '{updated.name}' (id: {updated.id})",
        entity_id=updated.id
    )

    return updated