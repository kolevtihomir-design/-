from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional, List
from core.db import get_db
from models.supplier import SupplierAccount, SupplierProduct, SupplierMetrics, SupplierPayout
from models.product import NegotiationDeal
from models.auth import User
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/supplier", tags=["supplier"])


class SupplierRegistrationRequest(BaseModel):
    company_name: str
    business_type: str
    country: str
    tax_id: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None


class SupplierProductRequest(BaseModel):
    name: str
    category: str
    unit_price: float
    moq: int = 1
    lead_time_days: int = 30
    description: Optional[str] = None
    stock_quantity: Optional[int] = None
    specifications: Optional[dict] = None


class SupplierMetricsResponse(BaseModel):
    total_negotiations: int
    successful_negotiations: int
    success_rate: float
    total_revenue_usd: float
    average_discount_pct: float
    customer_rating: float


@router.post("/register")
async def register_supplier(
    req: SupplierRegistrationRequest,
    user_id: int,  # TODO: Get from auth token
    db: AsyncSession = Depends(get_db)
):
    """Register as supplier."""
    # Check if already registered
    result = await db.execute(
        select(SupplierAccount).where(SupplierAccount.user_id == user_id)
    )
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already registered as supplier")

    # Create supplier account
    supplier = SupplierAccount(
        user_id=user_id,
        company_name=req.company_name,
        business_type=req.business_type,
        country=req.country,
        tax_id=req.tax_id,
        description=req.description,
        website=req.website,
        verification_status="pending",
    )
    db.add(supplier)
    await db.commit()
    await db.refresh(supplier)

    logger.info(f"Supplier registered: {supplier.id} ({req.company_name})")

    return {
        "supplier_id": supplier.id,
        "status": "pending_verification",
        "message": "Registration submitted. We'll verify your documents within 24 hours.",
    }


@router.get("/dashboard")
async def get_supplier_dashboard(
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Get supplier dashboard overview."""
    # Get supplier account
    result = await db.execute(
        select(SupplierAccount).where(SupplierAccount.user_id == user_id)
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Not registered as supplier")

    # Get metrics
    metrics_result = await db.execute(
        select(SupplierMetrics).where(SupplierMetrics.supplier_account_id == supplier.id)
    )
    metrics = metrics_result.scalar_one_or_none()

    # Get pending negotiations
    pending_result = await db.execute(
        select(NegotiationDeal).where(
            (NegotiationDeal.supplier_id == supplier.id) &
            (NegotiationDeal.status == "pending")
        )
    )
    pending_deals = pending_result.scalars().all()

    return {
        "company_name": supplier.company_name,
        "verification_status": supplier.verification_status,
        "metrics": {
            "total_negotiations": metrics.total_negotiations if metrics else 0,
            "successful_negotiations": metrics.successful_negotiations if metrics else 0,
            "total_revenue_usd": metrics.total_revenue_usd if metrics else 0,
            "customer_rating": metrics.customer_rating if metrics else 0,
        },
        "pending_negotiations": len(pending_deals),
        "active_products": 0,  # TODO: Count
    }


@router.post("/products")
async def create_product(
    req: SupplierProductRequest,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Create product listing."""
    # Get supplier account
    result = await db.execute(
        select(SupplierAccount).where(SupplierAccount.user_id == user_id)
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Not registered as supplier")

    if supplier.verification_status != "verified":
        raise HTTPException(status_code=403, detail="Account must be verified to list products")

    # Create product
    product = SupplierProduct(
        supplier_account_id=supplier.id,
        name=req.name,
        category=req.category,
        unit_price=req.unit_price,
        moq=req.moq,
        lead_time_days=req.lead_time_days,
        description=req.description,
        stock_quantity=req.stock_quantity or 0,
        specifications=req.specifications or {},
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)

    logger.info(f"Product created: {product.id} by supplier {supplier.id}")

    return {
        "product_id": product.id,
        "name": product.name,
        "status": "active",
        "message": "Product listing created successfully",
    }


@router.get("/products")
async def list_supplier_products(
    user_id: int,  # TODO: Get from auth
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db)
):
    """List supplier's products."""
    # Get supplier account
    result = await db.execute(
        select(SupplierAccount).where(SupplierAccount.user_id == user_id)
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Not registered as supplier")

    # Get products
    products_result = await db.execute(
        select(SupplierProduct)
        .where(SupplierProduct.supplier_account_id == supplier.id)
        .offset(skip)
        .limit(limit)
    )
    products = products_result.scalars().all()

    return {
        "supplier_id": supplier.id,
        "total": len(products),
        "products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "category": p.category,
                "unit_price": p.unit_price,
                "moq": p.moq,
                "stock_quantity": p.stock_quantity,
                "is_active": p.is_active,
                "created_at": p.created_at.isoformat(),
            }
            for p in products
        ],
    }


@router.get("/analytics")
async def get_supplier_analytics(
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Get detailed supplier analytics."""
    # Get supplier account
    result = await db.execute(
        select(SupplierAccount).where(SupplierAccount.user_id == user_id)
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Not registered as supplier")

    # Get all deals
    deals_result = await db.execute(
        select(NegotiationDeal).where(NegotiationDeal.supplier_id == supplier.id)
    )
    deals = deals_result.scalars().all()

    total_deals = len(deals)
    successful_deals = sum(1 for d in deals if d.status == "accepted")
    success_rate = (successful_deals / total_deals * 100) if total_deals > 0 else 0

    # Calculate average discount
    total_discount = sum(
        d.initial_unit_price - d.final_unit_price
        for d in deals
        if d.final_unit_price and d.initial_unit_price
    )
    avg_discount = (total_discount / successful_deals) if successful_deals > 0 else 0

    return {
        "supplier_id": supplier.id,
        "company_name": supplier.company_name,
        "statistics": {
            "total_negotiations": total_deals,
            "successful_negotiations": successful_deals,
            "success_rate": round(success_rate, 2),
            "average_discount_per_deal": round(avg_discount, 2),
        },
        "recent_negotiations": [
            {
                "deal_id": d.id,
                "status": d.status,
                "proposed_price": d.proposed_unit_price,
                "final_price": d.final_unit_price,
                "created_at": d.created_at.isoformat(),
            }
            for d in sorted(deals, key=lambda x: x.created_at, reverse=True)[:10]
        ],
    }


@router.get("/payouts")
async def get_supplier_payouts(
    user_id: int,  # TODO: Get from auth
    limit: int = 12,
    db: AsyncSession = Depends(get_db)
):
    """Get payout history."""
    # Get supplier account
    result = await db.execute(
        select(SupplierAccount).where(SupplierAccount.user_id == user_id)
    )
    supplier = result.scalar_one_or_none()

    if not supplier:
        raise HTTPException(status_code=404, detail="Not registered as supplier")

    # Get payouts
    payouts_result = await db.execute(
        select(SupplierPayout)
        .where(SupplierPayout.supplier_account_id == supplier.id)
        .order_by(SupplierPayout.created_at.desc())
        .limit(limit)
    )
    payouts = payouts_result.scalars().all()

    return {
        "supplier_id": supplier.id,
        "payouts": [
            {
                "period_start": p.period_start.isoformat(),
                "period_end": p.period_end.isoformat(),
                "gross_revenue": p.gross_revenue,
                "platform_fee": p.platform_fee_amount,
                "net_payout": p.net_payout,
                "status": p.status,
                "paid_at": p.paid_at.isoformat() if p.paid_at else None,
            }
            for p in payouts
        ],
    }


@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    req: SupplierProductRequest,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Update product listing."""
    # Get product
    product_result = await db.execute(
        select(SupplierProduct).where(SupplierProduct.id == product_id)
    )
    product = product_result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Check ownership
    supplier_result = await db.execute(
        select(SupplierAccount).where(
            (SupplierAccount.id == product.supplier_account_id) &
            (SupplierAccount.user_id == user_id)
        )
    )
    if not supplier_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not product owner")

    # Update product
    product.name = req.name
    product.unit_price = req.unit_price
    product.moq = req.moq
    product.lead_time_days = req.lead_time_days
    product.description = req.description
    product.stock_quantity = req.stock_quantity or 0
    product.specifications = req.specifications or {}
    product.updated_at = datetime.utcnow()

    db.add(product)
    await db.commit()

    logger.info(f"Product updated: {product_id}")

    return {"status": "updated", "product_id": product_id}
