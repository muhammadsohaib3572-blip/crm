from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.models.issue import ClientIssue, IssueStatus, IssuePriority
from app.models.user import User, UserRole
from app.models.task import TaskPriority
from app.repositories.task_repository import TaskRepository
from app.schemas.ops import TaskCreate
from app.schemas.issue import IssueCreate, IssueUpdate, IssueInDB
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/clients/{client_id}/issues", response_model=List[IssueInDB])
async def get_client_issues(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all issues for a specific client"""
    query = select(ClientIssue).where(ClientIssue.client_id == client_id)
    result = await db.execute(query)
    issues = result.scalars().all()
    return issues

@router.post("/clients/{client_id}/issues", response_model=IssueInDB)
async def create_client_issue(
    client_id: UUID,
    issue_in: IssueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]))
):
    """Create a new issue for a client"""
    issue = ClientIssue(
        client_id=client_id,
        title=issue_in.title,
        description=issue_in.description,
        status=issue_in.status,
        priority=issue_in.priority,
        assigned_to_id=issue_in.assigned_to_id
    )

    if issue.assigned_to_id:
        assigned_result = await db.execute(select(User).where(User.id == issue.assigned_to_id))
        assigned_user = assigned_result.scalars().first()
        if not assigned_user or assigned_user.role not in [UserRole.HARDWARE, UserRole.AGRONOMY]:
            raise HTTPException(status_code=400, detail="Assigned user must be a Hardware or Agronomy resource")

    db.add(issue)
    await db.commit()
    await db.refresh(issue)

    if issue.assigned_to_id:
        task_repo = TaskRepository(db)
        task = await task_repo.create(TaskCreate(
            title=f"Issue resolution: {issue.title}",
            description=issue.description or "",
            assigned_to_id=issue.assigned_to_id,
            client_id=issue.client_id,
            priority=TaskPriority.HIGH if issue.priority == IssuePriority.HIGH else TaskPriority.MEDIUM
        ))
        await ActivityLogService.log_activity(
            db,
            current_user.id,
            current_user.full_name,
            "CREATE",
            "Task",
            f"Created follow-up task '{task.title}' for issue {issue.id}",
            entity_id=task.id,
            extra_data={"issue_id": str(issue.id)}
        )

    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "ClientIssue",
        f"Created issue '{issue.title}' for client {client_id}",
        entity_id=issue.id,
        extra_data={"assigned_to_id": str(issue.assigned_to_id) if issue.assigned_to_id else None}
    )

    return issue

@router.patch("/issues/{issue_id}", response_model=IssueInDB)
async def update_issue(
    issue_id: UUID,
    issue_in: IssueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update an issue"""
    result = await db.execute(select(ClientIssue).where(ClientIssue.id == issue_id))
    issue = result.scalars().first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if current_user.role not in [UserRole.ADMIN, UserRole.MANAGER] and issue.assigned_to_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this issue")

    previous_values = {
        "status": issue.status.value,
        "priority": issue.priority.value,
        "assigned_to_id": str(issue.assigned_to_id) if issue.assigned_to_id else None,
    }

    if issue_in.title is not None:
        issue.title = issue_in.title
    if issue_in.description is not None:
        issue.description = issue_in.description
    if issue_in.status is not None:
        issue.status = issue_in.status
    if issue_in.priority is not None:
        issue.priority = issue_in.priority
    if issue_in.assigned_to_id is not None:
        assigned_result = await db.execute(select(User).where(User.id == issue_in.assigned_to_id))
        assigned_user = assigned_result.scalars().first()
        if not assigned_user or assigned_user.role not in [UserRole.HARDWARE, UserRole.AGRONOMY]:
            raise HTTPException(status_code=400, detail="Assigned user must be a Hardware or Agronomy resource")
        issue.assigned_to_id = issue_in.assigned_to_id

    await db.commit()
    await db.refresh(issue)

    updated_values = {
        "status": issue.status.value,
        "priority": issue.priority.value,
        "assigned_to_id": str(issue.assigned_to_id) if issue.assigned_to_id else None,
    }
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "ClientIssue",
        f"Updated issue '{issue.title}' (id: {issue.id})",
        entity_id=issue.id,
        previous_value=str(previous_values),
        new_value=str(updated_values)
    )

    return issue

@router.delete("/issues/{issue_id}")
async def delete_issue(
    issue_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN]))
):
    """Delete an issue"""
    result = await db.execute(select(ClientIssue).where(ClientIssue.id == issue_id))
    issue = result.scalars().first()

    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    await db.delete(issue)
    await db.commit()
    return {"message": "Issue deleted successfully"}
