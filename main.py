from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from core.config import settings
from core.db import Base, engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[
    f"{settings.rate_limit_requests}/minute",
    f"{settings.rate_limit_requests * 60}/hour"
])

app = FastAPI(
    title=settings.api_title,
    version=settings.api_version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# Middleware stack
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Security headers middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
    return response


# Register rate limit exception handler
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    raise HTTPException(status_code=429, detail="Too many requests")


# Health check
@app.get("/health")
async def health_check():
    return {"status": "ok", "version": settings.api_version}


# Database initialization
@app.on_event("startup")
async def startup():
    logger.info("Starting B2B Sourcing OS API...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")


# Routes (will be imported)
# from routers import auth, search, negotiation, billing, kpi, export

logger.info(f"FastAPI app initialized: {settings.api_title} v{settings.api_version}")
