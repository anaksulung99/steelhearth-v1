# Steelhearth VPS Deployment

This deployment runs only the API and worker in Docker. PostgreSQL, Redis, BullMQ data, and Nginx stay on the VPS host.

## Services To Run

- `api`: Fastify API, WebSocket endpoint, license activation, campaign/session APIs.
- `worker`: BullMQ worker and Playwright browser executor.

The desktop app connects to the public Nginx URL that proxies to the API.

## First Setup

1. Copy env template:

```bash
cp .env.production.example .env.production
```

2. Edit `.env.production`.

Use `host.docker.internal` when PostgreSQL and Redis are installed directly on the VPS host:

```env
DATABASE_URL=postgresql://postgres:password@host.docker.internal:5432/traffic_boost
REDIS_HOST=host.docker.internal
REDIS_PORT=6379
```

3. Build images:

```bash
docker compose -f docker-compose.prod.yml build
```

4. Run database migrations:

```bash
docker compose -f docker-compose.prod.yml --profile tools run --rm migrate
```

5. Start services:

```bash
docker compose -f docker-compose.prod.yml up -d
```

6. Check logs:

```bash
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f worker
```

## Nginx

Nginx is installed on the VPS host, outside Docker. Proxy to the API container bound on `127.0.0.1:3741`.

```nginx
server {
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3741;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /ws {
        proxy_pass http://127.0.0.1:3741/ws;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600;
    }
}
```

Desktop API URL should point to the Nginx URL, for example:

```text
https://api.example.com
```

## Operational Notes

- Keep `api` and `worker` on the same Redis DB.
- Worker needs Playwright system dependencies and browsers; `Dockerfile.worker` uses Microsoft Playwright image with browsers included.
- Increase `MAX_CONCURRENT` carefully. Each browser session consumes CPU/RAM.
- Bind API only to localhost in compose (`127.0.0.1:3741:3741`) and expose it through Nginx.
