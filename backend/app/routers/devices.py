from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.device_repository import DeviceRepository
from app.schemas.device import DeviceCreate, DeviceUpdate, DeviceInDB, DeviceHistoryInDB
from app.services.device_service import DeviceService
from pydantic import BaseModel
from app.models.user import User, UserRole
from app.models.device import DeviceStatus
from app.models.device import DeviceHistory
from app.routers.deps import get_current_user_for_middleware, check_role
from app.core.rbac import DEVICE_READ_ROLES, DEVICE_WRITE_ROLES
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[DeviceInDB])
async def read_devices(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(DEVICE_READ_ROLES))
):
    repo = DeviceRepository(db)
    return await repo.get_all(skip=skip, limit=limit)

# New endpoint: Get all possible device statuses (must be before any {device_id} routes)
@router.get("/statuses", response_model=List[str])
async def get_device_statuses(
    current_user: User = Depends(check_role(DEVICE_READ_ROLES))
) -> List[str]:
    """Return a list of all DeviceStatus enum values.
    The endpoint is public to authenticated users; no special role required.
    """
    return [status.value for status in DeviceStatus]

@router.post("/", response_model=DeviceInDB)
async def create_device(
    device_in: DeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(DEVICE_WRITE_ROLES))
):
    repo = DeviceRepository(db)
    try:
        device = await repo.create(device_in, current_user.id)
    except IntegrityError as exc:
        await db.rollback()
        error_msg = str(exc.orig).lower() if getattr(exc, 'orig', None) else str(exc).lower()
        if 'serial_number' in error_msg or 'unique' in error_msg or 'duplicate' in error_msg:
            raise HTTPException(status_code=409, detail="Serial Number already exists")
        raise HTTPException(status_code=400, detail="Database error occurred while creating device")

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
    current_user: User = Depends(check_role(DEVICE_READ_ROLES))
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
    current_user: User = Depends(check_role(DEVICE_READ_ROLES))
):
    """Get complete device lifecycle history"""
    query = select(DeviceHistory).where(
        DeviceHistory.device_id == device_id
    ).order_by(DeviceHistory.created_at.desc())

    result = await db.execute(query)
    history = result.scalars().all()
    return history

# New endpoint: Full device timeline (details + history)
@router.get("/{device_id}/timeline", response_model=dict)
async def get_device_timeline(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(DEVICE_READ_ROLES))
):
    timeline = await DeviceService.get_device_timeline(db, str(device_id))
    return timeline

@router.delete("/{device_id}", response_model=DeviceInDB)
async def delete_device(
    device_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
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
    current_user: User = Depends(get_current_user_for_middleware)
):
    repo = DeviceRepository(db)
    db_device = await repo.get_by_id(device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE, UserRole.AGRONOMY] and \
            current_user.id not in [db_device.assigned_hardware_id, db_device.assigned_agronomist_id]:
        raise HTTPException(status_code=403, detail="Not authorized to update this device")

    try:
        updated = await repo.update(db_device, device_in, current_user.id)
    except IntegrityError as exc:
        await db.rollback()
        error_msg = str(exc.orig).lower() if getattr(exc, 'orig', None) else str(exc).lower()
        if 'serial_number' in error_msg or 'unique' in error_msg or 'duplicate' in error_msg:
            raise HTTPException(status_code=409, detail="Serial Number already exists")
        raise HTTPException(status_code=400, detail="Database error occurred while updating device")

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

# -------------------------------------------------------------------
# New endpoint: Change device status with validation & history
# -------------------------------------------------------------------
from pydantic import BaseModel

class DeviceStatusChange(BaseModel):
    new_status: DeviceStatus
    notes: str | None = None
    client_id: UUID | None = None
    installation_location: str | None = None

@router.patch("/{device_id}/status", response_model=DeviceInDB)
async def change_device_status(
    device_id: UUID,
    status_change: DeviceStatusChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    db_device = await db.get(Device, device_id)
    if not db_device:
        raise HTTPException(status_code=404, detail="Device not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE] and \
            current_user.id not in [db_device.assigned_hardware_id, db_device.assigned_agronomist_id]:
        raise HTTPException(status_code=403, detail="Not authorized to change device status")

    try:
        device = await DeviceService.change_device_status(
            db=db,
            device_id=str(device_id),
            new_status=status_change.new_status,
            changed_by_user=current_user,
            notes=status_change.notes,
            client_id=status_change.client_id,
            installation_location=status_change.installation_location,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return device