from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy import desc, func
from app.models.task import Task, TaskStatus
from app.schemas.ops import TaskCreate, TaskUpdate
from uuid import UUID
from typing import List, Optional

class TaskRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self, skip: int = 0, limit: int = 100) -> List[Task]:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.assigned_to))
            .order_by(desc(Task.created_at))
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_by_id(self, task_id: UUID) -> Optional[Task]:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.assigned_to))
            .where(Task.id == task_id)
        )
        return result.scalars().first()

    async def get_by_user(self, user_id: UUID) -> List[Task]:
        result = await self.db.execute(
            select(Task)
            .options(selectinload(Task.assigned_to))
            .where(Task.assigned_to_id == user_id)
        )
        return result.scalars().all()

    async def create(self, task_in: TaskCreate) -> Task:
        db_task = Task(**task_in.model_dump())
        self.db.add(db_task)
        await self.db.commit()
        await self.db.refresh(db_task)
        return db_task

    async def update(self, db_task: Task, task_in: TaskUpdate) -> Task:
        update_data = task_in.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_task, field, value)
        await self.db.commit()
        # Use get_by_id so assigned_to relationship is eagerly loaded via selectinload
        return await self.get_by_id(db_task.id)

    async def delete(self, db_task: Task) -> None:
        await self.db.delete(db_task)
        await self.db.commit()

    async def get_performance_stats(self):
        from app.models.user import User
        result = await self.db.execute(
            select(
                User.full_name,
                User.role,
                func.count(Task.id).label("total"),
                func.count(Task.id).filter(Task.status == TaskStatus.COMPLETED).label("completed")
            )
            .join(User, Task.assigned_to_id == User.id)
            .group_by(User.id, User.full_name, User.role)
        )
        return [
            {
                "full_name": row[0],
                "role": row[1],
                "total": row[2],
                "completed": row[3],
                "score": (row[3] / row[2] * 100) if row[2] > 0 else 0
            }
            for row in result.all()
        ]
