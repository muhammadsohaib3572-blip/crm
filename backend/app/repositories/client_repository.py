from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from app.models.client import Client
from app.models.device import Device
from app.schemas.client import ClientCreate, ClientUpdate
from uuid import UUID
from typing import List, Optional

class ClientRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Client]:
        result = await self.db.execute(
            select(Client)
            .options(
                selectinload(Client.devices).selectinload(Device.history),
                selectinload(Client.leads),
            )
            .order_by(desc(Client.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, client_id: UUID) -> Optional[Client]:
        result = await self.db.execute(
            select(Client)
            .options(
                selectinload(Client.devices).selectinload(Device.history),
                selectinload(Client.leads),
            )
            .where(Client.id == client_id)
        )
        return result.scalars().first()

    async def create(self, client_in: ClientCreate) -> Client:
        db_client = Client(**client_in.model_dump())
        self.db.add(db_client)
        await self.db.commit()
        return await self.get_by_id(db_client.id)

    async def delete(self, db_client: Client) -> None:
        await self.db.delete(db_client)
        await self.db.commit()

    async def update(self, db_client: Client, client_in: ClientUpdate) -> Client:
        update_data = client_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_client, field, value)
        await self.db.commit()
        return await self.get_by_id(db_client.id)
