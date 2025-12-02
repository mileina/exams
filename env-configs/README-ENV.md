# Environment Variables - Setup Guide

## 📁 Files Organization

All `.env` files should be organized in the `env-configs/` folder for easier management:

```
env-configs/
├── .env.preprod.backend
├── .env.preprod.frontend
├── .env.preprod.notifications
├── .env.preprod.stock-management
├── .env.preprod.gateway
├── .env.prod.backend
├── .env.prod.frontend
├── .env.prod.notifications
├── .env.prod.stock-management
└── .env.prod.gateway
```

---

## 🔒 Security Best Practices

### 1. Never Commit Secrets
- Add `.env` to `.gitignore` (should already be there)
- Only commit `.env.example` files with dummy values
- Real `.env` files should ONLY exist on servers

### 2. Generate Strong Secrets
```bash
# Generate JWT Secret (64 chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate MongoDB Password (32 chars)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate API Key
openssl rand -hex 32
```

### 3. Environment-specific Configuration

**PREPRODUCTION (.env.preprod.*)**
- Debug logs enabled
- Localhost URLs
- Test credentials
- Less strict rate limiting

**PRODUCTION (.env.prod.*)**
- Debug logs disabled
- Internal network URLs (Docker network)
- Strong random credentials
- Strict rate limiting
- Monitoring enabled

---

## 🚀 Deployment Steps

### Step 1: Generate Secrets
```bash
# Generate all required secrets
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
MONGO_PASSWORD=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")
API_KEY=$(openssl rand -hex 32)

echo "JWT_SECRET: $JWT_SECRET"
echo "MONGO_PASSWORD: $MONGO_PASSWORD"
echo "API_KEY: $API_KEY"
```

### Step 2: Update Environment Files
Edit `env-configs/.env.prod.*` files with your actual values:
- Replace `yourdomain.com` with your domain
- Replace password placeholders with generated secrets
- Update email credentials

### Step 3: Copy to Servers
```bash
# For preproduction server
scp env-configs/.env.preprod.* user@preprod-server:/path/to/app/

# For production server
scp env-configs/.env.prod.* user@prod-server:/path/to/app/
```

### Step 4: Rename on Server
```bash
cd /path/to/app

# Backend
cp env-configs/.env.prod.backend .env

# Frontend
cp env-configs/.env.prod.frontend .env

# etc.
```

### Step 5: Verify Permissions
```bash
# .env files should only be readable by app user
chmod 600 .env
chown appuser:appgroup .env
```

---

## 🔐 Sensitive Values to Update

### Backend
- [ ] `JWT_SECRET` - Generate strong random
- [ ] `MONGO_ROOT_PASSWORD` - Generate strong random
- [ ] `CORS_ORIGIN` - Set to your domain
- [ ] Email credentials
- [ ] Database credentials

### Frontend
- [ ] `REACT_APP_API_URL` - Set to your API domain

### Notifications
- [ ] Email credentials
- [ ] Rate limiting values

### All Services
- [ ] `NODE_ENV` - Should be 'production' in prod
- [ ] `LOG_LEVEL` - Should be 'info' in prod
- [ ] API keys and tokens

---

## ✅ Pre-deployment Checklist

- [ ] All `.env.example` files created
- [ ] All environment-specific files created
- [ ] Secrets generated and stored securely
- [ ] `.env` files added to `.gitignore`
- [ ] `.env.example` files in Git (without secrets)
- [ ] Permissions set correctly (600)
- [ ] Values tested in staging first
- [ ] Monitoring and logging configured

---

## 🚨 Emergency: If Secrets Are Compromised

1. **Immediately** generate new secrets
2. Rotate all credentials (JWT, DB password, API keys)
3. Update docker-compose files
4. Redeploy all services
5. Review logs for suspicious activity
6. Update `.env.prod.*` files with new values
