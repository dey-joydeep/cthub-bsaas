# Salon Owner Permissions Matrix

**Date:** 2026-05-11
**Status:** Implementation baseline

## Purpose

Define role permissions and scope rules for Salon Owner MVP implementation.

## Scope Levels

| Scope          | Meaning                                                   |
| -------------- | --------------------------------------------------------- |
| Tenant         | All salon businesses owned or administered by the tenant. |
| Salon Business | One salon business/legal operating brand.                 |
| Branch         | One physical branch.                                      |
| Own Record     | The signed-in staff member's own profile/schedule.        |

## Roles

| Role              | Scope                  | Description                                      |
| ----------------- | ---------------------- | ------------------------------------------------ |
| Owner             | Tenant/Salon Business  | Full business control within owned businesses.   |
| Branch Manager    | Branch                 | Operational control for assigned branch.         |
| Front Desk        | Branch                 | Booking, walk-in, customer lookup, basic POS.    |
| Service Staff     | Own Record/Branch      | Assigned services, appointment status, notes.    |
| Cashier           | Branch                 | Checkout, invoice, payment capture.              |
| Inventory Manager | Branch                 | Product stock and movement operations.           |
| Accountant        | Salon Business/Branch  | Financial read access and reconciliation views.  |
| Platform Admin    | Platform support scope | Support/admin access with strict audit controls. |

## Permission Matrix

| Capability                      | Owner | Branch Manager | Front Desk | Service Staff | Cashier        | Inventory Manager | Accountant | Platform Admin |
| ------------------------------- | ----- | -------------- | ---------- | ------------- | -------------- | ----------------- | ---------- | -------------- |
| Manage salon business profile   | Yes   | No             | No         | No            | No             | No                | Read       | Support        |
| Manage legal/tax registration   | Yes   | Delegated      | No         | No            | No             | No                | Read       | Support        |
| Manage branch profile           | Yes   | Yes            | No         | No            | No             | No                | Read       | Support        |
| Manage branch hours/holidays    | Yes   | Yes            | No         | No            | No             | No                | Read       | Support        |
| Manage branch policies          | Yes   | Delegated      | No         | No            | No             | No                | Read       | Support        |
| Manage staff profile            | Yes   | Branch only    | No         | Own read      | No             | No                | No         | Support        |
| Manage staff roles              | Yes   | Delegated      | No         | No            | No             | No                | No         | Support        |
| Manage staff shifts/leave       | Yes   | Yes            | No         | Own read      | No             | No                | No         | Support        |
| Manage service catalog          | Yes   | Yes            | Read       | Read          | Read           | No                | Read       | Support        |
| Manage service branch overrides | Yes   | Yes            | No         | No            | No             | No                | Read       | Support        |
| Search/create customer          | Yes   | Yes            | Yes        | Branch read   | Yes            | No                | Read       | Support        |
| View restricted customer notes  | Yes   | Yes            | Delegated  | Assigned only | No             | No                | No         | Support        |
| Create/update restricted notes  | Yes   | Yes            | Delegated  | Assigned only | No             | No                | No         | Support        |
| Merge customers                 | Yes   | Delegated      | No         | No            | No             | No                | No         | Support        |
| Create/reschedule appointments  | Yes   | Yes            | Yes        | Assigned only | No             | No                | No         | Support        |
| Override booking conflict       | Yes   | Yes            | Delegated  | No            | No             | No                | No         | Support        |
| Cancel/no-show appointments     | Yes   | Yes            | Yes        | Assigned only | No             | No                | No         | Support        |
| Start/complete assigned service | Yes   | Yes            | Yes        | Assigned only | No             | No                | No         | Support        |
| Create invoice draft            | Yes   | Yes            | Yes        | No            | Yes            | No                | Read       | Support        |
| Finalize invoice                | Yes   | Yes            | Delegated  | No            | Yes            | No                | Read       | Support        |
| Capture payment                 | Yes   | Yes            | Delegated  | No            | Yes            | No                | Read       | Support        |
| Apply discount/price override   | Yes   | Delegated      | Delegated  | No            | Delegated      | No                | Read       | Support        |
| View financial reports          | Yes   | Branch only    | No         | No            | Branch closing | No                | Yes        | Support        |
| Manage product catalog          | Yes   | Yes            | No         | No            | No             | Yes               | Read       | Support        |
| Record stock movement           | Yes   | Yes            | No         | No            | No             | Yes               | Read       | Support        |
| View owner dashboard            | Yes   | Branch only    | Limited    | Own work      | Limited        | Limited           | Financial  | Support        |

## Enforcement Rules

- `Yes` requires the role plus the correct tenant/business/branch scope.
- `Delegated` requires an explicit permission flag assigned by owner or platform policy.
- `Support` requires platform-admin support context, ticket/reference, and audit record.
- Branch Manager permissions are limited to assigned branches.
- Service Staff can update only assigned appointment status and permitted notes.
- Accountant can read financial records but cannot mutate invoices or payments in MVP.
- Permission checks must be enforced server-side even when UI hides actions.

## Master and Business Semi-Master Architecture (ADR-0005)

As defined in [ADR-0005](../../architecture/decisions/0005-database-driven-role-master-and-semi-master.md):
1. **Global Presets (`RoleMaster` & `PermissionMaster`):** The capability rows in this matrix define the platform's `PermissionMaster` catalog. The default columns define the system `RoleMaster` presets seeded to new businesses on onboarding.
2. **Business Semi-Master (`BusinessRole`):** Each `SalonBusiness` holds its own active role records. Businesses can:
   - Rename role display names (e.g., *"Stylist"* &rarr; *"Senior Colorist"*, *"Barber"*);
   - Add custom descriptions defining what each role means within that salon's operations;
   - Deactivate presets not required by their operational model (e.g., hiding *"Inventory Manager"* in a solo salon);
   - Add custom roles composed of selected capabilities from the `PermissionMaster` catalog.
3. **Owner Protection Invariant (`BR-ST-06.1`):** A business must retain at least one active user with the `OWNER` role; the last active owner's role cannot be removed or deactivated.
