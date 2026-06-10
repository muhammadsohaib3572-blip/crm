from app.core.rbac import (
    CLIENT_READ_ROLES,
    CLIENT_WRITE_ROLES,
    BILLING_READ_ROLES,
    DEVICE_WRITE_ROLES,
    PUBLIC_REGISTER_ROLES,
)
from app.models.user import UserRole


def test_business_can_read_clients():
    assert UserRole.BUSINESS in CLIENT_READ_ROLES


def test_business_can_write_clients():
    assert UserRole.BUSINESS in CLIENT_WRITE_ROLES


def test_business_cannot_read_billing():
    assert UserRole.BUSINESS not in BILLING_READ_ROLES


def test_agronomy_cannot_write_devices():
    assert UserRole.AGRONOMY not in DEVICE_WRITE_ROLES


def test_public_register_only_employee():
    assert PUBLIC_REGISTER_ROLES == [UserRole.EMPLOYEE]
