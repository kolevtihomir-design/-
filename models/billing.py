from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.db import Base
from datetime import datetime


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stripe_customer_id = Column(String(255))
    stripe_subscription_id = Column(String(255))
    plan = Column(String(50))
    status = Column(String(50), default="active")
    current_period_start = Column(DateTime)
    current_period_end = Column(DateTime)
    trial_end = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User", back_populates="subscriptions")


class UsageLog(Base):
    __tablename__ = "usage_log"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    metric = Column(String(100))
    value = Column(Float)
    date = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="usage_logs")


class PaymentEvent(Base):
    __tablename__ = "payment_events"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    stripe_event_id = Column(String(255), unique=True)
    type = Column(String(100))
    amount = Column(Float)
    currency = Column(String(3))
    status = Column(String(50))
    metadata = Column(JSON)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="payment_events")


class MLModelMetadata(Base):
    __tablename__ = "ml_model_metadata"

    id = Column(Integer, primary_key=True)
    model_type = Column(String(100), nullable=False)
    version = Column(String(20))
    training_samples = Column(Integer)
    accuracy = Column(Float)
    last_retrained_at = Column(DateTime)
    status = Column(String(50), default="active")
    model_bytes = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())
