import secrets
from datetime import datetime, timedelta
import pyotp
import logging

logger = logging.getLogger(__name__)


class PasswordResetService:
    @staticmethod
    def generate_reset_token(length: int = 32) -> str:
        """Generate secure reset token."""
        return secrets.token_urlsafe(length)

    @staticmethod
    def create_reset_link(email: str, token: str, base_url: str = "http://localhost:3000") -> str:
        """Create password reset link."""
        return f"{base_url}/reset-password?email={email}&token={token}"


class TOTPService:
    @staticmethod
    def generate_secret() -> str:
        """Generate TOTP secret."""
        return pyotp.random_base32()

    @staticmethod
    def get_provisioning_uri(email: str, secret: str, issuer_name: str = "B2B Sourcing OS") -> str:
        """Get provisioning URI for QR code."""
        totp = pyotp.TOTP(secret)
        return totp.provisioning_uri(name=email, issuer_name=issuer_name)

    @staticmethod
    def verify_token(secret: str, token: str, valid_window: int = 1) -> bool:
        """Verify TOTP token with clock skew tolerance."""
        try:
            totp = pyotp.TOTP(secret)
            return totp.verify(token, valid_window=valid_window)
        except Exception as e:
            logger.error(f"TOTP verification failed: {str(e)}")
            return False
