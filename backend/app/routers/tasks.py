from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.models.task import Task
from app.repositories.task_repository import TaskRepository
from app.schemas.ops import TaskCreate, TaskUpdate, TaskInDB
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[TaskInDB])
async def read_tasks(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = TaskRepository(db)
    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER]:
        return await repo.get_all()
    return await repo.get_by_user(current_user.id)

@router.post("/", response_model=TaskInDB)
async def create_task(
    task_in: TaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.ACCOUNTS, UserRole.HARDWARE]))
):
    repo = TaskRepository(db)
    task = await repo.create(task_in)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "Task",
        f"Created task '{task.title}' assigned to user {task.assigned_to_id}",
        entity_id=task.id
    )

    return await repo.get_by_id(task.id)


@router.patch("/{task_id}", response_model=TaskInDB)
async def update_task(
    task_id: UUID,
    task_in: TaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = TaskRepository(db)
    result = await db.execute(select(Task).where(Task.id == task_id))
    db_task = result.scalars().first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Only Admin/Manager can reassign, but anyone can update their own task status
    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and db_task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this task")
        
    updated = await repo.update(db_task, task_in)

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "Task",
        f"Updated task '{updated.title}' (id: {updated.id})",
        entity_id=updated.id
    )

    return updated

@router.delete("/{task_id}", response_model=TaskInDB)
async def delete_task(
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = TaskRepository(db)
    db_task = await repo.get_by_id(task_id)
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and db_task.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this task")

    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "DELETE",
        "Task",
        f"Deleted task '{db_task.title}' (id: {db_task.id})",
        entity_id=db_task.id
    )

    await repo.delete(db_task)
    return db_task


@router.get("/performance", tags=["Analytics"])
async def get_performance(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    repo = TaskRepository(db)
    return await repo.get_performance_stats()
