from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.device import Device, DeviceStatus
from app.models.task import Task, TaskStatus
from app.models.client import Client
from app.models.billing import Invoice, InvoiceStatus
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get dashboard statistics tailored by role"""

    stats = {}

    # Common stats (if applicable to all)
    clients_result = await db.execute(select(func.count(Client.id)))
    stats["total_clients"] = clients_result.scalar()

    # Role specific stats
    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS]:
        from app.models.lead import Lead, LeadStage
        leads_result = await db.execute(select(func.count(Lead.id)).where(Lead.stage != LeadStage.LOST))
        stats["active_leads"] = leads_result.scalar()

    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE, UserRole.AGRONOMY]:
        devices_result = await db.execute(
            select(func.count(Device.id)).where(Device.status == DeviceStatus.INSTALLED)
        )
        stats["active_devices"] = devices_result.scalar()

    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]:
        from app.models.inventory import InventoryItem
        inventory_result = await db.execute(select(func.count(InventoryItem.id)))
        stats["inventory_items"] = inventory_result.scalar()

    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTS]:
        revenue_result = await db.execute(
            select(func.sum(Invoice.amount)).where(Invoice.status == InvoiceStatus.PAID)
        )
        stats["monthly_revenue"] = float(revenue_result.scalar() or 0)
        
        overdue_result = await db.execute(
            select(func.count(Invoice.id)).where(Invoice.status == InvoiceStatus.OVERDUE)
        )
        stats["overdue_invoices"] = overdue_result.scalar()

    # Tasks for everyone
    tasks_result = await db.execute(
        select(func.count(Task.id)).where(Task.status == TaskStatus.PENDING)
    )
    stats["pending_tasks"] = tasks_result.scalar()

    # Breakdowns
    device_status_result = await db.execute(
        select(Device.status, func.count(Device.id)).group_by(Device.status)
    )
    stats["device_status_breakdown"] = {status: count for status, count in device_status_result.all()}

    task_status_result = await db.execute(
        select(Task.status, func.count(Task.id)).group_by(Task.status)
    )
    stats["task_status_breakdown"] = {status: count for status, count in task_status_result.all()}

    return stats

@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.HARDWARE, UserRole.AGRONOMY, UserRole.ACCOUNTS]))
):
    """Get recent activity (devices, tasks, clients)"""

    # Audit log for access
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "READ",
        "DashboardRecentActivity",
        f"User accessed recent activity (limit={limit})"
    )
    # Recent devices
    devices_result = await db.execute(
        select(Device).order_by(Device.created_at.desc()).limit(limit)
    )
    recent_devices = devices_result.scalars().all()

    # Recent tasks
    tasks_result = await db.execute(
        select(Task).order_by(Task.created_at.desc()).limit(limit)
    )
    recent_tasks = tasks_result.scalars().all()

    # Recent clients
    clients_result = await db.execute(
        select(Client).order_by(Client.created_at.desc()).limit(limit)
    )
    recent_clients = clients_result.scalars().all()

    return {
        "recent_devices": [{"id": str(d.id), "name": d.name, "status": d.status, "created_at": d.created_at} for d in recent_devices],
        "recent_tasks": [{"id": str(t.id), "title": t.title, "status": t.status, "created_at": t.created_at} for t in recent_tasks],
        "recent_clients": [{"id": str(c.id), "name": c.name, "company_name": c.company_name, "created_at": c.created_at} for c in recent_clients]
    }

@router.get("/alerts")
async def get_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.BUSINESS, UserRole.HARDWARE, UserRole.AGRONOMY, UserRole.ACCOUNTS]))
):
    """Get critical alerts"""

    alerts = []

    # Overdue invoices
    overdue_invoices_result = await db.execute(
        select(Invoice).where(Invoice.status == InvoiceStatus.OVERDUE)
    )
    overdue_invoices = overdue_invoices_result.scalars().all()

    for invoice in overdue_invoices:
        alerts.append({
            "type": "overdue_invoice",
            "severity": "high",
            "message": f"Invoice #{str(invoice.id)[:8]} is overdue",
            "entity_id": str(invoice.id)
        })

    # High priority pending tasks
    high_priority_tasks_result = await db.execute(
        select(Task).where(
            Task.status == TaskStatus.PENDING,
            Task.priority == "HIGH"
        )
    )
    high_priority_tasks = high_priority_tasks_result.scalars().all()

    for task in high_priority_tasks:
        alerts.append({
            "type": "high_priority_task",
            "severity": "medium",
            "message": f"High priority task: {task.title}",
            "entity_id": str(task.id)
        })

    return {"alerts": alerts[:10]}  # Return top 10 alerts
