from pydantic import BaseModel
from typing import Optional
from enum import Enum
from services.ml_pricing import ml_pricing_model
import logging

logger = logging.getLogger(__name__)


class NegotiationAction(str, Enum):
    ACCEPT_AUTO = "accept_auto"
    ACCEPT_MANUAL = "accept_manual"
    ESCALATE = "escalate"
    REJECT = "reject"


class NegotiationSimulation(BaseModel):
    proposed_price: float
    success_pct: float
    recommended_action: NegotiationAction
    requires_human_approval: bool
    reasoning: str


class NegotiationRulesEngine:
    DEFAULT_DISCOUNT_RATE = 0.90  # 10% discount target

    @staticmethod
    def simulate(
        current_price: float,
        moq: int,
        delivery_days: int,
        trust_score: float,
        supplier_rating: float,
        deal_number: int,
        ml_enabled: bool = True,
    ) -> NegotiationSimulation:
        """
        Simulate negotiation and recommend action using rules engine + optional ML predictions.
        """

        # ML-based success prediction if model is trained
        success_pct = 50.0  # Default fallback
        if ml_enabled:
            predicted_prob = ml_pricing_model.predict_success_probability(
                initial_price=current_price,
                moq=moq,
                delivery_days=delivery_days,
                trust_score=trust_score,
                supplier_rating=supplier_rating,
            )
            if predicted_prob is not None:
                success_pct = predicted_prob * 100
                logger.info(f"ML prediction: {success_pct:.2f}% success probability")

        # Default proposed price: 10% discount
        proposed_price = current_price * NegotiationRulesEngine.DEFAULT_DISCOUNT_RATE

        # Decision logic
        requires_human_approval = False
        reasoning = ""

        # Rule 1: First 100 deals require escalation for human review
        if deal_number < 100:
            recommended_action = NegotiationAction.ESCALATE
            requires_human_approval = True
            reasoning = f"First 100 deals require human review (deal #{deal_number})"
            return NegotiationSimulation(
                proposed_price=proposed_price,
                success_pct=success_pct,
                recommended_action=recommended_action,
                requires_human_approval=requires_human_approval,
                reasoning=reasoning,
            )

        # Rule 2: Low success probability → escalate
        if success_pct < 30.0:
            recommended_action = NegotiationAction.ESCALATE
            requires_human_approval = True
            reasoning = f"Low success probability ({success_pct:.1f}%) requires human judgment"
            return NegotiationSimulation(
                proposed_price=proposed_price,
                success_pct=success_pct,
                recommended_action=recommended_action,
                requires_human_approval=requires_human_approval,
                reasoning=reasoning,
            )

        # Rule 3: Medium probability → try automated negotiation
        if 30.0 <= success_pct < 70.0:
            recommended_action = NegotiationAction.ACCEPT_MANUAL
            requires_human_approval = True
            reasoning = f"Medium success probability ({success_pct:.1f}%) - recommend negotiation attempt"
            return NegotiationSimulation(
                proposed_price=proposed_price,
                success_pct=success_pct,
                recommended_action=recommended_action,
                requires_human_approval=requires_human_approval,
                reasoning=reasoning,
            )

        # Rule 4: High probability → auto-accept if conditions met
        if success_pct >= 70.0:
            if trust_score >= 0.8 and supplier_rating >= 4.0:
                recommended_action = NegotiationAction.ACCEPT_AUTO
                requires_human_approval = False
                reasoning = f"High success ({success_pct:.1f}%) + trusted supplier (score: {trust_score}, rating: {supplier_rating})"
            else:
                recommended_action = NegotiationAction.ACCEPT_MANUAL
                requires_human_approval = True
                reasoning = f"Good success rate ({success_pct:.1f}%) but manual review recommended"

            return NegotiationSimulation(
                proposed_price=proposed_price,
                success_pct=success_pct,
                recommended_action=recommended_action,
                requires_human_approval=requires_human_approval,
                reasoning=reasoning,
            )

        return NegotiationSimulation(
            proposed_price=proposed_price,
            success_pct=success_pct,
            recommended_action=NegotiationAction.REJECT,
            requires_human_approval=True,
            reasoning="Unable to recommend action",
        )

    @staticmethod
    def decide_action(
        success_probability: float, deal_count: int = 0
    ) -> NegotiationAction:
        """Simplified decision function based on success probability."""
        if deal_count < 100:
            return NegotiationAction.ESCALATE
        if success_probability < 30.0:
            return NegotiationAction.ESCALATE
        if success_probability < 70.0:
            return NegotiationAction.ACCEPT_MANUAL
        return NegotiationAction.ACCEPT_AUTO


negotiation_engine = NegotiationRulesEngine()
