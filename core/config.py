from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql+asyncpg://user:password@localhost/b2b_sourcing"

    # API Configuration
    api_title: str = "B2B Sourcing OS (Guard-5)"
    api_version: str = "1.0.0"
    debug: bool = False

    # Security
    secret_key: str = "your-secret-key-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_days: int = 30

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Meilisearch
    meilisearch_url: str = "http://localhost:7700"
    meilisearch_api_key: str = "masterKey"

    # CORS
    cors_origins: list = ["http://localhost:3000", "http://localhost:5173"]

    # Rate Limiting
    rate_limit_requests: int = 30
    rate_limit_period: int = 60

    # External APIs
    stripe_secret_key: str = ""
    stripe_publishable_key: str = ""
    stripe_webhook_secret: str = ""
    serpapi_key: str = ""
    keepa_key: str = ""

    # Email
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    email_from: str = "noreply@b2bsourcing.local"

    # Celery
    celery_broker_url: str = "redis://localhost:6379"
    celery_result_backend: str = "redis://localhost:6379"

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
