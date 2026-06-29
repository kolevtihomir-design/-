from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr
from typing import Optional
from core.db import get_db
from core.config import settings
from models.auth import User
from models.billing import Subscription, UsageLog, PaymentEvent
import stripe
import logging
import json
import hmac
import hashlib

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/billing", tags=["billing"])

stripe.api_key = settings.stripe_secret_key

# Plan configurations
PLANS = {
    "free": {"price_usd": 0, "searches_per_month": 100, "negotiations": 5},
    "pro": {"price_usd": 99, "searches_per_month": 10000, "negotiations": 500},
    "enterprise": {"price_usd": 499, "searches_per_month": None, "negotiations": None},
}

STRIPE_PRICE_IDS = {
    "free": None,
    "pro": "price_pro_monthly",  # TODO: Update with actual Stripe price ID
    "enterprise": "price_enterprise_monthly",  # TODO: Update
}


class UserCreateRequest(BaseModel):
    email: EmailStr
    first_name: str
    last_name: str


class SubscriptionResponse(BaseModel):
    user_id: int
    plan: str
    status: str
    stripe_customer_id: Optional[str] = None
    current_period_end: Optional[str] = None


class PaymentWebhookRequest(BaseModel):
    type: str
    data: dict


@router.post("/users")
async def create_user(
    req: UserCreateRequest,
    db: AsyncSession = Depends(get_db)
):
    """Create new user (billing perspective)."""
    # Check if user exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already exists")

    # Create Stripe customer
    try:
        customer = stripe.Customer.create(
            email=req.email,
            name=f"{req.first_name} {req.last_name}",
        )
    except stripe.error.StripeError as e:
        logger.error(f"Stripe customer creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Payment setup failed")

    # Create user
    user = User(
        email=req.email,
        password_hash="",  # TODO: Set during registration
        first_name=req.first_name,
        last_name=req.last_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Create free subscription
    subscription = Subscription(
        user_id=user.id,
        stripe_customer_id=customer.id,
        plan="free",
        status="active",
    )
    db.add(subscription)
    await db.commit()

    return {
        "user_id": user.id,
        "email": user.email,
        "plan": "free",
        "stripe_customer_id": customer.id,
    }


@router.get("/users/{user_id}/subscription", response_model=SubscriptionResponse)
async def get_subscription(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get user subscription details."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    return SubscriptionResponse(
        user_id=subscription.user_id,
        plan=subscription.plan,
        status=subscription.status,
        stripe_customer_id=subscription.stripe_customer_id,
        current_period_end=subscription.current_period_end.isoformat()
        if subscription.current_period_end
        else None,
    )


@router.post("/subscribe/{user_id}/{plan}")
async def upgrade_subscription(
    user_id: int,
    plan: str,
    db: AsyncSession = Depends(get_db)
):
    """Upgrade to paid plan."""
    if plan not in PLANS:
        raise HTTPException(status_code=400, detail="Invalid plan")

    # Get subscription
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Create Stripe subscription
    price_id = STRIPE_PRICE_IDS.get(plan)
    if not price_id:
        raise HTTPException(status_code=400, detail="Plan not available in Stripe")

    try:
        stripe_subscription = stripe.Subscription.create(
            customer=subscription.stripe_customer_id,
            items=[{"price": price_id}],
            trial_period_days=7 if plan != "free" else None,
        )

        subscription.plan = plan
        subscription.status = "active"
        subscription.stripe_subscription_id = stripe_subscription.id
        subscription.trial_end = (
            stripe_subscription.trial_end if stripe_subscription.trial_end else None
        )
        db.add(subscription)
        await db.commit()

        return {
            "user_id": user_id,
            "plan": plan,
            "status": "active",
            "trial_days": 7 if plan != "free" else 0,
        }
    except stripe.error.StripeError as e:
        logger.error(f"Subscription creation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Subscription failed")


@router.post("/webhook")
async def handle_stripe_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    """Handle Stripe webhook events."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.stripe_webhook_secret
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle different event types
    if event["type"] == "invoice.payment_succeeded":
        customer_id = event["data"]["object"]["customer"]
        amount = event["data"]["object"]["amount_paid"] / 100  # Convert from cents

        # Find user and log payment
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_customer_id == customer_id
            )
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            payment_event = PaymentEvent(
                user_id=subscription.user_id,
                stripe_event_id=event["id"],
                type="payment_succeeded",
                amount=amount,
                currency="USD",
                status="completed",
                metadata=event["data"]["object"],
            )
            db.add(payment_event)
            await db.commit()
            logger.info(f"Payment logged for user {subscription.user_id}")

    elif event["type"] == "customer.subscription.deleted":
        customer_id = event["data"]["object"]["customer"]
        result = await db.execute(
            select(Subscription).where(
                Subscription.stripe_customer_id == customer_id
            )
        )
        subscription = result.scalar_one_or_none()

        if subscription:
            subscription.status = "canceled"
            subscription.plan = "free"
            db.add(subscription)
            await db.commit()
            logger.info(f"Subscription canceled for user {subscription.user_id}")

    return {"status": "ok"}


@router.get("/usage/{user_id}")
async def get_usage(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get user plan usage statistics."""
    result = await db.execute(
        select(Subscription).where(Subscription.user_id == user_id)
    )
    subscription = result.scalar_one_or_none()

    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")

    # Get usage logs
    usage_result = await db.execute(
        select(UsageLog).where(UsageLog.user_id == user_id)
    )
    usage_logs = usage_result.scalars().all()

    # Aggregate metrics
    searches = sum(1 for u in usage_logs if u.metric == "searches")
    negotiations = sum(1 for u in usage_logs if u.metric == "negotiations")

    plan_info = PLANS[subscription.plan]

    return {
        "user_id": user_id,
        "plan": subscription.plan,
        "searches": {
            "used": searches,
            "limit": plan_info["searches_per_month"],
        },
        "negotiations": {
            "used": negotiations,
            "limit": plan_info["negotiations"],
        },
    }
