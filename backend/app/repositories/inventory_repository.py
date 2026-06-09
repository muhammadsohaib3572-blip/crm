from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc
from sqlalchemy.exc import IntegrityError
from app.models.inventory import InventoryItem, Procurement, Component, ProcurementComponent
from app.schemas.inventory import (
    InventoryItemCreate, InventoryItemUpdate, ProcurementCreate,
    ComponentCreate, ComponentUpdate, ProcurementComponentCreate
)
from uuid import UUID
from typing import List, Optional

class InventoryRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[InventoryItem]:
        result = await self.db.execute(
            select(InventoryItem)
            .options(selectinload(InventoryItem.procurements))
            .order_by(desc(InventoryItem.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_sku(self, sku: str) -> Optional[InventoryItem]:
        result = await self.db.execute(select(InventoryItem).where(InventoryItem.sku == sku))
        return result.scalars().first()

    async def get_by_id(self, item_id: UUID) -> Optional[InventoryItem]:
        result = await self.db.execute(
            select(InventoryItem)
            .options(selectinload(InventoryItem.procurements))
            .where(InventoryItem.id == item_id)
        )
        return result.scalars().first()

    async def create_item(self, item_in: InventoryItemCreate) -> InventoryItem:
        existing_item = await self.get_by_sku(item_in.sku)
        if existing_item:
            raise ValueError('Inventory item with this SKU already exists.')

        db_item = InventoryItem(**item_in.model_dump())
        self.db.add(db_item)
        try:
            await self.db.commit()
        except IntegrityError as exc:
            await self.db.rollback()
            if 'duplicate key value violates unique constraint' in str(exc) or 'ix_inventory_items_sku' in str(exc):
                raise ValueError('Inventory item with this SKU already exists.') from exc
            raise
        return await self.get_by_id(db_item.id)

    async def procure(self, procurement_in: ProcurementCreate) -> Procurement:
        db_procurement = Procurement(**procurement_in.model_dump())
        self.db.add(db_procurement)
        
        # Update item quantity
        result = await self.db.execute(
            select(InventoryItem).where(InventoryItem.id == procurement_in.item_id)
        )
        item = result.scalars().first()
        if item:
            item.quantity += procurement_in.batch_quantity
            
        await self.db.commit()
        await self.db.refresh(db_procurement)
        return db_procurement

    # ── Component Inventory methods ──
    async def get_all_components(self, skip: int = 0, limit: int = 100) -> List[Component]:
        result = await self.db.execute(
            select(Component)
            .options(selectinload(Component.procurements))
            .order_by(desc(Component.updated_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_component_by_id(self, component_id: UUID) -> Optional[Component]:
        result = await self.db.execute(
            select(Component)
            .options(selectinload(Component.procurements))
            .where(Component.id == component_id)
        )
        return result.scalars().first()

    async def create_component(self, component_in: ComponentCreate) -> Component:
        db_component = Component(**component_in.model_dump())
        self.db.add(db_component)
        await self.db.commit()
        return await self.get_component_by_id(db_component.id)

    async def update_component(self, db_component: Component, component_in: ComponentUpdate) -> Component:
        update_data = component_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_component, field, value)
        await self.db.commit()
        return await self.get_component_by_id(db_component.id)

    async def procure_component(self, procurement_in: ProcurementComponentCreate) -> ProcurementComponent:
        db_procurement = ProcurementComponent(**procurement_in.model_dump())
        self.db.add(db_procurement)

        # Update component stock quantity
        component = await self.get_component_by_id(procurement_in.component_id)
        if component:
            component.stock_quantity += procurement_in.quantity

        await self.db.commit()
        await self.db.refresh(db_procurement)
        return db_procurement

