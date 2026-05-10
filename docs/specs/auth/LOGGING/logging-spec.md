# Logging & Audit — Separation of Concerns

## 1) Access Log (HTTP)
- **Purpose:** request/response telemetry (method, path, status, ms). No business details.
- **Transport:** `pino-http` (Nest adapter) → separate file/stream `logs/access.log` (JSON lines).
- **Fields:** ts, correlationId, reqId, method, path, status, durationMs, ip (coarse), ua.
- **Rotation:** daily with compression; retain 7–14 days (infra-level).

## 2) Application Log
- **Purpose:** app lifecycle, warnings/errors, infra adapters; **no PII**.
- **Transport:** `pino` (base logger) → `logs/app.log` (JSON lines). Levels: info/warn/error/fatal; child loggers per module.
- **Redaction:** emails, tokens, codes; use pino redaction rules.

## 3) Audit Log (Security Events)
- **Purpose:** security-relevant events (login, logout, refresh, 2FA verify, passkey register, password reset, session revoke).
- **Sink:** append-only stream (file or DB table). Retention 400 days; per-tenant export.
- **Fields:** userId/anon, tenantId, action, result, reason, ip, ua, deviceId, correlationId, ts.

## 4) Correlation IDs
- Use a request-scoped interceptor to assign `correlationId` (UUID v4) to all logs; echo in errors and responses.

## 5) Folder Paths (runtime)
```
/var/app/
  logs/
    access.log
    app.log
    audit.log   (optional: separate store or stream to DB/SIEM)
```
## 6) External collectors (optional)
Use only if you later add budget. For now, keep logs local. If needed, self-host **OpenSearch/ELK** (OSS) and ship logs via `pino-multi-stream`.

