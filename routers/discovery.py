from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from core.db import get_db
from services.discovery import discovery_service, PriceSignal
from models.product import PriceSignal as DBPriceSignal
from typing import List
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/discovery", tags=["discovery"])


class DiscoveryResponse(BaseModel):
    query: str
    total_results: int
    sources: List[str]
    signals: List[PriceSignal]


@router.post("/search")
async def discover_products(
    query: str = Query(..., min_length=2),
    use_cache: bool = True,
    db: AsyncSession = Depends(get_db)
):
    """Discover products from external sources (SerpApi, SearXNG, Keepa)."""
    logger.info(f"Starting discovery for query: '{query}'")

    # Get signals from discovery service
    signals = await discovery_service.discover_product(query)

    if not signals:
        return DiscoveryResponse(
            query=query,
            total_results=0,
            sources=[],
            signals=[]
        )

    # Save signals to database for analytics
    unique_sources = set(s.source for s in signals)
    for signal in signals:
        db_signal = DBPriceSignal(
            product_id=None,  # TODO: Try to match with existing product
            source=signal.source,
            price=signal.price,
            currency=signal.currency,
            confidence=signal.confidence,
        )
        db.add(db_signal)

    try:
        await db.commit()
    except Exception as e:
        logger.warning(f"Failed to save price signals: {str(e)}")
        await db.rollback()

    return DiscoveryResponse(
        query=query,
        total_results=len(signals),
        sources=list(unique_sources),
        signals=signals
    )


@router.get("/sources")
async def get_discovery_sources():
    """Get available discovery sources and their status."""
    return {
        "sources": [
            {
                "name": "serpapi",
                "type": "Google Shopping",
                "confidence": 0.8,
                "availability": "api_key_required",
                "coverage": "global",
            },
            {
                "name": "searxng",
                "type": "Metasearch",
                "confidence": 0.6,
                "availability": "free",
                "coverage": "global",
            },
            {
                "name": "keepa",
                "type": "Amazon Price Tracking",
                "confidence": 0.9,
                "availability": "api_key_required",
                "coverage": "amazon_only",
            },
        ],
    }


@router.post("/amazon/{asin}")
async def discover_amazon_product(
    asin: str,
    db: AsyncSession = Depends(get_db)
):
    """Discover Amazon product by ASIN using Keepa."""
    logger.info(f"Discovering Amazon product: {asin}")

    signal = await discovery_service.discover_via_keepa(asin)

    if not signal:
        return {
            "status": "not_found",
            "message": f"Product with ASIN {asin} not found",
            "asin": asin,
        }

    # Save to database
    db_signal = DBPriceSignal(
        source=signal.source,
        price=signal.price,
        currency=signal.currency,
        confidence=signal.confidence,
    )
    db.add(db_signal)
    await db.commit()

    return {
        "status": "found",
        "product": signal.dict(),
        "source": "keepa",
    }


@router.get("/trending")
async def get_trending_searches(
    limit: int = Query(10, le=50),
    db: AsyncSession = Depends(get_db)
):
    """Get trending product searches (based on discovery activity)."""
    # TODO: Implement based on price_signals aggregation
    return {
        "trending": [
            {
                "query": "Electronic Components",
                "search_count": 1250,
                "unique_discoveries": 85,
            },
            {
                "query": "Industrial Fasteners",
                "search_count": 890,
                "unique_discoveries": 62,
            },
            {
                "query": "Packaging Materials",
                "search_count": 756,
                "unique_discoveries": 48,
            },
        ],
    }


# Import BaseModel for Pydantic
from pydantic import BaseModel
