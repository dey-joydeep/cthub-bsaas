# Zero-Cost Deployment (Reference)

**Goal:** run the full auth stack without paid services.

## 1) Docker Compose (dev)
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

  mailpit:
    image: axllent/mailpit:latest
    ports: ["8025:8025", "1025:1025"]  # UI http://localhost:8025 ; SMTP localhost:1025

volumes:
  pgdata:
```

Set `SMTP_HOST=localhost`, `SMTP_PORT=1025` for dev so all emails land in Mailpit.

## 2) Docker Compose (prod, minimal)
```yaml
version: "3.8"
services:
  postgres:
    image: postgres:16
    restart: always
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes: ["pgdata:/var/lib/postgresql/data"]

  redis:
    image: redis:7-alpine
    restart: always

  postfix:
    image: boky/postfix
    restart: always
    environment:
      ALLOWED_SENDER_DOMAINS: ${MAIL_DOMAIN}
    # Expose 25 only if you control rDNS and firewall.

  caddy:
    image: caddy:2
    restart: always
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile
      - caddy_data:/data
      - caddy_config:/config
volumes:
  pgdata:
  caddy_data:
  caddy_config:
```

**TLS:** Caddy obtains free Let's Encrypt certs automatically. If you prefer Nginx, pair it with `certbot` (also free).

> **Email deliverability:** set **SPF, DKIM, DMARC** in DNS and ensure reverse DNS matches your host.

## 3) Env Vars (example)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/postgres
REDIS_URL=redis://localhost:6379

# SMTP for dev (Mailpit)
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_SECURE=false

# SMTP for prod (Postfix)
SMTP_HOST=postfix
SMTP_PORT=25
SMTP_SECURE=false
SMTP_FROM=noreply@your-domain.tld
```
