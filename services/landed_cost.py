from pydantic import BaseModel
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class LandedCostResult(BaseModel):
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


class LandedCostService:
    # Country-based rates (shipping %, duty %, import_fee_flat EUR)
    COUNTRY_RATES = {
        "CN": {"shipping_pct": 8.0, "duty_pct": 12.0, "import_fee_flat": 50.0},
        "DE": {"shipping_pct": 3.0, "duty_pct": 5.0, "import_fee_flat": 20.0},
        "PL": {"shipping_pct": 4.0, "duty_pct": 6.0, "import_fee_flat": 25.0},
        "LT": {"shipping_pct": 4.5, "duty_pct": 5.5, "import_fee_flat": 22.0},
        "SE": {"shipping_pct": 5.0, "duty_pct": 4.0, "import_fee_flat": 18.0},
        "US": {"shipping_pct": 6.0, "duty_pct": 10.0, "import_fee_flat": 40.0},
        "GB": {"shipping_pct": 5.5, "duty_pct": 7.0, "import_fee_flat": 30.0},
        "JP": {"shipping_pct": 7.0, "duty_pct": 8.0, "import_fee_flat": 35.0},
    }

    @staticmethod
    def compute(
        unit_price: float,
        quantity: int,
        country: str = "CN",
        shipping: Optional[float] = None,
        duties: Optional[float] = None,
        import_fee: Optional[float] = None,
        insurance: Optional[float] = None,
        handling: Optional[float] = None,
        selling_price_per_unit: Optional[float] = None,
    ) -> LandedCostResult:
        """
        Calculate landed cost per unit.
        Formula: (Unit_Price × Quantity + Shipping + Duties + Import_Fees + Insurance + Handling) / Quantity
        """

        # Get country rates or default
        rates = LandedCostService.COUNTRY_RATES.get(
            country, LandedCostService.COUNTRY_RATES["CN"]
        )

        # Calculate costs if not provided
        total_unit_cost = unit_price * quantity
        shipping = shipping or (total_unit_cost * rates["shipping_pct"] / 100)
        duties = duties or (total_unit_cost * rates["duty_pct"] / 100)
        import_fee = import_fee or rates["import_fee_flat"]
        insurance = insurance or (total_unit_cost * 0.02)  # 2% insurance default
        handling = handling or (quantity * 0.5)  # 0.5 EUR per unit handling

        total_landed_cost = total_unit_cost + shipping + duties + import_fee + insurance + handling
        landed_cost_per_unit = total_landed_cost / quantity if quantity > 0 else 0

        result = LandedCostResult(
            unit_price=unit_price,
            quantity=quantity,
            shipping=shipping,
            duties=duties,
            import_fee=import_fee,
            insurance=insurance,
            handling=handling,
            total_landed_cost=total_landed_cost,
            landed_cost_per_unit=landed_cost_per_unit,
        )

        # Calculate margin if selling price provided
        if selling_price_per_unit:
            gross_profit = selling_price_per_unit - landed_cost_per_unit
            margin_pct = (gross_profit / selling_price_per_unit * 100) if selling_price_per_unit > 0 else 0
            result.margin_pct = margin_pct

        return result


landed_cost_service = LandedCostService()
