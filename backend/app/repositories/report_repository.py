from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from uuid import UUID
from typing import List, Optional
from app.models.report import FieldReport
from app.schemas.report import FieldReportCreate, FieldReportUpdate

class ReportRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[FieldReport]:
        result = await self.db.execute(
            select(FieldReport)
            .options(selectinload(FieldReport.client), selectinload(FieldReport.created_by))
            .order_by(desc(FieldReport.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, report_id: UUID) -> Optional[FieldReport]:
        result = await self.db.execute(
            select(FieldReport)
            .where(FieldReport.id == report_id)
            .options(selectinload(FieldReport.client), selectinload(FieldReport.created_by))
        )
        return result.scalars().first()

    async def delete(self, db_report: FieldReport) -> None:
        await self.db.delete(db_report)
        await self.db.commit()

    async def get_by_client(self, client_id: UUID) -> List[FieldReport]:
        result = await self.db.execute(
            select(FieldReport)
            .where(FieldReport.client_id == client_id)
            .options(selectinload(FieldReport.client), selectinload(FieldReport.created_by))
            .order_by(desc(FieldReport.created_at))
        )
        return result.scalars().all()

    async def create(self, report_in: FieldReportCreate, created_by_id: UUID) -> FieldReport:
        db_report = FieldReport(**report_in.model_dump(), created_by_id=created_by_id)
        self.db.add(db_report)
        await self.db.commit()
        await self.db.refresh(db_report)
        return db_report

    async def update(self, db_report: FieldReport, report_in: FieldReportUpdate) -> FieldReport:
        update_data = report_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_report, field, value)
        await self.db.commit()
        await self.db.refresh(db_report)
        return db_report
