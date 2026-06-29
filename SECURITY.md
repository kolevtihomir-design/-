# B2B Sourcing OS - Security Hardening Guide

## Overview

This document outlines comprehensive security measures implemented in B2B Sourcing OS and additional hardening steps for production deployment.

---

## ✅ Implemented Security Features

### Authentication & Authorization

#### Password Security
- **Hashing:** bcrypt with 12 rounds (industry standard)
- **Strength Validation:** 10+ characters, uppercase, digit, special character
- **Storage:** Never stored in plain text, always hashed
- **Transmission:** HTTPS only (enforced in production)

#### JWT Tokens
- **Algorithm:** HS256 (HMAC-SHA256)
- **Expiry:** 30 days (configurable)
- **Refresh:** Implement refresh token pattern (TODO)
- **Storage:** AsyncStorage for mobile, localStorage for web
- **Validation:** Signature verification on every request

#### Email Verification
- **Token Generation:** secrets.token_urlsafe(32)
- **Expiry:** 15 minutes (configurable)
- **One-Time Use:** Token marked used after verification
- **Rate Limited:** Account registration rate limited

#### Password Reset
- **Token Generation:** secrets.token_urlsafe(32)
- **Expiry:** 15 minutes
- **One-Time Use:** Token marked used after reset
- **Email Verification:** Confirmation sent to registered email

#### 2FA / TOTP
- **Standard:** RFC 6238 (Time-based One-Time Password)
- **Library:** pyotp (industry standard)
- **Clock Skew:** ±30 seconds tolerance (handles clock drift)
- **QR Code:** Provisioning URI for Google Authenticator
- **Backup:** Manual entry key provided
- **Mandatory For:** Admin accounts (TODO)

### API Security

#### Rate Limiting
- **Rate:** 30 requests/minute per IP address
- **Implementation:** slowapi middleware
- **Bypass:** Whitelist admin IPs (TODO)
- **Response:** HTTP 429 (Too Many Requests)
- **Tracking:** Per-IP counters in Redis

#### Security Headers
```
X-Content-Type-Options: nosniff              # Prevent MIME type sniffing
X-Frame-Options: DENY                       # Prevent clickjacking
X-XSS-Protection: 1; mode=block              # XSS filter in browsers
Strict-Transport-Security: max-age=31536000  # Force HTTPS for 1 year
Content-Security-Policy: default-src 'self'  # Restrict resource loading
```

#### CORS Configuration
- **Whitelist:** Configurable allowed origins
- **Methods:** GET, POST, PUT, DELETE
- **Credentials:** Allowed (for cookie-based sessions if used)
- **Preflight:** Automatic CORS preflight handling

#### Trusted Hosts
- **Middleware:** TrustedHostMiddleware
- **Validation:** Hostname verification
- **Configuration:** Whitelist in settings

### Data Protection

#### Audit Logging
```
AuditLog Model:
├── user_id           # Who performed action
├── action            # What (register, login, password_reset, etc.)
├── resource          # On what (user, deal, product)
├── details           # Additional context (JSON)
├── ip_address        # Source IP (for geographic anomalies)
├── user_agent        # Device/browser info
├── status            # success/failed/error
├── error_message     # Why it failed
└── created_at        # Timestamp (UTC)
```

**Logged Operations:**
- User registration
- Login attempts (success & failure)
- Password changes
- 2FA enable/disable
- Password resets
- Deal creation/acceptance
- Supplier registration
- API key generation
- Team member invitation

#### JSONB Sensitive Data
- **Bank Details:** Stored in JSONB (TODO: encrypt at-rest)
- **Document URLs:** Stored in JSONB
- **Permissions:** Stored in JSONB
- **Consideration:** Encryption key management for production

### External API Security

#### Stripe Integration
- **Authentication:** API key in Authorization header
- **Webhook Validation:** Signature verification (HMAC-SHA256)
- **Retry Logic:** Exponential backoff (2^n seconds, max 3600s)
- **Event Types:** Handled: invoice.payment_succeeded, subscription.deleted
- **Idempotency:** Event ID deduplication

#### Third-Party APIs
- **SerpApi:** API key authentication, rate limits honored
- **Keepa:** API key authentication, request throttling
- **ECB:** Rate limiting (1 request per hour)
- **SearXNG:** Public instance, no authentication

### Input Validation

#### Email Validation
- **Library:** pydantic EmailStr
- **Format:** RFC 5322 compliant
- **Uniqueness:** Database constraint (unique index)

#### Password Validation
- **Min Length:** 10 characters
- **Uppercase:** At least 1 [A-Z]
- **Digit:** At least 1 [0-9]
- **Special:** At least 1 [!@#$%^&*()_+=\-\[\]{};:'\",.<>?/\\|`~]

#### Query Parameters
- **Search:** min_length=2, max_length=255
- **Pagination:** offset >= 0, limit <= 100
- **Numbers:** Type validation (int, float)

#### Request Body
- **Model Validation:** Pydantic BaseModel
- **Type Checking:** Strict type validation
- **Size Limits:** (TODO: Implement max request body size)

---

## 🔒 Production Hardening Recommendations

### Infrastructure

#### HTTPS/TLS
```bash
# Use Let's Encrypt with certbot
certbot certonly --standalone -d b2bsourcing.local

# Or with Kubernetes cert-manager
kubectl apply -f k8s/cert-manager.yaml
```

**Configuration:**
- TLS 1.2+ only (disable 1.0, 1.1)
- Strong cipher suites only
- HSTS preload enabled
- Certificate pinning for mobile (optional)

#### Reverse Proxy
- Use nginx or Caddy in front of FastAPI
- Rate limit at proxy level (more efficient)
- Request size limits (e.g., 10MB max)
- Request timeout settings (30s default)

#### Database Connection
- PostgreSQL over SSL/TLS
- Connection pooling (asyncpg with min_size=10, max_size=20)
- Connection encryption: sslmode=require
- Regular password rotation

#### Redis Connection
- Redis with requirepass authentication
- SSL/TLS for production
- ACL (Access Control Lists) for Celery user
- Firewall rules (bind 127.0.0.1 or private network)

### Secrets Management

#### Environment Variables
```bash
# Use secure secret manager
# Option 1: HashiCorp Vault
vault kv put secret/b2b-sourcing \
  DATABASE_URL=... \
  STRIPE_SECRET_KEY=... \
  JWT_SECRET_KEY=...

# Option 2: AWS Secrets Manager
aws secretsmanager create-secret \
  --name b2b-sourcing \
  --secret-string file://secrets.json

# Option 3: Kubernetes Secrets
kubectl create secret generic b2b-secrets \
  --from-env-file=.env.prod
```

**Never:**
- Commit .env files to git
- Log secret values
- Pass secrets in URLs
- Use default passwords

### Authentication Hardening

#### Admin Accounts
- Require 2FA for all admin users (TODO)
- Temporary session limits (30 minutes)
- IP whitelist for admin access
- Separate logging for admin actions
- Weekly password change requirement (TODO)

#### API Keys
- Hashed before storage (bcrypt)
- Rotation policy (90-day expiry)
- Audit logging on usage
- Scoped permissions (TODO: implement)
- Rate limiting per key (TODO)

#### Service-to-Service
- mTLS (mutual TLS) for microservices
- Service mesh (Istio) for traffic control
- API key authentication for external calls
- Request signing with HMAC-SHA256

### Application Security

#### OWASP Top 10 Mitigation

| Risk | Mitigation | Status |
|------|-----------|--------|
| Injection | Parameterized queries (SQLAlchemy) | ✅ |
| Broken Auth | bcrypt + JWT + 2FA | ✅ |
| XSS | CSP headers, HTML escaping | ✅ |
| CSRF | Token validation (SameSite cookies) | ⚠️ TODO |
| XXE | XML parsing disabled | ✅ |
| Broken Access | Role-based RBAC | ⚠️ Partial |
| Sensitive Data Exposure | HTTPS + at-rest encryption | ✅ HTTPS only |
| XXE | Entity expansion disabled | ✅ |
| Broken Authn | Session management + audit logs | ✅ |
| Using Components with Known Vulns | Dependency scanning | ⚠️ TODO |

#### Dependency Security
```bash
# Scan for vulnerabilities
pip install safety
safety check

# Or use GitHub Dependabot
# Automatically checks requirements.txt for vulns

# Keep dependencies updated
pip install --upgrade pip
pip install -U -r requirements.txt
```

#### Code Security
```bash
# Static analysis
pip install bandit
bandit -r . -f json

# SAST (Static Application Security Testing)
# Use GitHub CodeQL or Snyk
```

### Network Security

#### Firewall Rules
```bash
# Allow only necessary ports
# 443: HTTPS
# 5432: PostgreSQL (private network only)
# 6379: Redis (private network only)
# 7700: Meilisearch (private network only)
# 25: SMTP (outbound only)

# Deny by default
ufw default deny incoming
ufw default allow outgoing
ufw allow 443/tcp
ufw allow 80/tcp    # Redirect to 443
```

#### DDoS Protection
- Cloudflare or AWS Shield
- Rate limiting at edge
- WAF (Web Application Firewall) rules
- Bot detection and challenge

#### VPN/Private Network
- VPN for admin access
- Private subnet for databases
- Bastion host for SSH access
- No direct internet access for databases

### Data Protection

#### At-Rest Encryption
- PostgreSQL with pgcrypto:
  ```sql
  CREATE EXTENSION pgcrypto;
  UPDATE users SET password_hash = crypt(password_hash, gen_salt('bf'));
  ```
- Disk-level encryption (LUKS for Linux)
- Key management (Key Vault or HSM)

#### In-Transit Encryption
- All traffic over HTTPS
- TLS 1.2+
- Perfect Forward Secrecy (PFS)

#### Backup Encryption
```bash
# Backup with encryption
pg_dump b2b_sourcing | gzip | openssl enc -aes-256-cbc -out backup.sql.gz.enc

# Store backups
# - AWS S3 with encryption
# - GCS with encryption
# - Separate location from production
```

#### Data Retention
- Payment records: 7 years (PCI-DSS)
- Audit logs: 1-2 years (compliance)
- User data: Until deletion requested (GDPR)
- Temporary tokens: Auto-purge after expiry

### Monitoring & Incident Response

#### Security Monitoring
```bash
# Monitor suspicious activity
- Failed login attempts (>5/hour)
- Rate limit exceeded events
- Admin action logs
- Unusual API access patterns
- Large data exports
```

#### Alerting
```bash
# Integrate with monitoring system
- Sentry for error tracking
- Datadog for metrics
- PagerDuty for on-call

# Alert on:
- Authentication failures
- Unauthorized access attempts
- Rate limit exceeded
- Cryptographic errors
- Config changes
```

#### Incident Response Plan
1. **Detection:** Automated alerts via Sentry/Datadog
2. **Investigation:** Review audit logs, security events
3. **Containment:** Rotate compromised credentials
4. **Eradication:** Fix vulnerability
5. **Recovery:** Deploy patched code
6. **Post-Incident:** Root cause analysis

---

## 🔐 Compliance Frameworks

### GDPR (General Data Protection Regulation)
- **Right to Access:** User data export endpoint (TODO)
- **Right to Deletion:** Account deletion with cascade (TODO)
- **Right to Rectification:** Profile update endpoint ✅
- **Data Minimization:** Collect only necessary data ✅
- **Purpose Limitation:** Clear data usage policy
- **Consent:** Opt-in for email notifications (TODO)

### CCPA (California Consumer Privacy Act)
- **Right to Know:** Data disclosure (similar to GDPR)
- **Right to Delete:** Deletion requests
- **Right to Opt-Out:** Do Not Sell My Personal Info
- **Non-Discrimination:** Service equality for opted-out users

### PCI DSS (Payment Card Industry)
- **Requirement 1:** Firewall configuration ✅
- **Requirement 2:** Strong cryptography ✅
- **Requirement 3:** Data retention policy (TODO)
- **Requirement 4:** Data encryption ⚠️
- **Requirement 6:** Application security ✅
- **Requirement 8:** Authentication ✅
- **Requirement 10:** Logging & monitoring ✅

### HIPAA (Health Insurance Portability)
- **Not applicable:** No health data processing
- **Note:** If handling US healthcare data, implement

---

## Testing & Validation

### Security Testing Checklist
- [ ] OWASP Top 10 assessment
- [ ] Penetration testing (external firm)
- [ ] Dependency vulnerability scan
- [ ] Static code analysis (bandit/CodeQL)
- [ ] SQL injection testing
- [ ] XSS testing
- [ ] CSRF testing
- [ ] Authentication testing
- [ ] Authorization testing
- [ ] Rate limit enforcement
- [ ] Encryption validation
- [ ] Sensitive data masking

### Automated Tests
```bash
# Run security tests
pytest tests/security/

# Coverage report
pytest --cov=. --cov-report=html

# Dependency audit
pip install pip-audit
pip-audit
```

---

## 🚨 Incident Response Template

**When a security issue is discovered:**

1. **Do NOT:**
   - Commit the vulnerability to git
   - Discuss publicly (responsible disclosure)
   - Ignore or delay

2. **Do:**
   - Create private issue (GitHub private)
   - Notify security@b2bsourcing.local
   - Patch in separate branch
   - Deploy to staging immediately
   - Write test to prevent regression
   - Document incident

3. **Timeline:**
   - P1 (Critical): Fix within 24 hours
   - P2 (High): Fix within 1 week
   - P3 (Medium): Fix within 2 weeks
   - P4 (Low): Include in next release

---

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Security Headers](https://securityheaders.com)
- [SSL Labs](https://www.ssllabs.com)

---

## Security Contacts

- **Security Issues:** security@b2bsourcing.local
- **Responsible Disclosure:** [SECURITY.txt](/.well-known/security.txt)
- **Emergency:** +1-XXX-XXX-XXXX

---

**Last Updated:** 2024-06-29
**Review Cycle:** Quarterly
**Next Review:** 2024-09-29
