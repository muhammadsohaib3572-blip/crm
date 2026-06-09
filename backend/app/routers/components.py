from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID
from pathlib import Path
import shutil

from app.database.session import get_db
from app.models.inventory import Component, ProcurementComponent
from app.models.user import User, UserRole
from app.schemas.inventory import (
    ComponentCreate, ComponentUpdate, ComponentInDB,
    ProcurementComponentCreate, ProcurementComponentInDB
)
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
COMPONENT_IMAGE_DIR = Path("uploads/components")
COMPONENT_IMAGE_DIR.mkdir(parents=True, exist_ok=True)

HARDWARE_ROLES = [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]


async def _get_component_or_404(component_id: UUID, db: AsyncSession) -> Component:
    result = await db.execute(
        select(Component)
        .options(selectinload(Component.procurements))
        .where(Component.id == component_id)
    )
    component = result.scalars().first()
    if not component:
        raise HTTPException(status_code=404, detail="Component not found")
    return component


@router.get("/", response_model=List[ComponentInDB])
async def list_components(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    result = await db.execute(
        select(Component)
        .options(selectinload(Component.procurements))
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.post("/", response_model=ComponentInDB, status_code=status.HTTP_201_CREATED)
async def create_component(
    component_in: ComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    component = Component(**component_in.model_dump())
    db.add(component)
    await db.commit()
    await db.refresh(component)

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE", "Component",
        f"Created component '{component.name}' (type: {component.type})",
        entity_id=component.id, role=current_user.role
    )
    return await _get_component_or_404(component.id, db)


@router.get("/{component_id}", response_model=ComponentInDB)
async def get_component(
    component_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    return await _get_component_or_404(component_id, db)


@router.patch("/{component_id}", response_model=ComponentInDB)
async def update_component(
    component_id: UUID,
    component_in: ComponentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    component = await _get_component_or_404(component_id, db)

    for field, value in component_in.model_dump(exclude_unset=True).items():
        setattr(component, field, value)

    await db.commit()
    await db.refresh(component)

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "UPDATE", "Component",
        f"Updated component '{component.name}'", entity_id=component.id, role=current_user.role
    )
    return await _get_component_or_404(component_id, db)


@router.delete("/{component_id}")
async def delete_component(
    component_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    component = await _get_component_or_404(component_id, db)

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "DELETE", "Component",
        f"Deleted component '{component.name}'", entity_id=component.id, role=current_user.role
    )
    await db.delete(component)
    await db.commit()
    return {"message": "Component deleted"}


@router.get("/{component_id}/procurements", response_model=List[ProcurementComponentInDB])
async def list_component_procurements(
    component_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    await _get_component_or_404(component_id, db)
    result = await db.execute(
        select(ProcurementComponent)
        .where(ProcurementComponent.component_id == component_id)
        .order_by(ProcurementComponent.purchase_date.desc())
    )
    return result.scalars().all()


@router.post("/{component_id}/procure", response_model=ProcurementComponentInDB, status_code=status.HTTP_201_CREATED)
async def procure_component(
    component_id: UUID,
    procurement_in: ProcurementComponentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    component = await _get_component_or_404(component_id, db)

    procurement = ProcurementComponent(
        component_id=component_id,
        supplier=procurement_in.supplier,
        vendor=procurement_in.vendor,
        quantity=procurement_in.quantity,
        cost=procurement_in.cost,
        purchase_date=procurement_in.purchase_date,
        image_url=procurement_in.image_url,
    )
    db.add(procurement)

    # Auto-increment stock
    component.stock_quantity += procurement_in.quantity

    await db.commit()
    await db.refresh(procurement)

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE", "ProcurementComponent",
        f"Procured {procurement_in.quantity} units of component '{component.name}'",
        entity_id=procurement.id, role=current_user.role
    )
    return procurement


@router.post("/{component_id}/procure/upload-image")
async def upload_procurement_image(
    component_id: UUID,
    procurement_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role(HARDWARE_ROLES))
):
    """Upload image for a procurement record (JPG/JPEG/PNG, max 5 MB)"""
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=422,
            detail=f"Invalid file type '{ext}'. Allowed: jpg, jpeg, png"
        )

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File exceeds 5 MB limit")

    result = await db.execute(
        select(ProcurementComponent).where(
            ProcurementComponent.id == procurement_id,
            ProcurementComponent.component_id == component_id
        )
    )
    procurement = result.scalars().first()
    if not procurement:
        raise HTTPException(status_code=404, detail="Procurement record not found")

    filename = f"component_{component_id}_proc_{procurement_id}{ext}"
    file_path = COMPONENT_IMAGE_DIR / filename
    with open(file_path, "wb") as f:
        f.write(content)

    procurement.image_url = str(file_path)
    await db.commit()

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "FILE_UPLOAD", "ProcurementComponent",
        f"Uploaded image for procurement {procurement_id}",
        entity_id=procurement_id, role=current_user.role
    )

    return {"message": "Image uploaded", "image_url": str(file_path)}
