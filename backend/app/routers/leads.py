from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.lead_repository import LeadRepository
from app.schemas.client import LeadCreate, LeadUpdate, LeadInDB
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[LeadInDB])
async def read_leads(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = LeadRepository(db)
    return await repo.get_all(skip=skip, limit=limit)

@router.post("/", response_model=LeadInDB)
async def create_lead(
    lead_in: LeadCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    repo = LeadRepository(db)
    lead = await repo.create(lead_in)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "Lead",
        f"Created lead '{lead.name if getattr(lead, 'name', None) else lead.id}'",
        entity_id=lead.id
    )

    return lead

@router.patch("/{lead_id}", response_model=LeadInDB)
async def update_lead(
    lead_id: UUID,
    lead_in: LeadUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    repo = LeadRepository(db)
    db_lead = await repo.get_by_id(lead_id)
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    updated = await repo.update(db_lead, lead_in)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "Lead",
        f"Updated lead '{updated.name if getattr(updated, 'name', None) else updated.id}'",
        entity_id=updated.id
    )

    return updated

@router.delete("/{lead_id}", response_model=LeadInDB)
async def delete_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    repo = LeadRepository(db)
    lead = await repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    # Audit log before deletion
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "DELETE",
        "Lead",
        f"Deleted lead '{lead.name}'",
        entity_id=lead.id
    )
    await repo.delete(lead)
    return lead
