from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Enum, Boolean, Text
from sqlalchemy.orm import relationship, Mapped
from sqlalchemy.sql import func
from core.db import Base
from datetime import datetime
import enum


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    products = relationship("Product", back_populates="category")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    country = Column(String(100))
    rating = Column(Float, default=0.0)
    contact_email = Column(String(255))
    verification_status = Column(String(50), default="pending")
    created_at = Column(DateTime, server_default=func.now())

    products = relationship("Product", back_populates="supplier")
    offers = relationship("Offer", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    name = Column(String(255), nullable=False)
    sku = Column(String(100))
    description = Column(Text)
    unit_price = Column(Float, nullable=False)
    currency = Column(String(3), default="EUR")
    moq = Column(Integer, default=1)
    lead_time_days = Column(Integer)
    tags = Column(JSON, default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    category = relationship("Category", back_populates="products")
    supplier = relationship("Supplier", back_populates="products")
    offers = relationship("Offer", back_populates="product")
    price_signals = relationship("PriceSignal", back_populates="product")


class Offer(Base):
    __tablename__ = "offers"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    currency = Column(String(3), default="EUR")
    shipping_cost = Column(Float, default=0)
    delivery_days = Column(Integer)
    notes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="offers")
    supplier = relationship("Supplier", back_populates="offers")


class PriceSignal(Base):
    __tablename__ = "price_signals"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    source = Column(String(100))
    price = Column(Float)
    currency = Column(String(3))
    confidence = Column(Float)
    timestamp = Column(DateTime, server_default=func.now())

    product = relationship("Product", back_populates="price_signals")


class LandedCostRecord(Base):
    __tablename__ = "landed_cost_records"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    unit_price = Column(Float)
    shipping = Column(Float, default=0)
    duties = Column(Float, default=0)
    import_fee = Column(Float, default=0)
    insurance = Column(Float, default=0)
    handling = Column(Float, default=0)
    landed_cost_per_unit = Column(Float)
    created_at = Column(DateTime, server_default=func.now())


class ScoreHistory(Base):
    __tablename__ = "score_history"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    landed_cost_component = Column(Float)
    delivery_component = Column(Float)
    moq_component = Column(Float)
    trust_component = Column(Float)
    final_score = Column(Float)
    timestamp = Column(DateTime, server_default=func.now())


class NegotiationDeal(Base):
    __tablename__ = "negotiation_deals"

    id = Column(Integer, primary_key=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    supplier_id = Column(Integer, ForeignKey("suppliers.id"))
    buyer_id = Column(Integer, ForeignKey("users.id"))
    status = Column(String(50), default="pending")
    initial_unit_price = Column(Float)
    proposed_unit_price = Column(Float)
    final_unit_price = Column(Float)
    quantity = Column(Integer)
    success_probability = Column(Float)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    rounds = relationship("NegotiationRound", back_populates="deal")


class NegotiationRound(Base):
    __tablename__ = "negotiation_rounds"

    id = Column(Integer, primary_key=True)
    deal_id = Column(Integer, ForeignKey("negotiation_deals.id"))
    round_number = Column(Integer)
    initiator = Column(String(50))
    proposed_price = Column(Float)
    response_message = Column(Text)
    status = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())

    deal = relationship("NegotiationDeal", back_populates="rounds")
