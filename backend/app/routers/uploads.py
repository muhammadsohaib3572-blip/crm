from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import os
import shutil
from pathlib import Path
from app.database.session import get_db
from app.models.billing import Invoice
from app.models.inventory import Procurement
from app.models.user import User, UserRole
from app.routers.deps import get_current_user, check_role
from app.services.activity_log_service import ActivityLogService

router = APIRouter()

# Create upload directories if they don't exist
UPLOAD_DIR = Path("uploads")
INVOICE_DIR = UPLOAD_DIR / "invoices"
INVENTORY_DIR = UPLOAD_DIR / "inventory"

INVOICE_DIR.mkdir(parents=True, exist_ok=True)
INVENTORY_DIR.mkdir(parents=True, exist_ok=True)

@router.post("/invoices/{invoice_id}/upload")
async def upload_invoice_file(
    invoice_id: UUID,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTS]))
):
    """Upload invoice PDF file"""

    # Check if invoice exists
    result = await db.execute(select(Invoice).where(Invoice.id == invoice_id))
    invoice = result.scalars().first()

    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    # Validate file type
    if not file.filename.endswith(('.pdf', '.PDF')):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    # Create unique filename
    file_extension = Path(file.filename).suffix
    unique_filename = f"{invoice_id}{file_extension}"
    file_path = INVOICE_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Update invoice with file path
    invoice.file_path = str(file_path)
    await db.commit()

    # Audit log
    await ActivityLogService.log_activity(
        db,
        current_user.id,
        current_user.full_name,
        "UPLOAD",
        "Invoice",
        f"Uploaded invoice file for invoice {invoice_id}",
        entity_id=invoice_id
    )

    return {
        "message": "Invoice file uploaded successfully",
        "invoice_id": str(invoice_id),
        "file_path": str(file_path),
        "filename": file.filename
    }

@router.post("/inventory/upload-media")
async def upload_inventory_media(
    procurement_id: UUID = None,
    inventory_item_id: UUID = None,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN, UserRole.MANAGER, UserRole.HARDWARE, UserRole.ACCOUNTS]))
):
    """Upload component/inventory photos"""

    # Validate file type
    allowed_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    file_extension = Path(file.filename).suffix.lower()

    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Only image files are allowed: {', '.join(allowed_extensions)}"
        )

    # Create unique filename
    if procurement_id:
        unique_filename = f"procurement_{procurement_id}_{file.filename}"
    elif inventory_item_id:
        unique_filename = f"inventory_{inventory_item_id}_{file.filename}"
    else:
        raise HTTPException(status_code=400, detail="Either procurement_id or inventory_item_id is required")

    file_path = INVENTORY_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # If procurement_id provided, update procurement media_urls
    if procurement_id:
        result = await db.execute(select(Procurement).where(Procurement.id == procurement_id))
        procurement = result.scalars().first()

        if not procurement:
            raise HTTPException(status_code=404, detail="Procurement not found")

        # Add to media_urls array
        if procurement.media_urls is None:
            procurement.media_urls = []

        procurement.media_urls.append(str(file_path))
        await db.commit()

        # Audit log
        await ActivityLogService.log_activity(
            db,
            current_user.id,
            current_user.full_name,
            "UPLOAD",
            "ProcurementMedia",
            f"Uploaded media for procurement {procurement_id}",
            entity_id=procurement_id
        )

    return {
        "message": "Media uploaded successfully",
        "file_path": str(file_path),
        "filename": file.filename,
        "procurement_id": str(procurement_id) if procurement_id else None,
        "inventory_item_id": str(inventory_item_id) if inventory_item_id else None
    }

@router.delete("/uploads/{file_type}/{filename}")
async def delete_uploaded_file(
    file_type: str,
    filename: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(check_role([UserRole.ADMIN]))
):
    """Delete uploaded file (Admin only)"""

    if file_type == "invoice":
        file_path = INVOICE_DIR / filename
    elif file_type == "inventory":
        file_path = INVENTORY_DIR / filename
    else:
        raise HTTPException(status_code=400, detail="Invalid file type")

    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(file_path)

    return {"message": "File deleted successfully", "filename": filename}
