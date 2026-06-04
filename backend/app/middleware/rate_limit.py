from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable
import time
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent abuse"""

    def __init__(self, app, calls: int = 100, period: int = 60):
        super().__init__(app)
        self.calls = calls  # Number of calls allowed
        self.period = period  # Time period in seconds
        self.clients = defaultdict(list)

    async def dispatch(self, request: Request, call_next: Callable):
        # Get client IP
        client_ip = request.client.host

        # Clean old entries
        now = datetime.now()
        self.clients[client_ip] = [
            req_time for req_time in self.clients[client_ip]
            if now - req_time < timedelta(seconds=self.period)
        ]

        # Check rate limit
        if len(self.clients[client_ip]) >= self.calls:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."}
            )

        # Add current request
        self.clients[client_ip].append(now)

        response = await call_next(request)
        return response
