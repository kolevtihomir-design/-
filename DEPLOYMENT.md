# B2B Sourcing OS - Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Python 3.12+
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/kolevtihomir-design/b2b-sourcing-os.git
cd b2b-sourcing-os

# Copy environment file
cp .env.example .env

# Start all services
docker-compose up -d

# Wait for containers to be healthy
docker-compose ps

# Run database migrations
docker-compose exec api alembic upgrade head  # If using Alembic
# Or import SQL migrations manually
docker-compose exec postgres psql -U b2b_user -d b2b_sourcing < migrations/001_initial_schema.sql
docker-compose exec postgres psql -U b2b_user -d b2b_sourcing < migrations/002_team_collaboration.sql
docker-compose exec postgres psql -U b2b_user -d b2b_sourcing < migrations/003_supplier_portal.sql

# Verify API is working
curl http://localhost:8000/health
# Expected: {"status": "ok", "version": "1.0.0"}

# Access services
# API Docs: http://localhost:8000/docs
# Meilisearch: http://localhost:7700
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

---

## Production Deployment

### Option 1: Kubernetes (Recommended)

#### Prerequisites
- kubectl configured
- Helm 3+
- Kubernetes 1.20+
- Storage class available
- Ingress controller (nginx, Traefik)

#### Deployment Steps

```bash
# 1. Create namespace
kubectl create namespace b2b-sourcing

# 2. Create secrets
kubectl create secret generic database-credentials \
  --from-literal=username=b2b_user \
  --from-literal=password=$(openssl rand -base64 32) \
  -n b2b-sourcing

kubectl create secret generic api-secrets \
  --from-literal=secret-key=$(openssl rand -base64 64) \
  --from-literal=stripe-key=sk_live_... \
  -n b2b-sourcing

# 3. Deploy using Helm (recommended)
helm repo add b2b-sourcing https://charts.b2bsourcing.local
helm repo update
helm install b2b-sourcing b2b-sourcing/b2b-sourcing \
  --namespace b2b-sourcing \
  --values values.yaml

# OR deploy using kubectl
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/meilisearch-deployment.yaml
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/api-deployment.yaml
kubectl apply -f k8s/celery-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# 4. Verify deployment
kubectl get pods -n b2b-sourcing
kubectl logs -n b2b-sourcing deployment/api-deployment
```

#### Scaling Configuration
```yaml
# k8s/api-deployment.yaml
spec:
  replicas: 3  # Start with 3 replicas
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  
  template:
    spec:
      containers:
      - name: api
        resources:
          requests:
            cpu: "500m"
            memory: "512Mi"
          limits:
            cpu: "2000m"
            memory: "2Gi"
      
      # Auto-scaling
      autoscaling:
        minReplicas: 3
        maxReplicas: 10
        targetCPUUtilizationPercentage: 70
```

#### Persistent Storage
```yaml
# PostgreSQL PersistentVolume
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 100Gi

# Redis PersistentVolume
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
spec:
  accessModes:
    - ReadWriteOnce
  storageClassName: fast-ssd
  resources:
    requests:
      storage: 50Gi
```

#### Certificate Management
```bash
# Install cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer for Let's Encrypt
kubectl apply -f k8s/cert-issuer.yaml

# Ingress will auto-provision HTTPS certificate
```

---

### Option 2: Docker Swarm

#### Prerequisites
- Docker Engine with Swarm mode
- 3+ manager nodes (for HA)
- 1+ worker nodes

#### Setup
```bash
# Initialize swarm
docker swarm init --advertise-addr <MANAGER-IP>

# Add worker nodes
docker swarm join --token <TOKEN> <MANAGER-IP>:2377

# Create overlay network
docker network create -d overlay b2b-network

# Deploy stack
docker stack deploy -c docker-compose.prod.yml b2b-sourcing

# Monitor services
docker stack services b2b-sourcing
docker service logs b2b-sourcing_api
```

---

### Option 3: VPS / EC2 / DigitalOcean

#### Prerequisites
- Ubuntu 22.04 LTS
- 4+ CPU cores
- 8+ GB RAM
- 100+ GB storage
- Domain name with DNS configured

#### Setup Script
```bash
#!/bin/bash
set -e

# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install nginx (reverse proxy)
sudo apt-get install -y nginx

# Configure nginx
sudo tee /etc/nginx/sites-available/b2bsourcing.conf > /dev/null <<EOF
upstream api {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name b2bsourcing.local;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name b2bsourcing.local;
    
    ssl_certificate /etc/letsencrypt/live/b2bsourcing.local/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/b2bsourcing.local/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    location / {
        proxy_pass http://api;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/b2bsourcing.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx

# Setup Let's Encrypt
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d b2bsourcing.local

# Clone and setup application
cd /opt
sudo git clone https://github.com/kolevtihomir-design/b2b-sourcing-os.git
cd b2b-sourcing-os

# Configure environment
sudo cp .env.example .env
sudo nano .env  # Edit with actual values

# Start services
sudo docker-compose -f docker-compose.prod.yml up -d

# Setup monitoring
# (Install and configure Sentry, DataDog, or similar)

echo "✅ Deployment complete!"
echo "🌐 Access API at: https://b2bsourcing.local"
echo "📊 API Docs at: https://b2bsourcing.local/docs"
```

#### Auto-Renewal of SSL Certificates
```bash
# Create cron job for renewal
sudo crontab -e

# Add line:
# 0 2 * * * certbot renew --quiet --post-hook "systemctl restart nginx"
```

---

## Environment Configuration

### Development
```env
DATABASE_URL=postgresql://b2b_user:password@localhost:5432/b2b_sourcing
DEBUG=true
SECRET_KEY=dev-secret-key-change-in-production
HTTPS_REDIRECT=false
```

### Staging
```env
DATABASE_URL=postgresql://b2b_user:$(openssl rand -base64 32)@postgres-staging:5432/b2b_sourcing
DEBUG=false
SECRET_KEY=$(openssl rand -base64 64)
HTTPS_REDIRECT=true
STRIPE_SECRET_KEY=sk_test_...
SENTRY_DSN=https://...
```

### Production
```env
DATABASE_URL=postgresql://b2b_user:$(openssl rand -base64 32)@postgres.private:5432/b2b_sourcing
DEBUG=false
SECRET_KEY=$(openssl rand -base64 64)
HTTPS_REDIRECT=true
STRIPE_SECRET_KEY=sk_live_...
SENTRY_DSN=https://...
CELERY_BROKER_URL=redis://:password@redis.private:6379
CELERY_RESULT_BACKEND=redis://:password@redis.private:6379
```

---

## Database Management

### Backup Strategy
```bash
# Daily backup to S3
AWS_ACCESS_KEY_ID=... AWS_SECRET_ACCESS_KEY=... \
pg_dump b2b_sourcing | gzip | \
aws s3 cp - s3://b2b-backups/$(date +%Y%m%d).sql.gz

# Weekly backup to separate region
# (Use S3 cross-region replication)

# Test restore monthly
# aws s3 cp s3://b2b-backups/YYYYMMDD.sql.gz - | gunzip | psql
```

### Migration Procedure
```bash
# 1. Backup current database
./backup.sh

# 2. Run migrations
docker-compose exec api alembic upgrade head

# OR manually:
docker-compose exec postgres psql -U b2b_user -d b2b_sourcing < migrations/new_migration.sql

# 3. Verify data integrity
psql -d b2b_sourcing -c "SELECT COUNT(*) FROM products;"

# 4. Run tests
pytest tests/

# 5. Monitor for errors
tail -f logs/api.log
```

---

## Monitoring & Logging

### Observability Stack
```bash
# Option 1: ELK Stack
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.0.0
docker pull docker.elastic.co/kibana/kibana:8.0.0
docker pull docker.elastic.co/beats/filebeat:8.0.0

# Option 2: Datadog
# Install Datadog agent
# Configure APM and logging

# Option 3: New Relic
# Install Python agent
pip install newrelic
```

### Health Checks
```bash
# API health
curl -s http://localhost:8000/health | jq .

# Database connectivity
docker-compose exec postgres pg_isready

# Redis connectivity
docker-compose exec redis redis-cli ping

# Celery tasks
celery -A tasks.celery_app inspect active

# Meilisearch index
curl http://localhost:7700/health
```

### Log Aggregation
```bash
# View logs
docker-compose logs -f api
docker-compose logs -f celery_worker
docker-compose logs postgres

# Send to external service
# Configure Docker logging driver to send to Sentry, DataDog, etc.
```

---

## Rollback Procedure

### Code Rollback
```bash
# 1. Identify last good commit
git log --oneline | head -5

# 2. Create rollback commit
git revert <COMMIT-HASH>
git push origin main

# 3. Redeploy
docker-compose down
git pull
docker-compose up -d

# 4. Verify
curl http://localhost:8000/health
```

### Database Rollback
```bash
# 1. Restore from backup
# Stop application
docker-compose down

# 2. Restore database
# aws s3 cp s3://b2b-backups/YYYYMMDD.sql.gz - | gunzip | psql

# 3. Restart services
docker-compose up -d

# 4. Verify data integrity
# Run consistency checks
```

---

## Performance Tuning

### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_negotiation_deals_buyer_date ON negotiation_deals(buyer_id, created_at DESC);
CREATE INDEX idx_price_signals_product_date ON price_signals(product_id, timestamp DESC);

-- Analyze query plans
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 1;

-- Vacuum and analyze
VACUUM ANALYZE;
```

### API Performance
```python
# Add caching headers
@app.get("/api/products")
async def get_products():
    return {
        "headers": {
            "Cache-Control": "public, max-age=300",  # 5 minutes
            "ETag": "hash-of-content"
        }
    }

# Use connection pooling
SQLALCHEMY_POOL_SIZE = 20
SQLALCHEMY_POOL_RECYCLE = 3600
```

### Redis Optimization
```bash
# Monitor Redis memory
redis-cli INFO memory

# Set max memory policy
redis-cli CONFIG SET maxmemory-policy allkeys-lru

# Monitor slow commands
redis-cli --stat
redis-cli SLOWLOG GET 10
```

---

## Disaster Recovery Plan

### RPO (Recovery Point Objective)
- **Target:** 1 hour (hourly backups)
- **Current:** 24 hours (daily backups via cron)
- **Improvement:** Implement point-in-time recovery (TODO)

### RTO (Recovery Time Objective)
- **Target:** 4 hours
- **Current:** ~2 hours (database restore + app restart)
- **Improvement:** Hot standby / replication (TODO)

### Recovery Procedures

**Scenario 1: Database Corruption**
```
1. Detect: SELECT pg_dump ... | pg_restore --single-transaction --exit-on-error
2. Isolate: Stop application, keep backup safe
3. Restore: Restore from latest clean backup
4. Verify: Run integrity checks
5. Resume: Restart application
```

**Scenario 2: Data Center Outage**
```
1. Failover to secondary region
2. Update DNS (or use Cloudflare failover)
3. Verify application connectivity
4. Monitor for 24 hours
```

**Scenario 3: Ransomware/Data Loss**
```
1. Isolate affected systems immediately
2. Restore from immutable backup (separate region)
3. Quarantine for forensic analysis
4. Resume operations from backup
5. Notify users if applicable
```

---

## Monitoring Checklist

- [ ] Application health (CPU, memory, uptime)
- [ ] Database performance (query time, connections)
- [ ] API response times (p50, p95, p99)
- [ ] Error rates and exceptions
- [ ] Authentication failures
- [ ] Rate limit hits
- [ ] Celery task queue depth
- [ ] Redis memory usage
- [ ] Disk space usage
- [ ] SSL certificate expiry (30-day warning)
- [ ] Backup completion status
- [ ] Security events (audit log anomalies)

---

## Updating & Maintenance

### Zero-Downtime Updates

```bash
# 1. Deploy to blue environment (parallel instance)
docker-compose -p b2b-blue up -d

# 2. Run migrations
docker-compose -p b2b-blue exec api alembic upgrade head

# 3. Run smoke tests
pytest tests/smoke/

# 4. Switch traffic (via nginx)
# Update upstream to point to new version

# 5. Monitor for errors
tail -f logs/api.log

# 6. Keep green environment running for quick rollback
# (Can revert by switching nginx back)
```

### Dependency Updates
```bash
# Check for outdated packages
pip list --outdated

# Update with care
pip install --upgrade fastapi uvicorn sqlalchemy

# Test thoroughly
pytest tests/

# Review security advisories
pip install safety
safety check
```

---

## Support & Troubleshooting

### Common Issues

**API not starting**
```bash
docker-compose logs api
# Check DATABASE_URL, REDIS_URL in .env
# Check database is running: docker-compose ps postgres
```

**Database connection timeout**
```bash
# Increase pool size
SQLALCHEMY_POOL_SIZE=30

# Check PostgreSQL is listening
netstat -tulpn | grep 5432

# Verify credentials
psql -U b2b_user -h localhost -d b2b_sourcing
```

**High API latency**
```bash
# Check query performance
EXPLAIN ANALYZE SELECT ... FROM products;

# Monitor Celery queue depth
celery -A tasks.celery_app inspect active_queues

# Check Redis memory
redis-cli INFO memory
```

### Getting Help
- **Documentation:** See README.md, IMPLEMENTATION.md
- **Issues:** GitHub Issues (private repository)
- **Security:** security@b2bsourcing.local
- **Emergency:** PagerDuty on-call

---

**Last Updated:** 2024-06-29
**Next Review:** 2024-09-29
