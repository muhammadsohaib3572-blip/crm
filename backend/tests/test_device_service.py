import asyncio
import pytest
from app.models.device import DeviceStatus
from app.services.device_service import DeviceService


def test_valid_device_transition_under_development_to_qa():
    asyncio.run(DeviceService._validate_status_transition(
        DeviceStatus.UNDER_DEVELOPMENT,
        DeviceStatus.QA_FOR_AGRONOMIST,
    ))


def test_invalid_device_transition_installed_to_under_development():
    with pytest.raises(ValueError, match="Invalid status transition"):
        asyncio.run(DeviceService._validate_status_transition(
            DeviceStatus.INSTALLED,
            DeviceStatus.UNDER_DEVELOPMENT,
        ))


def test_installed_requires_client_id():
    with pytest.raises(ValueError, match="client_id is required"):
        DeviceService.validate_installed_client(None, DeviceStatus.INSTALLED)


def test_installed_allows_client_id():
    from uuid import uuid4
    DeviceService.validate_installed_client(uuid4(), DeviceStatus.INSTALLED)
