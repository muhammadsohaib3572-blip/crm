from fastapi import APIRouter, Body, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.refresh_token_service import RefreshTokenService
from app.schemas.user import Token, UserInDB, UserCreate
from app.routers.deps import get_current_user
from app.models.user import User
from app.core.security import get_password_hash
from jose import jwt, JWTError
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserInDB)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user"""
    user_repo = UserRepository(db)

    # Check if user already exists
    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
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

@router.post("/login", response_model=Token)
async def login(
    db: AsyncSession = Depends(get_db),
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user_repo = UserRepository(db)
    auth_service = AuthService(user_repo)

    user = await auth_service.authenticate(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    elif not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )

    access_token = auth_service.create_token(user)
    refresh_token = RefreshTokenService.create_refresh_token(user.id)
    await RefreshTokenService.save_refresh_token(db, user.id, refresh_token)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer"
    }

@router.post("/refresh", response_model=Token)
async def refresh_token(
    refresh_token: str = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Refresh access token using refresh token"""
    # Verify refresh token
    token_record = await RefreshTokenService.verify_refresh_token(db, refresh_token)
    if not token_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )

    # Get user
    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(token_record.user_id)
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )

    # Create new tokens
    auth_service = AuthService(user_repo)
    new_access_token = auth_service.create_token(user)
    new_refresh_token = RefreshTokenService.create_refresh_token(user.id)

    # Revoke old refresh token and save new one
    await RefreshTokenService.revoke_refresh_token(db, refresh_token)
    await RefreshTokenService.save_refresh_token(db, user.id, new_refresh_token)

    return {
        "access_token": new_access_token,
        "refresh_token": new_refresh_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    refresh_token: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Logout user by revoking refresh token"""
    await RefreshTokenService.revoke_refresh_token(db, refresh_token)
    return {"message": "Successfully logged out"}

@router.post("/create-admin")
async def create_admin(
    email: str,
    password: str,
    full_name: str,
    db: AsyncSession = Depends(get_db)
):
    """Create an admin user (for initial setup)"""
    user_repo = UserRepository(db)

    # Check if user already exists
    existing_user = await user_repo.get_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new admin user
    user = User(
        email=email,
        full_name=full_name,
        role="ADMIN",
        is_active=True,
        password_hash=get_password_hash(password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "Admin user created successfully", "user": {"email": user.email, "full_name": user.full_name, "role": user.role}}

@router.get("/me", response_model=UserInDB)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
