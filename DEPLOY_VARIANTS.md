# Deployment Variants

## Version 1: Server Deployment For Team

Use Docker on VPS for:

- API
- Worker
- Prisma migration/seed helper

Use existing VPS services for:

- PostgreSQL
- Redis/BullMQ
- Nginx reverse proxy

Files:

- `Dockerfile.api`
- `Dockerfile.worker`
- `Dockerfile.migrate`
- `docker-compose.prod.yml`
- `.env.production.example`
- `DEPLOY.md`

Desktop app API URL:

```text
https://api.your-domain.com
```

## Version 2: Local Production Runtime For Personal PC

Use released desktop app installed on PC.

Run API and Worker locally from compiled production `dist`:

- `scripts/local-prod-build.ps1`
- `scripts/local-prod-start.ps1`
- `scripts/local-prod-stop.ps1`
- `.env.local.production.example`
- `LOCAL_PROD.md`

Desktop app API URL:

```text
http://127.0.0.1:3741
```
