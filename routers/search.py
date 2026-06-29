from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from core.db import get_db
from models.product import Product, Category, Offer, Supplier
from services.scoring import scoring_service
from services.ml_pricing import ml_pricing_model
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/search", tags=["search"])


class SearchFilters(BaseModel):
    category_id: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_rating: Optional[float] = None
    max_moq: Optional[int] = None
    max_delivery_days: Optional[int] = None
    country: Optional[str] = None


class OfferResult(BaseModel):
    id: int
    product_id: int
    product_name: str
    supplier_name: str
    unit_price: float
    currency: str
    moq: int
    delivery_days: int
    supplier_rating: float
    landed_cost_per_unit: float
    score: float
    supplier_country: str


class SearchResponse(BaseModel):
    total: int
    results: List[OfferResult]


@router.post("/", response_model=SearchResponse)
async def search_products(
    query: str = Query(..., min_length=2),
    limit: int = Query(20, le=100),
    offset: int = Query(0, ge=0),
    filters: Optional[SearchFilters] = None,
    db: AsyncSession = Depends(get_db)
):
    """Full-text search for products with scoring and filtering."""
    try:
        # Simple text search on product name and description
        result = await db.execute(
            select(Product, Supplier)
            .join(Supplier)
            .where(
                (Product.name.ilike(f"%{query}%")) |
                (Product.description.ilike(f"%{query}%"))
            )
            .limit(limit + offset)
        )
        products = result.all()

        if not products:
            return SearchResponse(total=0, results=[])

        # Apply filters
        filtered_results = []
        for product, supplier in products:
            if filters:
                if filters.category_id and product.category_id != filters.category_id:
                    continue
                if filters.min_price and product.unit_price < filters.min_price:
                    continue
                if filters.max_price and product.unit_price > filters.max_price:
                    continue
                if filters.min_rating and supplier.rating < filters.min_rating:
                    continue
                if filters.country and supplier.country != filters.country:
                    continue

            # Get best offer for this product
            offer_result = await db.execute(
                select(Offer).where(Offer.product_id == product.id).limit(1)
            )
            offer = offer_result.scalar_one_or_none()

            if not offer:
                continue

            # Calculate score
            score_result = scoring_service.score_offer(
                landed_cost_per_unit=offer.unit_price,
                delivery_days=offer.delivery_days or 30,
                moq=offer.quantity or product.moq,
                trust_score=0.75,  # TODO: Calculate from history
            )

            filtered_results.append(
                OfferResult(
                    id=offer.id,
                    product_id=product.id,
                    product_name=product.name,
                    supplier_name=supplier.name,
                    unit_price=offer.unit_price,
                    currency=offer.currency,
                    moq=offer.quantity or product.moq,
                    delivery_days=offer.delivery_days or product.lead_time_days or 30,
                    supplier_rating=supplier.rating,
                    landed_cost_per_unit=offer.unit_price,  # TODO: Calculate
                    score=score_result.final_score,
                    supplier_country=supplier.country or "Unknown",
                )
            )

        # Sort by score (ascending = better)
        filtered_results.sort(key=lambda x: x.score)

        # Apply pagination
        paginated_results = filtered_results[offset : offset + limit]

        return SearchResponse(total=len(filtered_results), results=paginated_results)

    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail="Search failed")


@router.get("/categories")
async def get_categories(db: AsyncSession = Depends(get_db)):
    """Get all product categories."""
    result = await db.execute(select(Category))
    categories = result.scalars().all()
    return {"categories": [{"id": c.id, "name": c.name} for c in categories]}


@router.get("/suppliers")
async def get_suppliers(
    country: Optional[str] = None,
    min_rating: float = Query(0, ge=0, le=5),
    db: AsyncSession = Depends(get_db)
):
    """Get suppliers with filters."""
    query = select(Supplier).where(Supplier.rating >= min_rating)

    if country:
        query = query.where(Supplier.country == country)

    result = await db.execute(query)
    suppliers = result.scalars().all()

    return {
        "suppliers": [
            {
                "id": s.id,
                "name": s.name,
                "country": s.country,
                "rating": s.rating,
                "verified": s.verification_status == "verified",
            }
            for s in suppliers
        ]
    }


@router.get("/trending")
async def get_trending_products(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get trending products based on recent searches."""
    # TODO: Implement based on search analytics
    result = await db.execute(select(Product).limit(limit))
    products = result.scalars().all()

    return {
        "trending": [
            {"id": p.id, "name": p.name, "category": "Electronics"}
            for p in products
        ]
    }


@router.get("/similar/{product_id}")
async def get_similar_products(
    product_id: int,
    limit: int = Query(5, le=20),
    db: AsyncSession = Depends(get_db)
):
    """Get similar products to compare."""
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()

    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get similar products in same category
    similar = await db.execute(
        select(Product)
        .where(Product.category_id == product.category_id)
        .where(Product.id != product_id)
        .limit(limit)
    )
    similar_products = similar.scalars().all()

    return {
        "base_product_id": product_id,
        "similar": [
            {
                "id": p.id,
                "name": p.name,
                "price": p.unit_price,
                "supplier": p.supplier_id,
            }
            for p in similar_products
        ],
    }
