from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from core.db import get_db
from models.product import NegotiationDeal, Product, Supplier
from models.auth import User
from services.negotiation import negotiation_engine, NegotiationSimulation, NegotiationAction
from services.ml_pricing import ml_pricing_model
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/negotiation", tags=["negotiation"])


class NegotiationSimulateRequest(BaseModel):
    product_id: int
    buyer_id: int
    quantity: int
    discount_target_pct: float = 10.0


class NegotiationSimulateResponse(BaseModel):
    proposed_price: float
    success_pct: float
    recommended_action: str
    requires_human_approval: bool
    reasoning: str


class NegotiationCreateRequest(BaseModel):
    product_id: int
    supplier_id: int
    quantity: int
    initial_unit_price: float


class MLPredictRequest(BaseModel):
    product_id: int
    supplier_id: int
    quantity: int
    initial_unit_price: float
    moq: int
    delivery_days: int
    trust_score: float
    supplier_rating: float


class MLPredictResponse(BaseModel):
    optimal_price: float
    success_probability: float
    ml_model_version: str
    recommendation: str


@router.post("/simulate", response_model=NegotiationSimulateResponse)
async def simulate_negotiation(
    req: NegotiationSimulateRequest, db: AsyncSession = Depends(get_db)
):
    """Simulate negotiation with rules engine + ML predictions."""
    # Get product
    result = await db.execute(select(Product).where(Product.id == req.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get supplier
    result = await db.execute(select(Supplier).where(Supplier.id == product.supplier_id))
    supplier = result.scalar_one_or_none()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    # Count existing deals
    deal_result = await db.execute(
        select(NegotiationDeal).where(NegotiationDeal.buyer_id == req.buyer_id)
    )
    deal_count = len(deal_result.scalars().all())

    # Run negotiation simulation
    simulation = negotiation_engine.simulate(
        current_price=product.unit_price,
        moq=product.moq,
        delivery_days=product.lead_time_days or 30,
        trust_score=0.75,  # TODO: Calculate from supplier history
        supplier_rating=supplier.rating,
        deal_number=deal_count,
        ml_enabled=True,
    )

    return NegotiationSimulateResponse(
        proposed_price=simulation.proposed_price,
        success_pct=simulation.success_pct,
        recommended_action=simulation.recommended_action.value,
        requires_human_approval=simulation.requires_human_approval,
        reasoning=simulation.reasoning,
    )


@router.post("/ml-predict", response_model=MLPredictResponse)
async def ml_predict(req: MLPredictRequest, db: AsyncSession = Depends(get_db)):
    """Use ML model to predict optimal price and success probability."""
    # Get optimal price
    optimal_price = ml_pricing_model.predict_optimal_price(
        initial_price=req.initial_unit_price,
        moq=req.moq,
        delivery_days=req.delivery_days,
        trust_score=req.trust_score,
    )

    # Get success probability
    success_prob = ml_pricing_model.predict_success_probability(
        initial_price=req.initial_unit_price,
        moq=req.moq,
        delivery_days=req.delivery_days,
        trust_score=req.trust_score,
        supplier_rating=req.supplier_rating,
    )

    if optimal_price is None or success_prob is None:
        return MLPredictResponse(
            optimal_price=req.initial_unit_price * 0.9,
            success_probability=50.0,
            ml_model_version="fallback",
            recommendation="ML models not yet trained. Using default 10% discount.",
        )

    # Generate recommendation
    if success_prob >= 70:
        recommendation = "High success probability - recommend proceeding with negotiation"
    elif success_prob >= 50:
        recommendation = "Moderate success probability - negotiation worth attempting"
    else:
        recommendation = "Low success probability - consider alternative suppliers"

    return MLPredictResponse(
        optimal_price=optimal_price,
        success_probability=success_prob * 100,
        ml_model_version="1.0",
        recommendation=recommendation,
    )


@router.post("/create")
async def create_negotiation(
    req: NegotiationCreateRequest, db: AsyncSession = Depends(get_db)
):
    """Create new negotiation deal."""
    # Get product
    result = await db.execute(select(Product).where(Product.id == req.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Create deal
    deal = NegotiationDeal(
        product_id=req.product_id,
        supplier_id=req.supplier_id,
        buyer_id=1,  # TODO: Get from authenticated user
        initial_unit_price=req.initial_unit_price,
        proposed_unit_price=req.initial_unit_price * 0.9,  # 10% discount
        quantity=req.quantity,
        status="pending",
    )
    db.add(deal)
    await db.commit()
    await db.refresh(deal)

    return {
        "id": deal.id,
        "status": deal.status,
        "initial_price": deal.initial_unit_price,
        "proposed_price": deal.proposed_unit_price,
        "quantity": deal.quantity,
    }
