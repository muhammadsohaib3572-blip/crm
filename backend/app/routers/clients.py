from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.repositories.client_repository import ClientRepository
from app.schemas.client import ClientCreate, ClientUpdate, ClientInDB
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/", response_model=List[ClientInDB])
async def read_clients(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ClientRepository(db)
    return await repo.get_all(skip=skip, limit=limit)

@router.post("/", response_model=ClientInDB)
async def create_client(
    client_in: ClientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.ACCOUNTS, UserRole.AGRONOMY]))
):
    repo = ClientRepository(db)
    client = await repo.create(client_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "CREATE",
        "Client",
        f"Created client '{client.name}' for company '{client.company_name}'",
        entity_id=client.id
    )
    return client

@router.get("/{client_id}", response_model=ClientInDB)
async def read_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ClientRepository(db)
    client = await repo.get_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client

@router.patch("/{client_id}", response_model=ClientInDB)
async def update_client(
    client_id: UUID,
    client_in: ClientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.ACCOUNTS, UserRole.AGRONOMY]))
):
    repo = ClientRepository(db)
    db_client = await repo.get_by_id(client_id)
    if not db_client:
        raise HTTPException(status_code=404, detail="Client not found")

    previous_values = {
        "name": db_client.name,
        "company_name": db_client.company_name,
        "contact_info": db_client.contact_info,
        "farm_location": db_client.farm_location,
    }
    updated_client = await repo.update(db_client, client_in)
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPDATE",
        "Client",
        f"Updated client '{updated_client.name}' (id: {updated_client.id})",
        entity_id=updated_client.id,
        previous_value=str(previous_values),
        new_value=str(client_in.model_dump(exclude_unset=True))
    )
    return updated_client

@router.delete("/{client_id}", response_model=ClientInDB)
async def delete_client(
    client_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.ACCOUNTS, UserRole.AGRONOMY]))
):
    repo = ClientRepository(db)
    client = await repo.get_by_id(client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    # Audit log before deletion
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "DELETE",
        "Client",
        f"Deleted client '{client.name}'",
        entity_id=client.id
    )
    await repo.delete(client)
    return client
