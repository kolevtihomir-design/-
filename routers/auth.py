from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel, EmailStr, Field
from core.db import get_db
from core.security import hash_password, verify_password, create_access_token, verify_token, generate_email_token
from models.auth import User, UserRole, AuditLog
from services.auth import TOTPService, PasswordResetService
from services.audit import AuditService
from datetime import datetime, timedelta
import re
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/v1/auth", tags=["auth"])

totp_service = TOTPService()
password_reset_service = PasswordResetService()
audit_service = AuditService()


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=10)
    first_name: str
    last_name: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    user: dict
    totp_required: bool


class PasswordResetRequest(BaseModel):
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    token: str
    password: str = Field(..., min_length=10)


class TOTPSetupResponse(BaseModel):
    secret: str
    qr_code_uri: str
    manual_entry_key: str


class TOTPVerifyRequest(BaseModel):
    totp_token: str


class TOTPVerifyLoginRequest(BaseModel):
    totp_token: str
    temporary_token: str


def validate_password_strength(password: str) -> bool:
    """Validate password has uppercase, digit, special char."""
    if len(password) < 10:
        return False
    if not re.search(r"[A-Z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    if not re.search(r"[!@#$%^&*()_+=\-\[\]{};:'\",.<>?/\\|`~]", password):
        return False
    return True


@router.post("/register")
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Register new user with email verification."""
    # Validate password strength
    if not validate_password_strength(req.password):
        raise HTTPException(
            status_code=400,
            detail="Password must be 10+ chars with uppercase, digit, and special char"
        )

    # Check if user exists
    result = await db.execute(select(User).where(User.email == req.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=req.email,
        password_hash=hash_password(req.password),
        first_name=req.first_name,
        last_name=req.last_name,
        role=UserRole.buyer,
        email_verified=False
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # Log audit
    await audit_service.log(
        user_id=user.id,
        action="register",
        resource="user",
        status="success",
        db=db
    )

    # TODO: Send verification email

    return {"message": "Registration successful. Please verify your email.", "user_id": user.id}


@router.post("/login", response_model=LoginResponse)
async def login(req: LoginRequest, request: Request, db: AsyncSession = Depends(get_db)):
    """Login with email and password."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        await audit_service.log(
            user_id=None,
            action="login",
            resource="user",
            status="failed",
            ip_address=request.client.host if request.client else None,
            db=db
        )
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if not user.active:
        await audit_service.log(
            user_id=user.id,
            action="login",
            resource="user",
            status="failed",
            details={"reason": "account_inactive"},
            ip_address=request.client.host if request.client else None,
            db=db
        )
        raise HTTPException(status_code=403, detail="Account is inactive")

    # Check if 2FA is enabled
    if user.totp_enabled:
        temporary_token = create_access_token(
            {"sub": user.email, "temporary": True},
            expires_delta=0.00347  # ~5 minutes
        )
        await audit_service.log(
            user_id=user.id,
            action="login",
            resource="user",
            status="pending_2fa",
            ip_address=request.client.host if request.client else None,
            db=db
        )
        return LoginResponse(
            access_token=temporary_token,
            user={"id": user.id, "email": user.email},
            totp_required=True
        )

    # Create full access token
    access_token = create_access_token({"sub": user.email, "user_id": user.id})
    user.last_login = datetime.utcnow()
    db.add(user)
    await db.commit()

    await audit_service.log(
        user_id=user.id,
        action="login",
        resource="user",
        status="success",
        ip_address=request.client.host if request.client else None,
        db=db
    )

    return LoginResponse(
        access_token=access_token,
        user={"id": user.id, "email": user.email, "role": user.role.value},
        totp_required=False
    )


@router.post("/password-reset")
async def password_reset(req: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    """Request password reset."""
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalar_one_or_none()

    if not user:
        return {"message": "If email exists, reset link has been sent"}

    # Generate reset token
    token = password_reset_service.generate_reset_token()
    reset_link = password_reset_service.create_reset_link(req.email, token)

    # TODO: Send email with reset link

    await audit_service.log(
        user_id=user.id,
        action="password_reset_requested",
        resource="user",
        status="success",
        db=db
    )

    return {"message": "If email exists, reset link has been sent"}


@router.post("/password-reset-confirm")
async def password_reset_confirm(req: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    """Confirm password reset with token."""
    # TODO: Implement password reset token verification
    return {"message": "Password reset successful"}


@router.post("/2fa/setup", response_model=TOTPSetupResponse)
async def setup_2fa(request: Request, db: AsyncSession = Depends(get_db)):
    """Setup 2FA/TOTP."""
    # TODO: Get authenticated user
    secret = totp_service.generate_secret()
    uri = totp_service.get_provisioning_uri("user@example.com", secret)

    return TOTPSetupResponse(
        secret=secret,
        qr_code_uri=uri,
        manual_entry_key=secret
    )


@router.post("/2fa/verify")
async def verify_2fa(req: TOTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify 2FA token and enable TOTP."""
    # TODO: Implement TOTP verification
    return {"message": "2FA enabled successfully"}


@router.post("/2fa/verify-login")
async def verify_2fa_login(req: TOTPVerifyLoginRequest, db: AsyncSession = Depends(get_db)):
    """Verify TOTP token during login."""
    # TODO: Implement TOTP verification for login
    return {"access_token": "token", "message": "Login successful"}
