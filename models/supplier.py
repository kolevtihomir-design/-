from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.db import Base
from datetime import datetime


class SupplierAccount(Base):
    __tablename__ = "supplier_accounts"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    company_name = Column(String(255), nullable=False)
    registration_number = Column(String(100))
    tax_id = Column(String(100))
    business_type = Column(String(100))
    description = Column(Text)
    logo_url = Column(String(512))
    website = Column(String(255))
    phone = Column(String(20))
    address_line1 = Column(String(255))
    address_line2 = Column(String(255))
    city = Column(String(100))
    state_province = Column(String(100))
    postal_code = Column(String(20))
    country = Column(String(2))
    verification_status = Column(String(50), default="pending")
    document_urls = Column(JSON, default=[])
    bank_details = Column(JSON, default={})
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    user = relationship("User")
    products = relationship("SupplierProduct", back_populates="account")
    metrics = relationship("SupplierMetrics", back_populates="account")
    payouts = relationship("SupplierPayout", back_populates="account")


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    id = Column(Integer, primary_key=True)
    supplier_account_id = Column(Integer, ForeignKey("supplier_accounts.id"))
    name = Column(String(255), nullable=False)
    sku = Column(String(100))
    description = Column(Text)
    category = Column(String(100))
    unit_price = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    moq = Column(Integer, default=1)
    lead_time_days = Column(Integer, default=30)
    stock_quantity = Column(Integer, default=0)
    tags = Column(JSON, default=[])
    images = Column(JSON, default=[])
    specifications = Column(JSON, default={})
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    account = relationship("SupplierAccount", back_populates="products")


class SupplierMetrics(Base):
    __tablename__ = "supplier_metrics"

    id = Column(Integer, primary_key=True)
    supplier_account_id = Column(Integer, ForeignKey("supplier_accounts.id"))
    total_negotiations = Column(Integer, default=0)
    successful_negotiations = Column(Integer, default=0)
    average_discount_pct = Column(Float, default=0)
    total_revenue_usd = Column(Float, default=0)
    total_margin_usd = Column(Float, default=0)
    average_response_time_hours = Column(Float, default=0)
    customer_rating = Column(Float, default=0)
    repeat_customer_rate = Column(Float, default=0)
    calculated_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    account = relationship("SupplierAccount", back_populates="metrics")


class SupplierPayout(Base):
    __tablename__ = "supplier_payouts"

    id = Column(Integer, primary_key=True)
    supplier_account_id = Column(Integer, ForeignKey("supplier_accounts.id"))
    period_start = Column(DateTime)
    period_end = Column(DateTime)
    gross_revenue = Column(Float)
    platform_fee_pct = Column(Float, default=5)
    platform_fee_amount = Column(Float)
    net_payout = Column(Float)
    status = Column(String(50), default="pending")
    payment_method = Column(String(50))
    transaction_id = Column(String(255))
    paid_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    account = relationship("SupplierAccount", back_populates="payouts")
