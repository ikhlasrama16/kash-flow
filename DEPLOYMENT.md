# Mikra Finance Web — Deployment Guide

This document outlines the deployment architecture and steps for hosting **Mikra Finance Web** on Tencent Cloud Lighthouse (2 vCPU, 2 GB RAM) under the domain:

`https://finance.mikra.my.id`

---

## 1. Architectural Overview

The server hosts:
- **Reverse Proxy**: Caddy (automatic Let's Encrypt HTTPS)
- **Frontend**: Next.js App Router (Node.js standalone / PM2 or Docker on port 3000)
- **Backend**: Go REST API (compiled binary / Docker on port 8080)
- **Database**: PostgreSQL 16 (port 5432)

```text
Internet (HTTPS 443 / HTTP 80)
           │
           ▼
     Caddy Reverse Proxy
           │
           ├── https://finance.mikra.my.id/api/v1/*  ──► Go API (:8080)
           │                                                │
           │                                                ▼
           │                                            PostgreSQL (:5432)
           │
           └── https://finance.mikra.my.id/*         ──► Next.js (:3000)
```

---

## 2. Resource Optimization for 2 GB RAM

Because the Lighthouse server has 2 GB RAM, run Next.js with the standalone output and PM2 or Docker with memory limits.

### Option A: PM2 + Node.js Standalone (Recommended for Low RAM)

1. **Build on server (or transfer `.next/standalone`):**
   ```bash
   cd web
   npm install --production=false
   npm run build
   ```

2. **Environment configuration (`web/.env.local`):**
   ```env
   INTERNAL_API_URL=http://127.0.0.1:8080
   AUTH_SECRET=your-32-character-secret-key-here!
   ADMIN_PASSWORD=your-strong-web-login-password
   INGEST_API_KEY=your-backend-ingest-api-key
   NODE_ENV=production
   PORT=3000
   ```

3. **Run with PM2:**
   ```bash
   npm install -g pm2
   pm2 start npm --name "finance-web" --max-memory-restart 350M -- start
   pm2 save
   pm2 startup
   ```

---

## 3. Caddy Reverse Proxy Configuration

Update `/etc/caddy/Caddyfile` (or `backend/Caddyfile`):

```caddy
finance.mikra.my.id {
    encode gzip zstd

    # Direct API endpoints routed to Go
    handle /api/v1/* {
        reverse_proxy 127.0.0.1:8080
    }
    handle /api/health {
        reverse_proxy 127.0.0.1:8080
    }
    handle /api/ready {
        reverse_proxy 127.0.0.1:8080
    }

    # Next.js Web Frontend & its internal routes (/api/auth/*, /api/backend/*)
    handle {
        reverse_proxy 127.0.0.1:3000
    }
}
```

Reload Caddy:
```bash
caddy reload --config /etc/caddy/Caddyfile
```

---

## 4. Verification Checklist

1. **Go Backend Liveness**:
   ```bash
   curl -I https://finance.mikra.my.id/api/v1/health
   # HTTP/2 200 {"status":"ok"}
   ```

2. **Database Readiness**:
   ```bash
   curl -I https://finance.mikra.my.id/api/v1/ready
   # HTTP/2 200 {"status":"ready"}
   ```

3. **Web Frontend**:
   Navigate to `https://finance.mikra.my.id`:
   - Redirects to `/login` if unauthenticated.
   - Enter `ADMIN_PASSWORD` to log in.
   - Access Dashboard, Transactions, Accounts, Categories, Analytics, and Notifications.
