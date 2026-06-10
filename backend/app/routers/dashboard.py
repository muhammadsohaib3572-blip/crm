from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, cast, Date as SADate
from datetime import date, timedelta
from app.database.session import get_db
from app.models.user import User, UserRole
from app.models.device import Device, DeviceStatus
from app.models.task import Task, TaskStatus, TaskPriority
from app.models.client import Client
from app.models.billing import Invoice, InvoiceStatus, Payment
from app.models.lead import Lead, LeadStage, LeadActivity
from app.models.inventory import InventoryItem, Component
from app.models.report import FieldReport, ReportType
from app.routers.deps import get_current_user, get_current_user_for_middleware, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Role-aware dashboard stats"""
    role = current_user.role
    stats = {}

    if role in [UserRole.ADMIN, UserRole.MANAGER]:
        return await _admin_dashboard(db, current_user)
    elif role == UserRole.BUSINESS:
        return await _business_dashboard(db)
    elif role == UserRole.AGRONOMY:
        return await _agronomy_dashboard(db, current_user)
    elif role == UserRole.HARDWARE:
        return await _hardware_dashboard(db)
    elif role == UserRole.ACCOUNTS:
        return await _accounts_dashboard(db)
    else:
        # EMPLOYEE — basic task stats
        tasks_result = await db.execute(
            select(func.count(Task.id)).where(
                Task.assigned_to_id == current_user.id,
                Task.status == TaskStatus.PENDING
            )
        )
        stats["pending_tasks"] = tasks_result.scalar()
        return stats


async def _admin_dashboard(db: AsyncSession, current_user: User) -> dict:
    stats = {}

    clients_r = await db.execute(select(func.count(Client.id)))
    stats["total_clients"] = clients_r.scalar()

    users_r = await db.execute(select(User.role, func.count(User.id)).group_by(User.role))
    stats["users_by_role"] = {r: c for r, c in users_r.all()}

    from app.models.activity_log import ActivityLog
    from sqlalchemy import cast, Date as SADate
    today = date.today()
    audit_r = await db.execute(
        select(func.count(ActivityLog.id)).where(
            func.cast(ActivityLog.created_at, SADate) == today
        )
    )
    stats["audit_entries_today"] = audit_r.scalar()

    # Merge all dept stats
    stats["business"] = await _business_dashboard(db)
    stats["agronomy"] = await _agronomy_dashboard(db, current_user)
    stats["hardware"] = await _hardware_dashboard(db)
    stats["accounts"] = await _accounts_dashboard(db)

    # Device & task breakdowns
    device_r = await db.execute(select(Device.status, func.count(Device.id)).group_by(Device.status))
    stats["device_status_breakdown"] = {s: c for s, c in device_r.all()}

    task_r = await db.execute(select(Task.status, func.count(Task.id)).group_by(Task.status))
    stats["task_status_breakdown"] = {s: c for s, c in task_r.all()}

    return stats


async def _business_dashboard(db: AsyncSession) -> dict:
    stats = {}
    today = date.today()
    week_end = today + timedelta(days=7)

    active_leads_r = await db.execute(
        select(func.count(Lead.id)).where(Lead.stage.notin_([LeadStage.WON, LeadStage.LOST]))
    )
    stats["active_leads"] = active_leads_r.scalar()

    # Leads by stage
    by_stage_r = await db.execute(
        select(Lead.stage, func.count(Lead.id)).group_by(Lead.stage)
    )
    stats["leads_by_stage"] = {s: c for s, c in by_stage_r.all()}

    # Conversion rate
    total_leads_r = await db.execute(select(func.count(Lead.id)))
    won_r = await db.execute(select(func.count(Lead.id)).where(Lead.stage == LeadStage.WON))
    total = total_leads_r.scalar() or 1
    won = won_r.scalar() or 0
    stats["conversion_rate"] = round((won / total) * 100, 1)

    from app.models.lead import LeadActivityType
    followups_r = await db.execute(
        select(func.count(LeadActivity.id)).where(
            LeadActivity.activity_type == LeadActivityType.FOLLOW_UP,
            func.cast(LeadActivity.scheduled_at, SADate) == today,
        )
    )
    stats["followups_due_today"] = followups_r.scalar()

    meetings_r = await db.execute(
        select(func.count(LeadActivity.id)).where(
            LeadActivity.activity_type == LeadActivityType.MEETING,
            func.cast(LeadActivity.scheduled_at, SADate) >= today,
            func.cast(LeadActivity.scheduled_at, SADate) <= week_end,
        )
    )
    stats["meetings_this_week"] = meetings_r.scalar()

    return stats


async def _agronomy_dashboard(db: AsyncSession, current_user: User) -> dict:
    stats = {}
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    reports_this_week_r = await db.execute(
        select(func.count(FieldReport.id)).where(
            FieldReport.report_date >= week_start
        )
    )
    stats["reports_this_week"] = reports_this_week_r.scalar()

    qa_tasks_r = await db.execute(
        select(func.count(Task.id)).where(
            Task.assigned_to_id == current_user.id,
            Task.status == TaskStatus.PENDING
        )
    )
    stats["qa_tasks_pending"] = qa_tasks_r.scalar()

    qa_devices_r = await db.execute(
        select(func.count(Device.id)).where(Device.status == DeviceStatus.QA_FOR_AGRONOMIST)
    )
    stats["devices_in_qa"] = qa_devices_r.scalar()

    clients_r = await db.execute(select(func.count(Client.id)))
    stats["total_clients"] = clients_r.scalar()

    return stats


async def _hardware_dashboard(db: AsyncSession) -> dict:
    stats = {}

    # Devices by status
    device_r = await db.execute(select(Device.status, func.count(Device.id)).group_by(Device.status))
    device_breakdown = {s: c for s, c in device_r.all()}
    stats["device_status_breakdown"] = device_breakdown
    stats["devices_under_development"] = device_breakdown.get(DeviceStatus.UNDER_DEVELOPMENT, 0)
    stats["devices_installed"] = device_breakdown.get(DeviceStatus.INSTALLED, 0)

    # Low stock items (< 10)
    low_stock_r = await db.execute(
        select(func.count(InventoryItem.id)).where(InventoryItem.quantity < 10)
    )
    stats["low_stock_items"] = low_stock_r.scalar()

    total_inventory_r = await db.execute(select(func.count(InventoryItem.id)))
    stats["total_inventory_items"] = total_inventory_r.scalar()

    # Component stock
    total_components_r = await db.execute(select(func.count(Component.id)))
    stats["total_components"] = total_components_r.scalar()

    from app.models.issue import ClientIssue, IssueStatus
    open_issues_r = await db.execute(
        select(func.count(ClientIssue.id)).where(ClientIssue.status == IssueStatus.OPEN)
    )
    stats["open_issues"] = open_issues_r.scalar()

    return stats


async def _accounts_dashboard(db: AsyncSession) -> dict:
    stats = {}
    today = date.today()
    thirty_days = today + timedelta(days=30)

    # Total revenue (PAID invoices)
    revenue_r = await db.execute(
        select(func.sum(Invoice.amount)).where(Invoice.status == InvoiceStatus.PAID)
    )
    stats["total_revenue"] = float(revenue_r.scalar() or 0)

    # Outstanding (SENT + OVERDUE)
    outstanding_r = await db.execute(
        select(func.sum(Invoice.amount)).where(
            Invoice.status.in_([InvoiceStatus.SENT, InvoiceStatus.OVERDUE])
        )
    )
    total_outstanding = float(outstanding_r.scalar() or 0)

    # Total payments
    payments_r = await db.execute(select(func.sum(Payment.amount)))
    total_paid = float(payments_r.scalar() or 0)

    stats["outstanding_balance"] = total_outstanding
    stats["total_paid"] = total_paid
    stats["arrears"] = max(0, total_outstanding - total_paid)

    # Overdue invoices
    overdue_r = await db.execute(
        select(func.count(Invoice.id)).where(Invoice.status == InvoiceStatus.OVERDUE)
    )
    stats["overdue_invoices_count"] = overdue_r.scalar()

    # Due in next 30 days
    due_soon_r = await db.execute(
        select(func.count(Invoice.id)).where(
            Invoice.status == InvoiceStatus.SENT,
            Invoice.due_date <= thirty_days,
            Invoice.due_date >= today
        )
    )
    stats["due_next_30_days"] = due_soon_r.scalar()

    return stats


@router.get("/recent-activity")
async def get_recent_activity(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user_for_middleware)
):
    """Get recent activity (devices, tasks, clients)"""
    await ActivityLogService.log_activity(
        db, current_user.id, current_user.full_name, "READ", "DashboardRecentActivity",
        f"User accessed recent activity (limit={limit})", role=current_user.role
    )

    devices_result = await db.execute(
        select(Device).order_by(Device.created_at.desc()).limit(limit)
    )
    recent_devices = devices_result.scalars().all()

    tasks_result = await db.execute(
        select(Task).order_by(Task.created_at.desc()).limit(limit)
    )
    recent_tasks = tasks_result.scalars().all()

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
    current_user: User = Depends(get_current_user)
):
    """Get critical alerts for current user's role"""
    alerts = []

    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTS]:
        overdue_result = await db.execute(
            select(Invoice).where(Invoice.status == InvoiceStatus.OVERDUE)
        )
        for invoice in overdue_result.scalars().all():
            alerts.append({
                "type": "overdue_invoice",
                "severity": "high",
                "message": f"Invoice #{str(invoice.id)[:8]} is overdue",
                "entity_id": str(invoice.id)
            })

    if current_user.role in [UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE]:
        low_stock_result = await db.execute(
            select(InventoryItem).where(InventoryItem.quantity < 10)
        )
        for item in low_stock_result.scalars().all():
            alerts.append({
                "type": "low_stock",
                "severity": "medium",
                "message": f"Low stock: {item.name} ({item.quantity} remaining)",
                "entity_id": str(item.id)
            })

    # High priority pending tasks
    high_tasks_result = await db.execute(
        select(Task).where(
            Task.status == TaskStatus.PENDING,
            Task.priority == TaskPriority.HIGH,
            Task.assigned_to_id == current_user.id
        )
    )
    for task in high_tasks_result.scalars().all():
        alerts.append({
            "type": "high_priority_task",
            "severity": "medium",
            "message": f"High priority task: {task.title}",
            "entity_id": str(task.id)
        })

    return {"alerts": alerts[:10]}
