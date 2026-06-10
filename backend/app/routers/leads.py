from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.lead_repository import LeadRepository
from app.repositories.client_repository import ClientRepository
from app.schemas.client import LeadCreate, LeadUpdate, LeadInDB, LeadActivityCreate, LeadActivityInDB, ClientCreate
from app.models.user import User, UserRole
from app.models.lead import Lead, LeadActivity, LeadStage, LEAD_STAGE_TRANSITIONS
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
    # RBAC: Business/Admin/Manager only
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]:
        raise HTTPException(status_code=403, detail="Not authorized to view leads")
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

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE", "Lead",
        f"Created lead '{lead.name}'", entity_id=lead.id, role=current_user.role
    )
    return lead

@router.get("/{lead_id}", response_model=LeadInDB)
async def read_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    repo = LeadRepository(db)
    lead = await repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
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

    # Enforce valid stage transition
    if lead_in.stage and lead_in.stage != db_lead.stage:
        allowed = LEAD_STAGE_TRANSITIONS.get(db_lead.stage.value, [])
        if lead_in.stage.value not in allowed:
            raise HTTPException(
                status_code=422,
                detail=f"Invalid stage transition from {db_lead.stage.value} to {lead_in.stage.value}. "
                       f"Allowed transitions: {allowed}"
            )

    old_stage = db_lead.stage.value
    updated = await repo.update(db_lead, lead_in)

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "UPDATE", "Lead",
        f"Updated lead '{updated.name}'", entity_id=updated.id,
        previous_value=old_stage, new_value=str(lead_in.stage.value if lead_in.stage else old_stage),
        role=current_user.role
    )
    return updated

@router.delete("/{lead_id}", response_model=LeadInDB)
async def delete_lead(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    repo = LeadRepository(db)
    lead = await repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "DELETE", "Lead",
        f"Deleted lead '{lead.name}'", entity_id=lead.id, role=current_user.role
    )
    await repo.delete(lead)
    return lead

@router.post("/{lead_id}/convert", response_model=LeadInDB)
async def convert_lead_to_client(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    """Convert a WON lead into an active client."""
    lead_repo = LeadRepository(db)
    client_repo = ClientRepository(db)
    lead = await lead_repo.get_by_id(lead_id)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if lead.client_id:
        raise HTTPException(status_code=400, detail="Lead already converted to a client")

    client = await client_repo.create(ClientCreate(
        name=lead.name,
        company_name=lead.company_name,
        contact_info=lead.contact_info or lead.phone,
        services=lead.service_tags,
        onboarding_date=lead.follow_up_date,
    ))

    updated = await lead_repo.update(lead, LeadUpdate(stage=LeadStage.WON, client_id=client.id))

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE", "Client",
        f"Converted lead '{lead.name}' to client '{client.name}'",
        entity_id=client.id, role=current_user.role,
        extra_data={"lead_id": str(lead_id)}
    )
    return updated


# ── Lead Activities (Follow-ups, Meetings, Farm Visits) ───
@router.get("/{lead_id}/activities", response_model=List[LeadActivityInDB])
async def list_lead_activities(
    lead_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    result = await db.execute(
        select(LeadActivity).where(LeadActivity.lead_id == lead_id)
        .order_by(LeadActivity.created_at.desc())
    )
    return result.scalars().all()

@router.post("/{lead_id}/activities", response_model=LeadActivityInDB)
async def create_lead_activity(
    lead_id: UUID,
    activity_in: LeadActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    # Verify lead exists
    result = await db.execute(select(Lead).where(Lead.id == lead_id))
    lead = result.scalars().first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")

    activity = LeadActivity(
        lead_id=lead_id,
        activity_type=activity_in.activity_type,
        scheduled_at=activity_in.scheduled_at,
        notes=activity_in.notes,
        created_by_id=current_user.id
    )
    db.add(activity)
    await db.commit()
    await db.refresh(activity)

    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "CREATE", "LeadActivity",
        f"Logged {activity_in.activity_type.value} for lead {lead_id}",
        entity_id=activity.id, role=current_user.role
    )
    return activity

@router.delete("/{lead_id}/activities/{activity_id}")
async def delete_lead_activity(
    lead_id: UUID,
    activity_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    result = await db.execute(
        select(LeadActivity).where(
            LeadActivity.id == activity_id,
            LeadActivity.lead_id == lead_id
        )
    )
    activity = result.scalars().first()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")

    await db.delete(activity)
    await db.commit()
    return {"message": "Activity deleted"}
