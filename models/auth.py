from sqlalchemy import Column, Integer, String, DateTime, Boolean, Enum, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.db import Base
from datetime import datetime
import enum


class UserRole(enum.Enum):
    admin = "admin"
    buyer = "buyer"
    supplier = "supplier"
    viewer = "viewer"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    first_name = Column(String(100))
    last_name = Column(String(100))
    role = Column(Enum(UserRole), default=UserRole.buyer)
    totp_secret = Column(String(32))
    totp_enabled = Column(Boolean, default=False)
    email_verified = Column(Boolean, default=False)
    active = Column(Boolean, default=True)
    last_login = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    subscriptions = relationship("Subscription", back_populates="user")
    usage_logs = relationship("UsageLog", back_populates="user")
    payment_events = relationship("PaymentEvent", back_populates="user")
    audit_logs = relationship("AuditLog", back_populates="user")
    password_resets = relationship("PasswordReset", back_populates="user")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    action = Column(String(100), nullable=False)
    resource = Column(String(100))
    details = Column(JSON)
    ip_address = Column(String(45))
    user_agent = Column(String(512))
    status = Column(String(50))
    error_message = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])


class PasswordReset(Base):
    __tablename__ = "password_resets"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer)
    token = Column(String(255), unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    user = relationship("User", back_populates="password_resets", foreign_keys=[user_id])
