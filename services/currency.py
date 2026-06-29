import httpx
from typing import Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class CurrencyConverter:
    BASE_CURRENCY = "EUR"
    SUPPORTED_CURRENCIES = ["USD", "GBP", "CNY", "JPY", "SEK", "PLN", "BGN"]

    # Fallback rates (updated 2024-01-01)
    FALLBACK_RATES = {
        "EUR": 1.0,
        "USD": 1.10,
        "GBP": 0.87,
        "CNY": 7.91,
        "JPY": 163.50,
        "SEK": 12.18,
        "PLN": 4.36,
        "BGN": 1.956,
    }

    def __init__(self):
        self.rates: Dict[str, float] = self.FALLBACK_RATES.copy()
        self.last_updated: Optional[datetime] = None
        self.cache_ttl = timedelta(hours=24)

    async def update_rates(self) -> bool:
        """Fetch latest exchange rates from ECB API."""
        try:
            async with httpx.AsyncClient() as client:
                # ECB latest rates endpoint
                response = await client.get(
                    "https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml",
                    timeout=10.0
                )

                if response.status_code == 200:
                    # Simple XML parsing for rates
                    import xml.etree.ElementTree as ET
                    root = ET.fromstring(response.content)

                    # Extract rates from XML
                    for cube in root.findall(
                        ".//{http://www.ecb.int/vocabulary/2002-08-01/eurofxref}Cube[@currency]"
                    ):
                        currency = cube.get("currency")
                        rate = float(cube.get("rate"))
                        if currency in self.SUPPORTED_CURRENCIES:
                            self.rates[currency] = rate

                    self.last_updated = datetime.utcnow()
                    logger.info(f"Exchange rates updated at {self.last_updated}")
                    return True
        except Exception as e:
            logger.warning(f"Failed to fetch exchange rates: {str(e)}, using fallback rates")
            return False

    def is_cache_valid(self) -> bool:
        """Check if cached rates are still valid."""
        if not self.last_updated:
            return False
        return datetime.utcnow() - self.last_updated < self.cache_ttl

    async def convert(
        self,
        amount: float,
        from_currency: str,
        to_currency: str,
        use_cache: bool = True
    ) -> Optional[float]:
        """
        Convert amount from one currency to another.
        Uses EUR as base currency.
        """
        if from_currency == to_currency:
            return amount

        # Validate currencies
        if from_currency not in self.FALLBACK_RATES or to_currency not in self.FALLBACK_RATES:
            logger.error(f"Unsupported currency pair: {from_currency} -> {to_currency}")
            return None

        # Update rates if needed
        if not use_cache or not self.is_cache_valid():
            await self.update_rates()

        try:
            # Convert to EUR first, then to target currency
            amount_in_eur = amount / self.rates[from_currency]
            converted_amount = amount_in_eur * self.rates[to_currency]
            return round(converted_amount, 2)
        except Exception as e:
            logger.error(f"Conversion error: {str(e)}")
            return None

    def get_rate(self, currency: str) -> Optional[float]:
        """Get current exchange rate for currency."""
        return self.rates.get(currency)

    def get_supported_currencies(self) -> list:
        """Get list of supported currencies."""
        return self.SUPPORTED_CURRENCIES


# Global instance
currency_converter = CurrencyConverter()
