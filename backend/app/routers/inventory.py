from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import InventoryItemCreate, InventoryItemInDB, ProcurementCreate, ProcurementInDB
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[InventoryItemInDB])
async def read_inventory(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = InventoryRepository(db)
    return await repo.get_all(skip, limit)

@router.post("/", response_model=InventoryItemInDB)
async def create_item(
    item_in: InventoryItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    try:
        item = await repo.create_item(item_in)
        await ActivityLogService.log_activity(
            db,
            current_user.id,
            current_user.full_name,
            "CREATE",
            "InventoryItem",
            f"Added inventory item '{item.name}' ({item.sku})",
            entity_id=item.id
        )
        return item
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@router.post("/procure", response_model=ProcurementInDB)
async def procure_item(
    procurement_in: ProcurementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    procurement = await repo.procure(procurement_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "Procurement",
        f"Procured {procurement.batch_quantity} units for inventory item {procurement.item_id}",
        entity_id=procurement.id
    )
    return procurement

@router.get("/{item_id}", response_model=InventoryItemInDB)
async def read_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = InventoryRepository(db)
    item = await repo.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item
