from datetime import date, timedelta
from decimal import Decimal
import pytest
from pydantic import ValidationError
from app.schemas.ops import InvoiceCreate, PaymentCreate, InvoiceUpdate


def test_invoice_amount_must_be_positive():
    with pytest.raises(ValidationError):
        InvoiceCreate(
            client_id="00000000-0000-0000-0000-000000000001",
            amount=Decimal("0"),
            due_date=date.today() + timedelta(days=7),
        )


def test_invoice_due_date_cannot_be_past():
    with pytest.raises(ValidationError):
        InvoiceCreate(
            client_id="00000000-0000-0000-0000-000000000001",
            amount=Decimal("100"),
            due_date=date.today() - timedelta(days=1),
        )


def test_payment_amount_must_be_positive():
    with pytest.raises(ValidationError):
        PaymentCreate(
            client_id="00000000-0000-0000-0000-000000000001",
            invoice_id="00000000-0000-0000-0000-000000000002",
            amount=Decimal("-5"),
        )


def test_invoice_update_allows_status_change():
    inv = InvoiceUpdate(status="CANCELLED")
    assert inv.status.value == "CANCELLED"
