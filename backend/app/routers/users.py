from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import List
from uuid import UUID
from app.database.session import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserUpdate, UserInDB
from app.routers.deps import get_current_user, check_role
from app.core.security import get_password_hash

router = APIRouter()

@router.get("/by-role/{role}", response_model=List[UserInDB])
async def get_users_by_role(
    role: UserRole,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get users filtered by role"""
    query = select(User).where(User.role == role, User.is_active == True)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/", response_model=List[UserInDB])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.ACCOUNTS, UserRole.HARDWARE, UserRole.AGRONOMY]))
):
    """Get all users (Admin/Manager only)"""
    query = select(User).where(User.is_active == True).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/", response_model=UserInDB)
async def create_user(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN]))
):
    """Create new user (Admin only)"""
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        role=user_in.role,
        is_active=user_in.is_active,
        password_hash=get_password_hash(user_in.password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserInDB)
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Get user by ID"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserInDB)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN]))
):
    """Update user (Admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user_in.email is not None:
        user.email = user_in.email
    if user_in.full_name is not None:
        user.full_name = user_in.full_name
    if user_in.role is not None:
        user.role = user_in.role
    if user_in.is_active is not None:
        user.is_active = user_in.is_active
    if user_in.password is not None:
        user.password_hash = get_password_hash(user_in.password)

    await db.commit()
    await db.refresh(user)
    return user

@router.delete("/{user_id}")
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER]))
):
    """Delete user (Admin only)"""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    from sqlalchemy.exc import IntegrityError
    try:
        await db.delete(user)
        await db.commit()
        return {"message": "User deleted successfully", "deleted": True}
    except IntegrityError:
        await db.rollback()
        
        # Fetch user again to bind to the new session transaction
        result = await db.execute(select(User).where(User.id == user_id))
        user = result.scalars().first()
        
        # Soft delete: Deactivate user
        user.is_active = False
        
        # Revoke all active refresh tokens to force logout
        from app.services.refresh_token_service import RefreshTokenService
        await RefreshTokenService.revoke_all_user_tokens(db, user.id)
        
        await db.commit()
        return {"message": "User has system activity, so they have been deactivated instead.", "deleted": False}
