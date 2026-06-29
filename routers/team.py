from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
from typing import List, Optional
from core.db import get_db
from models.team import Team, TeamMember, TeamRole, SharedDeal, TeamAPIKey
from models.auth import User
from models.product import NegotiationDeal
import secrets
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/team", tags=["team"])


class CreateTeamRequest(BaseModel):
    name: str
    description: Optional[str] = None
    website: Optional[str] = None


class TeamResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    description: Optional[str]
    created_at: str


class TeamMemberResponse(BaseModel):
    user_id: int
    email: str
    role: str
    joined_at: str


class InviteMemberRequest(BaseModel):
    email: str
    role: str = "buyer"


class ShareDealRequest(BaseModel):
    deal_id: int
    notes: Optional[str] = None


@router.post("/create", response_model=TeamResponse)
async def create_team(
    req: CreateTeamRequest,
    user_id: int,  # TODO: Get from auth token
    db: AsyncSession = Depends(get_db)
):
    """Create new team/workspace."""
    team = Team(
        name=req.name,
        owner_id=user_id,
        description=req.description,
        website=req.website,
    )
    db.add(team)
    await db.commit()
    await db.refresh(team)

    # Add owner as member
    owner_member = TeamMember(
        team_id=team.id,
        user_id=user_id,
        role=TeamRole.owner,
        accepted_at=datetime.utcnow(),
    )
    db.add(owner_member)
    await db.commit()

    logger.info(f"Team created: {team.id} by user {user_id}")

    return TeamResponse(
        id=team.id,
        name=team.name,
        owner_id=team.owner_id,
        description=team.description,
        created_at=team.created_at.isoformat(),
    )


@router.get("/{team_id}")
async def get_team(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get team details."""
    result = await db.execute(select(Team).where(Team.id == team_id))
    team = result.scalar_one_or_none()

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    # Get members
    members_result = await db.execute(
        select(TeamMember).where(TeamMember.team_id == team_id)
    )
    members = members_result.scalars().all()

    return {
        "id": team.id,
        "name": team.name,
        "owner_id": team.owner_id,
        "description": team.description,
        "member_count": len(members),
        "created_at": team.created_at.isoformat(),
    }


@router.get("/{team_id}/members", response_model=List[TeamMemberResponse])
async def get_team_members(
    team_id: int,
    db: AsyncSession = Depends(get_db)
):
    """Get team members."""
    result = await db.execute(
        select(TeamMember, User)
        .join(User)
        .where(TeamMember.team_id == team_id)
        .where(TeamMember.is_active == True)
    )
    members = result.all()

    return [
        TeamMemberResponse(
            user_id=member.user_id,
            email=user.email,
            role=member.role.value,
            joined_at=member.joined_at.isoformat(),
        )
        for member, user in members
    ]


@router.post("/{team_id}/invite")
async def invite_member(
    team_id: int,
    req: InviteMemberRequest,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Invite user to team."""
    # Check team exists and user is owner
    team_result = await db.execute(select(Team).where(Team.id == team_id))
    team = team_result.scalar_one_or_none()

    if not team:
        raise HTTPException(status_code=404, detail="Team not found")

    if team.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only team owner can invite")

    # Find user by email
    user_result = await db.execute(select(User).where(User.email == req.email))
    target_user = user_result.scalar_one_or_none()

    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if already member
    member_result = await db.execute(
        select(TeamMember).where(
            (TeamMember.team_id == team_id) & (TeamMember.user_id == target_user.id)
        )
    )
    if member_result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="User already in team")

    # Create member invitation
    member = TeamMember(
        team_id=team_id,
        user_id=target_user.id,
        role=TeamRole[req.role],
        invited_at=datetime.utcnow(),
    )
    db.add(member)
    await db.commit()

    logger.info(f"User {target_user.id} invited to team {team_id} as {req.role}")

    return {
        "status": "invited",
        "user_email": target_user.email,
        "role": req.role,
        "message": f"Invitation sent to {target_user.email}",
    }


@router.post("/{team_id}/share-deal")
async def share_deal(
    team_id: int,
    req: ShareDealRequest,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Share negotiation deal with team."""
    # Check user is team member
    member_result = await db.execute(
        select(TeamMember).where(
            (TeamMember.team_id == team_id) & (TeamMember.user_id == user_id)
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not team member")

    # Share deal
    shared_deal = SharedDeal(
        team_id=team_id,
        deal_id=req.deal_id,
        shared_by_id=user_id,
        notes=req.notes,
    )
    db.add(shared_deal)
    await db.commit()

    logger.info(f"Deal {req.deal_id} shared with team {team_id} by user {user_id}")

    return {
        "status": "shared",
        "deal_id": req.deal_id,
        "team_id": team_id,
    }


@router.get("/{team_id}/shared-deals")
async def get_shared_deals(
    team_id: int,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Get deals shared with team."""
    # Check user is team member
    member_result = await db.execute(
        select(TeamMember).where(
            (TeamMember.team_id == team_id) & (TeamMember.user_id == user_id)
        )
    )
    if not member_result.scalar_one_or_none():
        raise HTTPException(status_code=403, detail="Not team member")

    # Get shared deals
    result = await db.execute(
        select(SharedDeal).where(SharedDeal.team_id == team_id)
    )
    deals = result.scalars().all()

    return {
        "team_id": team_id,
        "shared_deals": [
            {
                "deal_id": d.deal_id,
                "shared_by_id": d.shared_by_id,
                "shared_at": d.shared_at.isoformat(),
                "notes": d.notes,
            }
            for d in deals
        ],
    }


@router.post("/{team_id}/api-key")
async def create_api_key(
    team_id: int,
    name: str,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """Create API key for team (B2B integrations)."""
    # Check user is team owner
    team_result = await db.execute(select(Team).where(Team.id == team_id))
    team = team_result.scalar_one_or_none()

    if not team or team.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can create API keys")

    # Generate key
    key = secrets.token_urlsafe(32)

    api_key = TeamAPIKey(
        team_id=team_id,
        key=key,
        name=name,
    )
    db.add(api_key)
    await db.commit()

    logger.info(f"API key created for team {team_id}")

    return {
        "status": "created",
        "api_key": key,
        "name": name,
        "message": "Store this key safely, you won't see it again",
    }


@router.get("/{team_id}/api-keys")
async def list_api_keys(
    team_id: int,
    user_id: int,  # TODO: Get from auth
    db: AsyncSession = Depends(get_db)
):
    """List API keys for team."""
    # Check user is team owner
    team_result = await db.execute(select(Team).where(Team.id == team_id))
    team = team_result.scalar_one_or_none()

    if not team or team.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only owner can view API keys")

    result = await db.execute(
        select(TeamAPIKey).where(
            (TeamAPIKey.team_id == team_id) & (TeamAPIKey.is_active == True)
        )
    )
    keys = result.scalars().all()

    return {
        "team_id": team_id,
        "api_keys": [
            {
                "id": k.id,
                "name": k.name,
                "created_at": k.created_at.isoformat(),
                "last_used_at": k.last_used_at.isoformat() if k.last_used_at else None,
            }
            for k in keys
        ],
    }


# Import datetime for annotations
from datetime import datetime
