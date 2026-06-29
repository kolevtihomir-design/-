from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from core.db import get_db
from models.product import NegotiationDeal
from models.auth import User
import csv
import json
import io
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/export", tags=["export"])


@router.get("/csv")
async def export_negotiations_csv(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Export user's negotiation deals as CSV."""
    result = await db.execute(
        select(NegotiationDeal).where(NegotiationDeal.buyer_id == user_id)
    )
    deals = result.scalars().all()

    if not deals:
        raise HTTPException(status_code=404, detail="No negotiations found")

    # Create CSV
    output = io.StringIO()
    writer = csv.DictWriter(
        output,
        fieldnames=[
            "deal_id",
            "product_id",
            "supplier_id",
            "status",
            "initial_price",
            "proposed_price",
            "final_price",
            "quantity",
            "total_value",
            "savings",
            "created_at",
        ],
    )

    writer.writeheader()
    for deal in deals:
        savings = 0
        if deal.final_unit_price:
            savings = (deal.initial_unit_price - deal.final_unit_price) * deal.quantity

        writer.writerow(
            {
                "deal_id": deal.id,
                "product_id": deal.product_id,
                "supplier_id": deal.supplier_id,
                "status": deal.status,
                "initial_price": deal.initial_unit_price,
                "proposed_price": deal.proposed_unit_price,
                "final_price": deal.final_unit_price or "",
                "quantity": deal.quantity,
                "total_value": deal.quantity * (deal.final_unit_price or deal.initial_unit_price),
                "savings": savings,
                "created_at": deal.created_at.isoformat(),
            }
        )

    output.seek(0)
    filename = f"negotiations_{user_id}_{datetime.utcnow().strftime('%Y%m%d')}.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/erp")
async def export_erp_json(
    user_id: int,
    include_pending: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """Export negotiations in ERP-compatible JSON format."""
    query = select(NegotiationDeal).where(NegotiationDeal.buyer_id == user_id)

    if not include_pending:
        query = query.where(NegotiationDeal.status == "accepted")

    result = await db.execute(query)
    deals = result.scalars().all()

    if not deals:
        raise HTTPException(status_code=404, detail="No completed negotiations found")

    # Convert to ERP format
    erp_data = {
        "version": "1.0",
        "exported_at": datetime.utcnow().isoformat(),
        "user_id": user_id,
        "total_deals": len(deals),
        "purchase_orders": [
            {
                "po_number": f"B2B-{deal.id:06d}",
                "supplier_id": deal.supplier_id,
                "product_id": deal.product_id,
                "quantity": deal.quantity,
                "unit_price": deal.final_unit_price or deal.initial_unit_price,
                "currency": "EUR",
                "total_value": deal.quantity
                * (deal.final_unit_price or deal.initial_unit_price),
                "status": deal.status,
                "created_at": deal.created_at.isoformat(),
                "updated_at": deal.updated_at.isoformat(),
            }
            for deal in deals
        ],
    }

    filename = f"erp_export_{user_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"

    return StreamingResponse(
        iter([json.dumps(erp_data, indent=2)]),
        media_type="application/json",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/import-erp")
async def import_erp_data(
    data: dict,
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Import purchase orders from ERP system."""
    try:
        imported_count = 0

        for po in data.get("purchase_orders", []):
            deal = NegotiationDeal(
                product_id=po.get("product_id"),
                supplier_id=po.get("supplier_id"),
                buyer_id=user_id,
                quantity=po.get("quantity"),
                initial_unit_price=po.get("unit_price"),
                proposed_unit_price=po.get("unit_price"),
                final_unit_price=po.get("unit_price"),
                status="accepted",  # Imported POs are already placed
            )
            db.add(deal)
            imported_count += 1

        await db.commit()
        logger.info(f"Imported {imported_count} POs for user {user_id}")

        return {
            "status": "success",
            "imported_count": imported_count,
            "message": f"Successfully imported {imported_count} purchase orders",
        }
    except Exception as e:
        logger.error(f"ERP import failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Import failed")
