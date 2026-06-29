from typing import Dict
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class ScoreResult(BaseModel):
    landed_cost_component: float
    delivery_component: float
    moq_component: float
    trust_component: float
    final_score: float


class ScoringService:
    # Normalization bounds
    LANDED_COST_MAX = 5000.0
    DELIVERY_DAYS_MAX = 60
    MOQ_MAX = 500
    TRUST_SCORE_MAX = 1.0

    @staticmethod
    def normalize_value(value: float, max_value: float) -> float:
        """Normalize value to [0, 1] range."""
        if max_value <= 0:
            return 0.0
        normalized = min(value / max_value, 1.0)
        return max(normalized, 0.0)

    @staticmethod
    def score_offer(
        landed_cost_per_unit: float,
        delivery_days: int,
        moq: int,
        trust_score: float,
    ) -> ScoreResult:
        """
        Calculate linear v1 score for offer.
        Score = 40% × Landed_Cost + 25% × Delivery_Days + 20% × MOQ + 15% × Trust_Score
        Lower score = better
        """

        # Normalize components to [0, 1]
        landed_cost_norm = ScoringService.normalize_value(
            landed_cost_per_unit, ScoringService.LANDED_COST_MAX
        )
        delivery_norm = ScoringService.normalize_value(
            delivery_days, ScoringService.DELIVERY_DAYS_MAX
        )
        moq_norm = ScoringService.normalize_value(moq, ScoringService.MOQ_MAX)
        trust_norm = max(0.0, min(trust_score, ScoringService.TRUST_SCORE_MAX))

        # Weighted components
        landed_cost_component = landed_cost_norm * 0.40
        delivery_component = delivery_norm * 0.25
        moq_component = moq_norm * 0.20
        trust_component = (1.0 - trust_norm) * 0.15  # Inverse: lower trust = higher penalty

        # Final score
        final_score = (
            landed_cost_component + delivery_component + moq_component + trust_component
        )

        return ScoreResult(
            landed_cost_component=landed_cost_component,
            delivery_component=delivery_component,
            moq_component=moq_component,
            trust_component=trust_component,
            final_score=final_score,
        )


scoring_service = ScoringService()
