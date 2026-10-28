# Manager-Capability Auth Contract Follow-Up

**Date:** 2026-06-30  
**Related PR:** [#44 feat: add salon owner settings screens](https://github.com/dey-joydeep/cthub-bsaas/pull/44)  
**Related review thread:** [Gate branch settings to manager-capable staff](https://github.com/dey-joydeep/cthub-bsaas/pull/44#discussion_r3487973670)  
<<<<<<< HEAD
**Status:** Implemented on branch `feature/manager-capability-auth-contract` (ready for PR review)
=======
**Status:** Follow-up design and implementation task  
>>>>>>> origin/feature/web-salon-owner-settings

## Purpose

This note separates the manager-capability route/auth issue from the normal PR `#44` review-fix cycle.

Use this document when starting a separate thread or branch task for the manager-capability contract work.

Do not treat this as another routine "`@codex fix applied` and continue" review item inside the main PR cycle unless the auth contract question has already been resolved.

## Why This Is Separate From PR #44

The backend rule already exists:

- `STAFF` may access branch settings only when their active branch assignment position is `branch manager` or `manager`
- that restriction is implemented in `libs/server/features/salon-owner/src/lib/services/salon-owner-settings.service.ts`

The unresolved gap is on the frontend/auth contract side:

- `apps/web/partner/src/app/app.routes.ts` currently allows broad `STAFF` access to `/owner/branches`
- the frontend auth/current-user shape does not expose manager capability, branch assignments, or managed branch ids
- `libs/web/partner/src/lib/features/auth/services/auth.service.ts` still returns only `{ id }` from `getCurrentUser()`, which is too narrow even for richer future route checks

Because of that, a true route/menu gate cannot be implemented cleanly in PR `#44` without expanding scope into auth-contract work.

## Current PR #44 State

PR `#44` already contains a partial mitigation:

- non-manager staff now hit a dedicated forbidden UX state instead of only falling through to generic branch-settings load failures

That is useful for user experience, but it does **not** fully resolve the review thread because:

- it does not prevent entry at route/menu level using a real capability check
- it still depends on backend denial instead of frontend knowledge of manager capability

## Decision To Make

Choose one explicit direction before changing PR `#44` again for this thread:

1. Extend the current-user/auth contract to expose manager capability directly.
2. Expose managed branch ids or manager-capable assignments in the current-user/auth contract.
3. Add a dedicated permission/capability endpoint and fetch it before allowing/showing `/owner/branches`.
4. Decide that backend-only enforcement plus forbidden UX is the intended product behavior and answer the PR thread with that rationale.

## Recommended Direction

Preferred approach:

- extend the auth/current-user contract with stable frontend-consumable authorization data
- avoid ad hoc route-time probing if the same capability will affect navigation, guards, and feature visibility

Practical options:

| Option | Pros | Cons |
| --- | --- | --- |
| `canManageBranches: boolean` | smallest FE surface | loses detail if branch-scoped decisions grow |
| `managedBranchIds: string[]` | supports route/menu plus branch-scoped UI | slightly broader auth payload |
| raw assignments | most expressive | too much auth payload for the immediate need |

Recommended default for this task:

- prefer `managedBranchIds: string[]`
- optionally derive `canManageBranches` in frontend code from `managedBranchIds.length > 0`

## Separate Branch Task

Default recommendation:

- create the follow-up branch from `feature/web-salon-owner-settings`
- keep the work stacked on top of PR `#44`
- open the follow-up PR with base `feature/web-salon-owner-settings`

This is recommended here because:

- the unresolved review thread is about behavior introduced on PR `#44`
- the current branch already contains the auth/settings/CI-related fixes needed for realistic validation
- stacking the branch avoids redoing or re-conflicting fixes that already exist on `feature/web-salon-owner-settings`
- the follow-up can land back into PR `#44` without breaking the current review flow

Use a branch from `main` only if the team explicitly wants this auth-contract change to be independently mergeable outside the PR `#44` stack.

Suggested branch names:

- `feature/manager-capability-auth-contract`
- `feature/partner-manager-capability`

Suggested goal statement:

> Design and implement the auth/current-user contract needed for the partner frontend to distinguish manager-capable staff from other staff for branch settings access.

## Expected Scope

Inspect and update only the minimal areas needed:

- backend auth/current-user contract source
- backend DTO/serializer/mapper layers if auth payload shape changes
- frontend current-user interfaces in `libs/web/core/auth`
- partner auth storage/hydration in `libs/web/partner/src/lib/features/auth`
- partner route/menu gating for `/owner/branches`
- focused tests for owner, manager-capable staff, and non-manager staff

## Suggested Workflow

This is **not** the same cycle as the main PR `#44` comment-fix loop.

Use this follow-up cycle instead:

1. Reconfirm the backend restriction and current frontend auth shape.
2. Decide the contract shape before editing code.
3. Implement the contract change end-to-end.
4. Update frontend route/menu gating to use the new capability data.
5. Add focused regression tests.
6. Run narrow validation for touched auth and partner projects.
7. Open or update the stacked follow-up PR with base `feature/web-salon-owner-settings`.
8. Return to PR `#44` and either:
   - apply the now-supported route/menu gate, or
   - reference the follow-up PR/merge in the unresolved thread.

## Recommended Validation

Run the narrowest meaningful checks for the touched scope, likely including:

- `NX_NO_CLOUD=true NX_DAEMON=false npx nx test web-core-auth --configuration=ci --skipNxCache --runInBand`
- `NX_NO_CLOUD=true NX_DAEMON=false npx nx test web-lib-partner --configuration=ci --skipNxCache --testPathPatterns=salon-owner-settings.component.spec.ts --runInBand`
- relevant backend auth or salon-owner tests if the auth payload changes on the server
- `git diff --check`

If API contracts or auth docs are updated, run the matching doc/API validation required by the touched area.

## How This Feeds Back Into PR #44

After the separate task is implemented:

- re-evaluate [discussion_r3487973670](https://github.com/dey-joydeep/cthub-bsaas/pull/44#discussion_r3487973670)
- decide whether PR `#44` should:
  - cherry-pick/rebase the route/menu capability fix, or
  - remain with the forbidden UX and close the thread by pointing to the follow-up auth-contract change

Do not claim that the original thread is fully fixed until the route/menu capability question is actually resolved.
<<<<<<< HEAD

## Implementation Summary

Implemented on branch `feature/manager-capability-auth-contract`:

1. **Shared Contract (`libs/shared`)**:
   - Added `isBranchManagerPosition()` and `hasManagerCapability()` in `libs/shared/src/lib/utils/manager-capability.util.ts`.
   - Enhanced `hasManagerCapability()` to verify the user has the `STAFF` role before allowing branch list fallback, and respect explicit `canManageBranches: false`.
   - Added `managedBranchIds?: string[]` and `canManageBranches?: boolean` to `AuthenticatedUser` in `libs/shared/src/lib/types/user.types.ts`.
   - Replaced duplicate local branch manager position check in `libs/server/features/salon-owner/src/lib/services/salon-owner-settings.service.ts` with shared utility.

2. **Backend Auth Contract Pipeline (`libs/server/contracts-auth`, `libs/server/data-access`, `libs/server/features/auth`)**:
   - Added `findManagedBranchIds(userId: string): Promise<string[]>` to `IUserRepository` port and `UserRepository` implementation. Queries `salonTenantStaff` where `isActive = true`, filtering with `isBranchManagerPosition()`.
   - In `AuthService.generateTokens()`, for staff users, queries active manager assignments and signs access tokens containing `managedBranchIds` and `canManageBranches: true`.
   - In `JwtStrategy.validate()`, propagates `managedBranchIds` and `canManageBranches` into `JwtUserContext`.

3. **Web Core Auth (`libs/web/core/auth`)**:
   - Added `roles?: readonly string[]`, `managedBranchIds?: readonly string[]`, and `canManageBranches?: boolean` to `CurrentUserMin` and `BaseAuthUser`.
   - Updated `roleGuard` to defensively extract role strings from object-formatted roles (`{ name: 'staff' }`), support `redirectUrl` configuration, and enforce `requireManagerCapability`.
   - Exported `managerCapabilityGuard` for dedicated capability checks.

4. **Web Partner & App (`libs/web/partner`, `apps/web/partner`)**:
   - Extended `PartnerAuthUser` with `managedBranchIds` and `canManageBranches`.
   - Updated `AuthService.setLoggedInUser()` and `initializeAuthState()` to decode `managedBranchIds` and `canManageBranches` from token claims when not present in input payload.
   - Gated `/owner/branches` in `apps/web/partner/src/app/app.routes.ts` with `requireManagerCapability: true` and `redirectUrl: '/unauthorized'`.
   - Added `UnauthorizedComponent` registered at `/unauthorized` to present a clean access-restricted message instead of bouncing to login.
   - Updated `apps/web/partner/src/app/app.component.ts` to use case-normalized `hasRole('admin')` for `isAdmin`, and allow `ADMIN` in `owner/settings` route data.
   - Gated Settings navigation: owners and admins route to `/settings`, manager-capable staff route to `/owner/branches`, and non-manager staff have Settings hidden.

5. **Automated Verification**:
   - All tests passing in `shared` (11/11 tests, 100% coverage).
   - All tests passing in `server-data-access` (54/54 tests, 100% coverage).
   - All tests passing in `server-feature-auth` (unit tests and jwt strategy).
   - All tests passing in `web-core-auth` (15/15 tests across 3 suites).
   - All tests passing in `web-lib-partner` (57/57 tests across 2 suites).
   - All tests passing in `web-app-partner` (8/8 tests across 2 suites).
   - All tests passing in `server-feature-salon-owner` (93/93 tests across 3 suites).
=======
>>>>>>> origin/feature/web-salon-owner-settings
