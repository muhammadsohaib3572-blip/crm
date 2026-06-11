from fastapi import Request, Response, HTTPException, status
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker
from sqlalchemy.orm import sessionmaker
from app.services.activity_log_service import ActivityLogService
import logging
import time
from uuid import uuid4
from typing import Optional, Union

logger = logging.getLogger(__name__)

class AuditMiddleware(BaseHTTPMiddleware):
    """Global audit logging middleware to capture all mutations"""

    def __init__(self, app, db_session_maker: Union[sessionmaker, async_sessionmaker]):
        super().__init__(app)
        self.db_session_maker = db_session_maker

    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        db: Optional[AsyncSession] = None

        # Only log mutating operations and certain routes
        mutating_methods = {"POST", "PUT", "PATCH", "DELETE"}
        audit_routes = {
            "/clients": ["CREATE", "UPDATE", "DELETE"],
            "/devices": ["CREATE", "UPDATE", "DELETE"],
            "/users": ["CREATE", "UPDATE", "DELETE"],
            "/tasks": ["CREATE", "UPDATE", "DELETE"],
            "/billing": ["CREATE", "UPDATE", "DELETE"],
            "/leads": ["CREATE", "UPDATE", "DELETE"],
            "/inventory": ["CREATE", "UPDATE", "DELETE"],
            "/issues": ["CREATE", "UPDATE", "DELETE"],
            "/reports": ["CREATE", "UPDATE", "DELETE"],
            "/uploads": ["UPLOAD"],
            "/auth/login": ["LOGIN"],
        }

        # Get user info from request state (set by auth middleware)
        current_user = getattr(request.state, 'current_user', None)
        action_type = None
        entity_type = None

        # Determine action type based on method and path
        if request.method in mutating_methods:
            if request.url.path.startswith("/"):
                path_parts = request.url.path.strip("/").split("/")
                if len(path_parts) > 1:
                    entity_type = path_parts[1].upper()
                    action_type = request.method.upper()
        
        # Special case for login
        if request.url.path == "/auth/login":
            action_type = "LOGIN"
            entity_type = "Auth"
        
        # Special case for file uploads
        if "upload" in request.url.path:
            action_type = "UPLOAD"
            entity_type = "File"

        response = await call_next(request)

        # If we have a logged action and user, try to capture IP and log
        if action_type and current_user:
            try:
                db_session = self.db_session_maker()
                db = db_session
                
                # Get client IP
                client_ip = request.client.host if request.client else "unknown"
                
                # Extract entity_id from path if available
                entity_id = None
                path_parts = request.url.path.strip("/").split("/")
                if len(path_parts) > 2:
                    entity_id = path_parts[2]

                await ActivityLogService.log_activity(
                    db=db,
                    user_id=current_user.id,
                    user_name=current_user.full_name,
                    action=action_type,
                    entity_type=entity_type or "Unknown",
                    description=f"{action_type} {entity_type} {entity_id or ''}".strip(),
                    ip_address=client_ip,
                    role=current_user.role,
                )
                await db_session.commit()
            except Exception as e:
                logger.error(f"Failed to log audit entry: {str(e)}")
                if db:
                    await db_session.rollback()
            finally:
                if db:
                    await db_session.close()

        # Calculate processing time
        process_time = time.time() - start_time

        # Log request/response (original functionality)
        logger.info(
            f"Request: {request.method} {request.url.path} "
            f"Status: {response.status_code} "
            f"Duration: {process_time:.3f}s"
        )

        # Add custom header
        response.headers["X-Process-Time"] = str(process_time)

        return response
