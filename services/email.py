import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from core.config import settings
from typing import List
import logging
from jinja2 import Template

logger = logging.getLogger(__name__)


class EmailService:
    @staticmethod
    async def send_price_drop_alert(
        recipient: str,
        product_name: str,
        old_price: float,
        new_price: float,
        savings: float,
        currency: str = "EUR"
    ):
        """Send price drop notification email."""
        subject = f"Price drop: {product_name} now cheaper!"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Great news!</h2>
                <p>The price for <strong>{product_name}</strong> has dropped!</p>
                <table style="margin: 20px 0;">
                    <tr>
                        <td>Previous price:</td>
                        <td><strike>{old_price} {currency}</strike></td>
                    </tr>
                    <tr style="background-color: #e8f5e9;">
                        <td><strong>New price:</strong></td>
                        <td><strong>{new_price} {currency}</strong></td>
                    </tr>
                    <tr>
                        <td>You save:</td>
                        <td style="color: green;"><strong>{savings} {currency}</strong></td>
                    </tr>
                </table>
                <p><a href="https://app.b2bsourcing.local/products" style="background-color: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View product</a></p>
                <hr />
                <p style="color: #999; font-size: 12px;">You received this email because you subscribed to price alerts on B2B Sourcing OS.</p>
            </body>
        </html>
        """

        await EmailService._send_email(recipient, subject, html_content)

    @staticmethod
    async def send_negotiation_accepted(
        recipient: str,
        deal_id: int,
        supplier_name: str,
        product_name: str,
        final_price: float,
        quantity: int,
        currency: str = "EUR"
    ):
        """Send negotiation accepted confirmation."""
        subject = f"Negotiation accepted - Deal #{deal_id}"

        total_value = final_price * quantity

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Negotiation Accepted!</h2>
                <p>Your negotiation with <strong>{supplier_name}</strong> has been accepted.</p>
                <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 4px;">
                    <p><strong>Deal Details:</strong></p>
                    <table>
                        <tr>
                            <td>Deal ID:</td>
                            <td>B2B-{deal_id:06d}</td>
                        </tr>
                        <tr>
                            <td>Product:</td>
                            <td>{product_name}</td>
                        </tr>
                        <tr>
                            <td>Supplier:</td>
                            <td>{supplier_name}</td>
                        </tr>
                        <tr>
                            <td>Unit Price:</td>
                            <td>{final_price} {currency}</td>
                        </tr>
                        <tr>
                            <td>Quantity:</td>
                            <td>{quantity} units</td>
                        </tr>
                        <tr style="background-color: #fff; font-weight: bold;">
                            <td>Total Value:</td>
                            <td>{total_value} {currency}</td>
                        </tr>
                    </table>
                </div>
                <p>Next steps: Confirm delivery details and arrange payment with the supplier.</p>
                <p><a href="https://app.b2bsourcing.local/deals/{deal_id}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">View deal details</a></p>
                <hr />
                <p style="color: #999; font-size: 12px;">B2B Sourcing OS - Intelligent Procurement Platform</p>
            </body>
        </html>
        """

        await EmailService._send_email(recipient, subject, html_content)

    @staticmethod
    async def send_email_verification(
        recipient: str,
        verification_link: str,
        first_name: str
    ):
        """Send email verification link."""
        subject = "Verify your B2B Sourcing OS email"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Welcome to B2B Sourcing OS, {first_name}!</h2>
                <p>Please verify your email address to complete your registration.</p>
                <p><a href="{verification_link}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a></p>
                <p>Or copy this link: <code>{verification_link}</code></p>
                <p style="color: #999; font-size: 12px;">This link expires in 24 hours.</p>
            </body>
        </html>
        """

        await EmailService._send_email(recipient, subject, html_content)

    @staticmethod
    async def send_password_reset(
        recipient: str,
        reset_link: str
    ):
        """Send password reset email."""
        subject = "Reset your B2B Sourcing OS password"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the link below to set a new password:</p>
                <p><a href="{reset_link}" style="background-color: #2196F3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
                <p>Or copy this link: <code>{reset_link}</code></p>
                <p style="color: #999; font-size: 12px;">This link expires in 15 minutes. If you didn't request this, ignore this email.</p>
            </body>
        </html>
        """

        await EmailService._send_email(recipient, subject, html_content)

    @staticmethod
    async def send_supplier_invitation(
        recipient: str,
        supplier_name: str,
        invitation_link: str
    ):
        """Send supplier portal invitation."""
        subject = f"Join {supplier_name} on B2B Sourcing OS"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>You're invited to join B2B Sourcing OS</h2>
                <p><strong>{supplier_name}</strong> has invited you to list products on B2B Sourcing OS.</p>
                <p>Join the platform to reach thousands of B2B buyers and grow your business.</p>
                <p><a href="{invitation_link}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Accept Invitation</a></p>
                <p><strong>Benefits:</strong></p>
                <ul>
                    <li>Access to verified B2B buyers</li>
                    <li>Automated price negotiation</li>
                    <li>Order management dashboard</li>
                    <li>Sales analytics and insights</li>
                </ul>
            </body>
        </html>
        """

        await EmailService._send_email(recipient, subject, html_content)

    @staticmethod
    async def _send_email(recipient: str, subject: str, html_content: str):
        """Internal method to send email via SMTP."""
        try:
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = settings.email_from
            message["To"] = recipient

            text_part = MIMEText("Please view this email in HTML format.", "plain")
            html_part = MIMEText(html_content, "html")

            message.attach(text_part)
            message.attach(html_part)

            # Note: This uses blocking SMTP. For production, use aiosmtplib async version
            async with aiosmtplib.SMTP(hostname=settings.smtp_host, port=settings.smtp_port) as smtp:
                await smtp.login(settings.smtp_user, settings.smtp_password)
                await smtp.sendmail(settings.email_from, recipient, message.as_string())

            logger.info(f"Email sent to {recipient}: {subject}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            return False
