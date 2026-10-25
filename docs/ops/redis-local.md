# Redis Local Setup (Dev/Test)

Use Redis to back ephemeral WebAuthn challenges with TTL and atomic consume.

## Option A — Docker (recommended)

- Start Redis 8.2 (alpine image):
  - `docker run -d --name redis -p 6379:6379 redis:8.2-alpine`
- Verify:
  - `docker exec -it redis redis-cli ping` → `PONG`
  - `docker logs redis --tail 20` (optional)
- Common operations:
  - Stop/Start: `docker stop redis`; `docker start redis`
  - Remove: `docker rm -f redis`
  - Persistent data (optional): `docker run -d --name redis -p 6379:6379 -v redis_data:/data redis:8.2-alpine`

## Option B — WSL Ubuntu

- Install: `sudo apt update && sudo apt install -y redis`
- Start: `sudo service redis-server start`
- Verify: `redis-cli ping` → `PONG`

## Configuration

- Set in `.env` (dev/test):
  - `REDIS_URL=redis://localhost:6379/0`
- The backend’s WebAuthn adapter uses this URL via `ioredis`.

## Why Redis for challenges?

- TTL out of the box (no cleanup jobs)
- Atomic single-use (`GETDEL` or Lua fallback)
- Low latency, minimal ops overhead

## Troubleshooting

- `docker: ... cannot find the file specified`
  - Start Docker Desktop and retry. Verify with `docker info`.
- Port 6379 busy
  - Use another host port: `-p 6380:6379` and set `REDIS_URL=redis://localhost:6380/0`
- Timeouts / network
  - Local Docker avoids most corporate proxy issues.
