from celery import Celery
from core.config import settings
import logging

logger = logging.getLogger(__name__)

app = Celery(
    "b2b_sourcing",
    broker=settings.celery_broker_url,
    backend=settings.celery_result_backend,
)

app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,
)


@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 300})
def send_email_price_drop(self, user_id: int, product_id: int, price: float):
    """Send price drop notification email."""
    logger.info(f"Sending price drop alert to user {user_id} for product {product_id}")
    # TODO: Implement email sending
    return {"status": "sent", "user_id": user_id, "product_id": product_id}


@app.task(bind=True, autoretry_for=(Exception,), retry_kwargs={"max_retries": 3, "countdown": 300})
def send_email_negotiation_accepted(self, user_id: int, deal_id: int):
    """Send negotiation accepted notification."""
    logger.info(f"Sending negotiation accepted to user {user_id} for deal {deal_id}")
    # TODO: Implement email sending
    return {"status": "sent", "user_id": user_id, "deal_id": deal_id}


@app.task(bind=True)
def retrain_ml_models(self):
    """Retrain ML models daily using negotiation history."""
    from core.db import AsyncSessionLocal
    from models.product import NegotiationDeal, NegotiationRound
    from models.billing import MLModelMetadata
    from services.ml_pricing import ml_pricing_model
    from sqlalchemy.future import select
    from datetime import datetime
    import asyncio

    async def _retrain():
        async with AsyncSessionLocal() as db:
            # Get negotiation history
            result = await db.execute(select(NegotiationDeal))
            deals = result.scalars().all()

            if len(deals) < 10:
                logger.warning("Insufficient negotiation data for model retraining")
                return

            # Prepare training data
            training_data = [
                {
                    "initial_price": d.initial_unit_price,
                    "moq": d.quantity,
                    "delivery_days": 30,  # TODO: Get from product
                    "trust_score": 0.75,  # TODO: Calculate
                    "supplier_rating": 4.0,  # TODO: Get from supplier
                    "final_price": d.final_unit_price or d.proposed_unit_price,
                    "success": 1 if d.status == "accepted" else 0,
                }
                for d in deals
            ]

            # Train models
            price_result = ml_pricing_model.train_price_prediction_model(training_data)
            success_result = ml_pricing_model.train_success_prediction_model(training_data)

            # Log metadata
            if price_result["status"] == "success":
                metadata = MLModelMetadata(
                    model_type="price_predictor",
                    version="1.0",
                    training_samples=len(deals),
                    accuracy=price_result.get("r2_score", 0),
                    last_retrained_at=datetime.utcnow(),
                    status="active",
                )
                db.add(metadata)

            if success_result["status"] == "success":
                metadata = MLModelMetadata(
                    model_type="success_predictor",
                    version="1.0",
                    training_samples=len(deals),
                    accuracy=success_result.get("accuracy", 0),
                    last_retrained_at=datetime.utcnow(),
                    status="active",
                )
                db.add(metadata)

            await db.commit()
            logger.info(f"ML models retrained successfully on {len(deals)} deals")

    asyncio.run(_retrain())
    return {"status": "complete"}


@app.task
def cleanup_expired_tokens():
    """Cleanup expired password reset tokens."""
    logger.info("Cleaning up expired tokens")
    # TODO: Implement token cleanup
    return {"status": "complete"}


@app.task
def aggregate_daily_analytics():
    """Aggregate daily platform analytics."""
    logger.info("Aggregating daily analytics")
    # TODO: Implement analytics aggregation
    return {"status": "complete"}


# Schedule periodic tasks
app.conf.beat_schedule = {
    "retrain-ml-models": {
        "task": "tasks.celery_app.retrain_ml_models",
        "schedule": 86400.0,  # Daily
    },
    "cleanup-tokens": {
        "task": "tasks.celery_app.cleanup_expired_tokens",
        "schedule": 86400.0,  # Daily
    },
    "aggregate-analytics": {
        "task": "tasks.celery_app.aggregate_daily_analytics",
        "schedule": 86400.0,  # Daily at specific time
    },
}
