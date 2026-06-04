from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
from uuid import UUID
from app.database.session import get_db
from app.repositories.report_repository import ReportRepository
from app.schemas.report import FieldReportCreate, FieldReportUpdate, FieldReportInDB
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[FieldReportInDB])
async def read_field_reports(
    client_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ReportRepository(db)
    if client_id:
        return await repo.get_by_client(client_id)
    return await repo.get_all(skip=skip, limit=limit)

@router.get("/client/{client_id}", response_model=List[FieldReportInDB])
async def read_client_field_reports(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ReportRepository(db)
    return await repo.get_by_client(client_id)

@router.post("/", response_model=FieldReportInDB)
async def create_field_report(
    report_in: FieldReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGRONOMY]))
):
    repo = ReportRepository(db)
    report = await repo.create(report_in, current_user.id)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "FieldReport",
        f"Created field report '{report.title}' for client {report.client_id}",
        entity_id=report.id
    )
    return await repo.get_by_id(report.id)

@router.patch("/{report_id}", response_model=FieldReportInDB)
async def update_field_report(
    report_id: UUID,
    report_in: FieldReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.AGRONOMY]))
):
    repo = ReportRepository(db)
    db_report = await repo.get_by_id(report_id)
    if not db_report:
        raise HTTPException(status_code=404, detail="Field report not found")
    report = await repo.update(db_report, report_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "FieldReport",
        f"Updated field report '{report.title}' (id: {report.id})",
        entity_id=report.id
    )
    return report

@router.delete("/{report_id}")
async def delete_field_report(
    report_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    repo = ReportRepository(db)
    report = await repo.get_by_id(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Field report not found")
    await repo.delete(report)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "DELETE",
        "FieldReport",
        f"Deleted field report '{report.title}' (id: {report.id})",
        entity_id=report.id
    )
    return {"message": "Field report deleted successfully"}
