# Project Status Summary

**Updated:** 2026-05-04

This status folder is currently used for local planning and branch handoff notes. It is not a release-management dashboard.

## Active Branch Focus

Current branch:

```text
feat/auth-backend-foundation
```

Primary branch status document:

- `docs/status/auth/auth-backend-plan-and-progress-status.md`

## Auth Backend Summary

The Auth backend foundation is largely implemented against the current OpenAPI route contract.

Current source of truth:

- `docs/specs/auth/API/openapi.yaml`
- `docs/specs/auth/API/api-hld.md`
- `docs/specs/auth/API/api-lld.md`
- `docs/specs/auth/WEB/docs/auth/server-alignment.md`
- `scripts/openapi-auth-check.ts`

Current branch rules:

- Do not add legacy route aliases.
- Keep controller routes and OpenAPI in parity.
- Keep Auth UT and IT coverage at 100%.
- Keep lint/build green.
- Keep docs aligned with implementation whenever Auth behavior changes.

## Known Remaining Backend Auth Work

1. Wire OpenAPI route parity into CI.
2. Add or confirm CI coverage enforcement for backend feature libraries.
3. Decide whether additional server import-boundary hardening belongs in this branch or the infra-upgrade workstream.

## Related Planning

Infrastructure modernization planning lives under:

- `docs/infra-upgrade/20260501/`

That workstream is separate from this Auth backend branch.
