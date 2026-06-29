from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from sqlalchemy.future import select
from core.db import get_db
from models.auth import User
from models.billing import UsageLog, PaymentEvent
from models.product import NegotiationDeal
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/kpi", tags=["kpi"])


@router.get("/user/{user_id}")
async def get_user_kpi(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get user KPI dashboard metrics."""
    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get negotiation stats
    deal_result = await db.execute(
        select(NegotiationDeal).where(NegotiationDeal.buyer_id == user_id)
    )
    deals = deal_result.scalars().all()

    total_deals = len(deals)
    completed_deals = sum(1 for d in deals if d.status == "accepted")
    total_savings = sum(
        (d.initial_unit_price - d.final_unit_price) * d.quantity
        for d in deals
        if d.final_unit_price
    )

    # Get usage stats
    usage_result = await db.execute(
        select(UsageLog).where(UsageLog.user_id == user_id)
    )
    usage_logs = usage_result.scalars().all()

    searches = sum(1 for u in usage_logs if u.metric == "searches")
    negotiations = sum(1 for u in usage_logs if u.metric == "negotiations")

    return {
        "user_id": user_id,
        "email": user.email,
        "negotiation_stats": {
            "total_deals": total_deals,
            "completed_deals": completed_deals,
            "completion_rate": (completed_deals / total_deals * 100) if total_deals > 0 else 0,
            "total_savings_eur": round(total_savings, 2),
        },
        "usage_stats": {
            "searches": searches,
            "negotiations": negotiations,
        },
        "member_since": user.created_at.isoformat(),
    }


@router.get("/user/{user_id}/timeseries")
async def get_user_timeseries(
    user_id: int,
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get user KPI time series (daily metrics)."""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get usage logs
    result = await db.execute(
        select(UsageLog).where(
            (UsageLog.user_id == user_id) & (UsageLog.date >= start_date)
        )
    )
    logs = result.scalars().all()

    # Aggregate by date
    daily_metrics = {}
    for log in logs:
        date_key = log.date.date().isoformat()
        if date_key not in daily_metrics:
            daily_metrics[date_key] = {"searches": 0, "negotiations": 0, "date": date_key}

        if log.metric == "searches":
            daily_metrics[date_key]["searches"] += 1
        elif log.metric == "negotiations":
            daily_metrics[date_key]["negotiations"] += 1

    return {
        "user_id": user_id,
        "period_days": days,
        "data": sorted(daily_metrics.values(), key=lambda x: x["date"]),
    }


@router.get("/platform")
async def get_platform_kpi(db: AsyncSession = Depends(get_db)):
    """Get platform-wide KPI metrics."""
    # Total users
    user_result = await db.execute(select(func.count(User.id)))
    total_users = user_result.scalar() or 0

    # Total negotiation deals
    deal_result = await db.execute(select(func.count(NegotiationDeal.id)))
    total_deals = deal_result.scalar() or 0

    # Completed deals
    completed_result = await db.execute(
        select(func.count(NegotiationDeal.id)).where(
            NegotiationDeal.status == "accepted"
        )
    )
    completed_deals = completed_result.scalar() or 0

    # Total margin saved
    savings_result = await db.execute(
        select(func.sum(
            (NegotiationDeal.initial_unit_price - NegotiationDeal.final_unit_price)
            * NegotiationDeal.quantity
        )).where(NegotiationDeal.final_unit_price.isnot(None))
    )
    total_savings = savings_result.scalar() or 0

    # Total searches
    search_result = await db.execute(
        select(func.count(UsageLog.id)).where(UsageLog.metric == "searches")
    )
    total_searches = search_result.scalar() or 0

    # Revenue (from payments)
    revenue_result = await db.execute(
        select(func.sum(PaymentEvent.amount)).where(
            PaymentEvent.status == "completed"
        )
    )
    total_revenue = revenue_result.scalar() or 0

    return {
        "users": {
            "total": total_users,
            "active_this_month": 0,  # TODO: Calculate
        },
        "negotiations": {
            "total_deals": total_deals,
            "completed_deals": completed_deals,
            "completion_rate": (completed_deals / total_deals * 100) if total_deals > 0 else 0,
            "total_margin_saved_eur": round(total_savings, 2),
            "avg_savings_per_deal": round(
                total_savings / completed_deals, 2
            ) if completed_deals > 0 else 0,
        },
        "platform": {
            "total_searches": total_searches,
            "total_revenue_usd": round(total_revenue, 2),
            "avg_revenue_per_user": round(
                total_revenue / total_users, 2
            ) if total_users > 0 else 0,
        },
    }


@router.get("/platform/timeseries")
async def get_platform_timeseries(
    days: int = Query(30, ge=1, le=365),
    db: AsyncSession = Depends(get_db)
):
    """Get platform KPI time series (daily metrics)."""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Get usage logs
    result = await db.execute(
        select(UsageLog).where(UsageLog.date >= start_date)
    )
    logs = result.scalars().all()

    # Get deals
    deal_result = await db.execute(
        select(NegotiationDeal).where(NegotiationDeal.created_at >= start_date)
    )
    deals = deal_result.scalars().all()

    # Aggregate by date
    daily_metrics = {}

    for log in logs:
        date_key = log.date.date().isoformat()
        if date_key not in daily_metrics:
            daily_metrics[date_key] = {
                "date": date_key,
                "searches": 0,
                "negotiations": 0,
                "margin_saved": 0,
            }

        if log.metric == "searches":
            daily_metrics[date_key]["searches"] += 1
        elif log.metric == "negotiations":
            daily_metrics[date_key]["negotiations"] += 1

    for deal in deals:
        date_key = deal.created_at.date().isoformat()
        if date_key not in daily_metrics:
            daily_metrics[date_key] = {
                "date": date_key,
                "searches": 0,
                "negotiations": 0,
                "margin_saved": 0,
            }

        if deal.status == "accepted" and deal.final_unit_price:
            savings = (deal.initial_unit_price - deal.final_unit_price) * deal.quantity
            daily_metrics[date_key]["margin_saved"] += savings

    return {
        "period_days": days,
        "data": sorted(daily_metrics.values(), key=lambda x: x["date"]),
    }
