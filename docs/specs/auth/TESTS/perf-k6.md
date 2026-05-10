# Performance (k6)

- Smoke: `/auth/login`, `/auth/refresh`, `/auth/password/forgot`, `/auth/password/reset`.
- Goals: p95 login < 900ms (excl. email latency), refresh < 200ms. Error rate < 1% under normal load.
- Scenarios include ramp-up and sustained loads; record 429 rates to verify throttling.
