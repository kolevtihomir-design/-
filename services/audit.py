from sqlalchemy.ext.asyncio import AsyncSession
from models.auth import AuditLog
from typing import Optional, Dict
import logging

logger = logging.getLogger(__name__)


class AuditService:
    @staticmethod
    async def log(
        user_id: Optional[int],
        action: str,
        resource: str,
        status: str = "success",
        details: Optional[Dict] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        error_message: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ):
        """Log audit event."""
        try:
            audit_log = AuditLog(
                user_id=user_id,
                action=action,
                resource=resource,
                status=status,
                details=details or {},
                ip_address=ip_address,
                user_agent=user_agent,
                error_message=error_message,
            )
            if db:
                db.add(audit_log)
                await db.commit()
                logger.info(f"Audit logged: {action} on {resource} by user {user_id}")
        except Exception as e:
            logger.error(f"Failed to log audit: {str(e)}")

    @staticmethod
    async def get_user_audit_log(user_id: int, db: AsyncSession, limit: int = 100):
        """Retrieve audit log for user."""
        from sqlalchemy.future import select
        result = await db.execute(
            select(AuditLog)
            .where(AuditLog.user_id == user_id)
            .order_by(AuditLog.created_at.desc())
            .limit(limit)
        )
        return result.scalars().all()
