from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import Optional
from core.db import get_db
from models.product import LandedCostRecord
from services.landed_cost import landed_cost_service
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/landed-cost", tags=["landed-cost"])


class ComputeLandedCostRequest(BaseModel):
    unit_price: float
    quantity: int
    country: str = "CN"
    shipping: Optional[float] = None
    duties: Optional[float] = None
    import_fee: Optional[float] = None
    insurance: Optional[float] = None
    handling: Optional[float] = None
    selling_price_per_unit: Optional[float] = None


class LandedCostResponse(BaseModel):
    unit_price: float
    quantity: int
    shipping: float
    duties: float
    import_fee: float
    insurance: float
    handling: float
    total_landed_cost: float
    landed_cost_per_unit: float
    margin_pct: Optional[float] = None


@router.post("/compute", response_model=LandedCostResponse)
async def compute_landed_cost(
    req: ComputeLandedCostRequest,
    db: AsyncSession = Depends(get_db)
):
    """Calculate landed cost per unit for procurement."""
    try:
        result = landed_cost_service.compute(
            unit_price=req.unit_price,
            quantity=req.quantity,
            country=req.country,
            shipping=req.shipping,
            duties=req.duties,
            import_fee=req.import_fee,
            insurance=req.insurance,
            handling=req.handling,
            selling_price_per_unit=req.selling_price_per_unit,
        )

        # Save to database for analytics
        record = LandedCostRecord(
            quantity=req.quantity,
            unit_price=req.unit_price,
            shipping=result.shipping,
            duties=result.duties,
            import_fee=result.import_fee,
            insurance=result.insurance,
            handling=result.handling,
            landed_cost_per_unit=result.landed_cost_per_unit,
        )
        db.add(record)
        await db.commit()

        return LandedCostResponse(
            unit_price=result.unit_price,
            quantity=result.quantity,
            shipping=result.shipping,
            duties=result.duties,
            import_fee=result.import_fee,
            insurance=result.insurance,
            handling=result.handling,
            total_landed_cost=result.total_landed_cost,
            landed_cost_per_unit=result.landed_cost_per_unit,
            margin_pct=result.margin_pct,
        )
    except Exception as e:
        logger.error(f"Landed cost calculation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Calculation failed")


@router.post("/batch")
async def batch_compute_landed_cost(
    items: list[ComputeLandedCostRequest],
    db: AsyncSession = Depends(get_db)
):
    """Batch compute landed costs for multiple items."""
    results = []
    for item in items:
        result = landed_cost_service.compute(
            unit_price=item.unit_price,
            quantity=item.quantity,
            country=item.country,
            shipping=item.shipping,
            duties=item.duties,
            import_fee=item.import_fee,
            insurance=item.insurance,
            handling=item.handling,
            selling_price_per_unit=item.selling_price_per_unit,
        )
        results.append(result)

    return {
        "items": len(results),
        "results": [
            {
                "landed_cost_per_unit": r.landed_cost_per_unit,
                "margin_pct": r.margin_pct,
            }
            for r in results
        ],
    }


@router.get("/history")
async def get_calculation_history(
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """Get recent landed cost calculations."""
    result = await db.execute(
        select(LandedCostRecord)
        .order_by(LandedCostRecord.created_at.desc())
        .limit(limit)
    )
    records = result.scalars().all()

    return {
        "total": len(records),
        "history": [
            {
                "id": r.id,
                "quantity": r.quantity,
                "unit_price": r.unit_price,
                "landed_cost_per_unit": r.landed_cost_per_unit,
                "created_at": r.created_at.isoformat(),
            }
            for r in records
        ],
    }
