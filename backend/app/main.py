from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.routers import (
    auth, devices, clients, leads, tasks, billing, inventory,
    users, notifications, activity_logs, dashboard, issues, uploads, reports
)
from app.middleware.rate_limit import RateLimitMiddleware
from app.middleware.error_handler import ErrorHandlerMiddleware
from app.middleware.logging import LoggingMiddleware

app = FastAPI(
    title="Crop2X Internal CRM & Operations Management System",
    description="Enterprise-grade CRM for hardware and agriculture operations.",
    version="1.0.0"
)

# Add middleware (order matters - first added is outermost)
app.add_middleware(ErrorHandlerMiddleware)
app.add_middleware(LoggingMiddleware)
app.add_middleware(RateLimitMiddleware, calls=100, period=60)

# Set all CORS enabled origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(devices.router, prefix="/devices", tags=["Devices"])
app.include_router(clients.router, prefix="/clients", tags=["Clients"])
app.include_router(leads.router, prefix="/leads", tags=["Leads"])
app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(billing.router, prefix="/billing", tags=["Billing"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(activity_logs.router, prefix="/activity-logs", tags=["Activity Logs"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(issues.router, prefix="", tags=["Issues"])
app.include_router(reports.router, prefix="/reports", tags=["Field Reports"])
app.include_router(uploads.router, prefix="/uploads", tags=["File Uploads"])

@app.get("/")
async def root():
    return {"message": "Welcome to Crop2x CRM API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

