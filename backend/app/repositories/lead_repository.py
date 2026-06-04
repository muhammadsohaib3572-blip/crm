from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import desc
from app.models.lead import Lead, LeadStage
from app.schemas.client import LeadCreate, LeadUpdate
from uuid import UUID
from typing import List, Optional

class LeadRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Lead]:
        result = await self.db.execute(
            select(Lead)
            .order_by(desc(Lead.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, lead_id: UUID) -> Optional[Lead]:
        result = await self.db.execute(select(Lead).where(Lead.id == lead_id))
        return result.scalars().first()

    async def create(self, lead_in: LeadCreate) -> Lead:
        db_lead = Lead(**lead_in.model_dump())
        self.db.add(db_lead)
        await self.db.commit()
        await self.db.refresh(db_lead)
        return db_lead

    async def delete(self, db_lead: Lead) -> None:
        await self.db.delete(db_lead)
        await self.db.commit()

    async def update(self, db_lead: Lead, lead_in: LeadUpdate) -> Lead:
        update_data = lead_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_lead, field, value)
        await self.db.commit()
        await self.db.refresh(db_lead)
        return db_lead
