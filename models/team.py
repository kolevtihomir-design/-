from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from core.db import Base
from datetime import datetime
import enum


class TeamRole(enum.Enum):
    owner = "owner"
    manager = "manager"
    buyer = "buyer"
    viewer = "viewer"


class Team(Base):
    __tablename__ = "teams"

    id = Column(Integer, primary_key=True)
    name = Column(String(255), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"))
    description = Column(String(500))
    logo_url = Column(String(512))
    website = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, onupdate=func.now())

    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")
    shared_deals = relationship("SharedDeal", back_populates="team")
    api_keys = relationship("TeamAPIKey", back_populates="team")


class TeamMember(Base):
    __tablename__ = "team_members"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    role = Column(Enum(TeamRole), default=TeamRole.buyer)
    permissions = Column(JSON, default={})  # Custom permission flags
    joined_at = Column(DateTime, server_default=func.now())
    invited_at = Column(DateTime)
    accepted_at = Column(DateTime)
    is_active = Column(Boolean, default=True)

    team = relationship("Team", back_populates="members")
    user = relationship("User")


class SharedDeal(Base):
    __tablename__ = "shared_deals"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    deal_id = Column(Integer, ForeignKey("negotiation_deals.id"))
    shared_by_id = Column(Integer, ForeignKey("users.id"))
    shared_at = Column(DateTime, server_default=func.now())
    notes = Column(String(500))

    team = relationship("Team", back_populates="shared_deals")


class TeamAPIKey(Base):
    __tablename__ = "team_api_keys"

    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey("teams.id"))
    key = Column(String(255), unique=True, nullable=False)
    name = Column(String(100))
    last_used_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    is_active = Column(Boolean, default=True)

    team = relationship("Team", back_populates="api_keys")
