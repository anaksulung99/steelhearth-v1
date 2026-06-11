# Local Production Runtime

This mode is for a personal PC:

- The released desktop app stays installed on the PC.
- API and Worker run locally from compiled `dist` output.
- PostgreSQL and Redis can be local on the PC or remote on your VPS.

## First Setup

Copy env:

```powershell
Copy-Item .env.local.production.example .env.local.production
```

Edit `.env.local.production`:

```env
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/traffic_boost
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
API_URL=http://127.0.0.1:3741
```

If PostgreSQL/Redis stay on VPS, use the VPS host/IP instead.

## Build Dist

Run once after code changes:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-prod-build.ps1 -InstallDependencies -InstallPlaywrightBrowsers -Migrate -Seed
```

For later rebuilds:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-prod-build.ps1
```

## Start Local API + Worker

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-prod-start.ps1
```

This opens two PowerShell windows:

- API: `node apps/api/dist/server.js`
- Worker: `node apps/worker/dist/index.js`

Logs:

```text
logs/api-local-prod.log
logs/worker-local-prod.log
```

Use this API URL in the released desktop app:

```text
http://127.0.0.1:3741
```

## Stop Local Runtime

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-prod-stop.ps1
```

## Reset Local License Device Binding

If login fails with `License already activated on another device`, reset the local/dev license binding:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-prod-reset-license.ps1
```

Or specify explicit values:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/local-prod-reset-license.ps1 -Email admin@example.com
powershell -ExecutionPolicy Bypass -File scripts/local-prod-reset-license.ps1 -LicenseKey ST-LOCAL-CHANGE-THIS-LICENSE
```

## Notes

- This is not dev mode. It runs compiled production `dist`.
- Keep PostgreSQL and Redis running before starting API/Worker.
- If license validation uses local API, create/seed the owner license in this local database.
