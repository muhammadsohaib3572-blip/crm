from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, update
from app.models.client import Client
from app.models.device import Device, DeviceHistory, DeviceStatus
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
                selectinload(Client.devices)
                    .joinedload(Device.history)
                    .joinedload(DeviceHistory.changed_by),
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
                selectinload(Client.leads),
                selectinload(Client.devices),
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
        # Unlink devices: set client_id=NULL and status=BACK_AT_OFFICE (do not delete devices)
        await self.db.execute(
            update(Device)
            .where(Device.client_id == db_client.id)
            .values(client_id=None, status=DeviceStatus.BACK_AT_OFFICE)
        )
        await self.db.delete(db_client)
        await self.db.commit()

    async def update(self, db_client: Client, client_in: ClientUpdate) -> Client:
        update_data = client_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_client, field, value)
        await self.db.commit()
        return await self.get_by_id(db_client.id)
