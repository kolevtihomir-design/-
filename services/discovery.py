import httpx
from typing import List, Dict, Optional
from pydantic import BaseModel
from core.config import settings
import logging

logger = logging.getLogger(__name__)


class PriceSignal(BaseModel):
    product_name: str
    supplier: str
    price: float
    currency: str
    quantity: int
    delivery_days: int
    source: str
    confidence: float
    url: Optional[str] = None


class DiscoveryService:
    @staticmethod
    async def discover_via_serpapi(query: str, num_results: int = 5) -> List[PriceSignal]:
        """Discover products via Google Shopping (SerpApi)."""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "q": query,
                    "tbm": "shop",  # Google Shopping
                    "api_key": settings.serpapi_key,
                    "num": num_results,
                }

                response = await client.get("https://serpapi.com/search", params=params, timeout=10.0)

                if response.status_code != 200:
                    logger.warning(f"SerpApi error: {response.status_code}")
                    return []

                data = response.json()
                signals = []

                for item in data.get("shopping_results", [])[:num_results]:
                    signal = PriceSignal(
                        product_name=item.get("title", ""),
                        supplier=item.get("source", ""),
                        price=float(item.get("price", 0)),
                        currency=item.get("currency", "EUR"),
                        quantity=1,
                        delivery_days=7,  # Default
                        source="serpapi",
                        confidence=0.8,
                        url=item.get("link", ""),
                    )
                    signals.append(signal)

                logger.info(f"SerpApi found {len(signals)} products for '{query}'")
                return signals

        except Exception as e:
            logger.error(f"SerpApi discovery error: {str(e)}")
            return []

    @staticmethod
    async def discover_via_searxng(query: str, num_results: int = 5) -> List[PriceSignal]:
        """Discover products via SearXNG metasearch."""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "q": query,
                    "format": "json",
                    "pageno": 1,
                    "categories": "shopping",
                }

                # Using public SearXNG instance
                response = await client.get(
                    "https://searx.be/search",
                    params=params,
                    timeout=10.0
                )

                if response.status_code != 200:
                    logger.warning(f"SearXNG error: {response.status_code}")
                    return []

                data = response.json()
                signals = []

                for item in data.get("results", [])[:num_results]:
                    signal = PriceSignal(
                        product_name=item.get("title", ""),
                        supplier=item.get("engine", ""),
                        price=0.0,  # SearXNG doesn't always include price
                        currency="EUR",
                        quantity=1,
                        delivery_days=10,
                        source="searxng",
                        confidence=0.6,
                        url=item.get("url", ""),
                    )
                    signals.append(signal)

                logger.info(f"SearXNG found {len(signals)} results for '{query}'")
                return signals

        except Exception as e:
            logger.error(f"SearXNG discovery error: {str(e)}")
            return []

    @staticmethod
    async def discover_via_keepa(asin: str) -> Optional[PriceSignal]:
        """Discover product via Keepa (Amazon price tracking)."""
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "key": settings.keepa_key,
                    "domain": "com",  # Amazon.com
                    "asin": asin,
                    "history": "csv",
                    "update": 0,
                }

                response = await client.get(
                    "https://api.keepa.com/product",
                    params=params,
                    timeout=10.0
                )

                if response.status_code != 200:
                    logger.warning(f"Keepa error: {response.status_code}")
                    return None

                data = response.json()

                if "products" not in data or len(data["products"]) == 0:
                    return None

                product = data["products"][0]

                signal = PriceSignal(
                    product_name=product.get("title", ""),
                    supplier="Amazon",
                    price=product.get("current", [0, 0])[1] / 100,  # Price in cents
                    currency="USD",
                    quantity=1,
                    delivery_days=2,
                    source="keepa",
                    confidence=0.9,
                    url=f"https://www.amazon.com/dp/{asin}",
                )

                logger.info(f"Keepa found price for ASIN {asin}")
                return signal

        except Exception as e:
            logger.error(f"Keepa discovery error: {str(e)}")
            return None

    @staticmethod
    async def discover_product(query: str) -> List[PriceSignal]:
        """
        Comprehensive discovery using multiple sources.
        Falls back through sources in priority order.
        """
        all_signals = []

        # Try SerpApi first (highest confidence)
        if settings.serpapi_key:
            signals = await DiscoveryService.discover_via_serpapi(query)
            all_signals.extend(signals)

        # Try SearXNG second (good coverage)
        signals = await DiscoveryService.discover_via_searxng(query)
        all_signals.extend(signals)

        # Deduplicate by product name
        seen = set()
        unique_signals = []
        for signal in all_signals:
            key = signal.product_name.lower()
            if key not in seen:
                seen.add(key)
                unique_signals.append(signal)

        logger.info(f"Discovery found {len(unique_signals)} unique products for '{query}'")
        return unique_signals[:10]  # Return top 10


discovery_service = DiscoveryService()
