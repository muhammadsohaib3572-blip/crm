"""Shared role lists for RBAC checks across routers."""
from app.models.user import UserRole

CLIENT_READ_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.BUSINESS,
    UserRole.AGRONOMY,
    UserRole.ACCOUNTS,
]

CLIENT_WRITE_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.BUSINESS,
]

DEVICE_READ_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.HARDWARE,
    UserRole.AGRONOMY,
]

DEVICE_WRITE_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.HARDWARE,
]

BILLING_READ_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ACCOUNTS,
]

BILLING_WRITE_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ACCOUNTS,
]

REPORT_READ_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.AGRONOMY,
]

ISSUE_READ_ROLES = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.BUSINESS,
    UserRole.HARDWARE,
    UserRole.AGRONOMY,
]

PUBLIC_REGISTER_ROLES = [UserRole.EMPLOYEE]
