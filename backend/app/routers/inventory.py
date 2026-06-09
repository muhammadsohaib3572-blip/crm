from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.inventory_repository import InventoryRepository
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemInDB, ProcurementCreate, ProcurementInDB,
    ComponentCreate, ComponentUpdate, ComponentInDB, ProcurementComponentCreate, ProcurementComponentInDB
)
from app.models.user import User, UserRole
from app.routers.deps import get_current_user_for_middleware, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[InventoryItemInDB])
async def read_inventory(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
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
            entity_id=item.id,
            role=current_user.role
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
        entity_id=procurement.id,
        role=current_user.role
    )
    return procurement

@router.get("/components", response_model=List[ComponentInDB])
async def read_components(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    return await repo.get_all_components(skip, limit)

@router.post("/components", response_model=ComponentInDB)
async def create_component(
    component_in: ComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    component = await repo.create_component(component_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "Component",
        f"Added component '{component.name}' ({component.type.value})",
        entity_id=component.id,
        role=current_user.role
    )
    return component

@router.patch("/components/{component_id}", response_model=ComponentInDB)
async def update_component(
    component_id: UUID,
    component_in: ComponentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    db_component = await repo.get_component_by_id(component_id)
    if not db_component:
        raise HTTPException(status_code=404, detail="Component not found")
    updated = await repo.update_component(db_component, component_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "Component",
        f"Updated component '{updated.name}'",
        entity_id=updated.id,
        role=current_user.role
    )
    return updated

@router.post("/components/procure", response_model=ProcurementComponentInDB)
async def procure_component(
    procurement_in: ProcurementComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    component = await repo.get_component_by_id(procurement_in.component_id)
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    procurement = await repo.procure_component(procurement_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "ProcurementComponent",
        f"Procured {procurement.quantity} units of component '{component.name}'",
        entity_id=procurement.id,
        role=current_user.role
    )
    return procurement

@router.get("/{item_id}", response_model=InventoryItemInDB)
async def read_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]))
):
    repo = InventoryRepository(db)
    item = await repo.get_by_id(item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item

