from fastapi import APIRouter, Body, Depends, HTTPException, status, Request, Header
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_db
from app.repositories.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.services.refresh_token_service import RefreshTokenService
from app.services.activity_log_service import ActivityLogService
from app.schemas.user import Token, UserInDB, UserCreate
from app.routers.deps import get_current_user_for_middleware
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from app.core.config import settings
# from app.core.rbac import PUBLIC_REGISTER_ROLES

router = APIRouter()

@router.post("/register", response_model=UserInDB)
async def register(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """Register a new user. Public registration is enabled by default and controlled by ALLOW_PUBLIC_REGISTER."""
    if not settings.ALLOW_PUBLIC_REGISTER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration is disabled. Contact an administrator."
        )

    allowed_roles = [role.strip() for role in settings.PUBLIC_REGISTER_ROLES.split(',') if role.strip()]
    if user_in.role.name not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public registration role is not allowed."
        )

    user_repo = UserRepository(db)

    existing_user = await user_repo.get_by_email(user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

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
    request: Request,
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

    # Audit log login (non-fatal — don't break login if audit table missing)
    ip = request.client.host if request.client else "unknown"
    try:
        await ActivityLogService.log_activity(
            db, user.id, user.full_name, "LOGIN", "User",
            f"User '{user.email}' logged in", entity_id=user.id,
            ip_address=ip, role=user.role
        )
    except Exception:
        pass  # Never break auth for audit failures

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
    request: Request,
    refresh_token: str = Body(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Logout user by revoking refresh token"""
    await RefreshTokenService.revoke_refresh_token(db, refresh_token)

    ip = request.client.host if request.client else "unknown"
    try:
        await ActivityLogService.log_activity(
            db, current_user.id, current_user.full_name, "LOGOUT", "User",
            f"User '{current_user.email}' logged out", entity_id=current_user.id,
            ip_address=ip, role=current_user.role
        )
    except Exception:
        pass  # Never break logout for audit failures
    return {"message": "Successfully logged out"}

@router.post("/create-admin")
async def create_admin(
    email: str,
    password: str,
    full_name: str,
    db: AsyncSession = Depends(get_db),
    x_setup_secret: str | None = Header(default=None, alias="X-Setup-Secret"),
):
    """Create an admin user — only when no admin exists, or with SETUP_SECRET header."""
    admin_count = await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.ADMIN)
    )
    has_admin = (admin_count.scalar() or 0) > 0

    if has_admin:
        if not settings.SETUP_SECRET or x_setup_secret != settings.SETUP_SECRET:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin already exists. Provide valid X-Setup-Secret header."
            )

    user_repo = UserRepository(db)

    existing_user = await user_repo.get_by_email(email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    user = User(
        email=email,
        full_name=full_name,
        role=UserRole.ADMIN,
        is_active=True,
        password_hash=get_password_hash(password)
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return {"message": "Admin user created successfully", "user": {"email": user.email, "full_name": user.full_name, "role": user.role}}

@router.get("/me", response_model=UserInDB)
async def read_users_me(current_user: User = Depends(get_current_user_for_middleware)):
    return current_user
