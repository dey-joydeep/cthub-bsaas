# ADR-0005: Database-Driven Role Master and Business Semi-Master

- **Status:** Accepted
- **Date recorded:** 2026-11-07
- **Original decision date:** 2026-11-07
- **Owner:** Solution and database architects
- **Decision maker:** Product Owner
- **Related issue/PR:** [PR #46](https://github.com/dey-joydeep/cthub-bsaas/pull/46) / [Issue #107](https://github.com/dey-joydeep/cthub-bsaas/issues/107)
- **Supersedes / superseded by:** Supersedes static enum-based role modeling in Slice 4 contracts

## Context

The initial Slice 4 MVP specification defined staff roles as a fixed, compile-time enum (`OWNER`, `MANAGER`, `RECEPTIONIST`, `STYLIST`, `CASHIER`, `INVENTORY_MANAGER`).

However, salon industry operational reality requires multi-tenant terminology and capability flexibility:
1. **Divergent Business Terminology:** Barbershops employ *"Master Barbers"* and *"Apprentices"*; medical spas employ *"Estheticians"* and *"Clinical Directors"*; nail salons employ *"Technicians"*. Forcing a rigid enum creates poor product-market fit.
2. **Operational Scale Variance:** A solo or two-chair barbershop does not need clutter from *"Inventory Manager"* or *"Cashier"* roles, whereas a 20-chair salon requires tiered roles (*"Floor Lead"*, *"Booth Renter"*).
3. **Role Meanings and Boundaries:** Different businesses assign different operational scopes to their titles. A business must be able to specify what a role means and what tasks it permits or bans.

Hardcoded enums in application code and PostgreSQL schemas prevent dynamic multi-tenant customization and require code deployments and database schema migrations for any new role.

## Decision drivers

1. **Multi-tenant Customization:** Businesses must be able to customize role names, document what each role means, hide unused presets, and introduce custom roles.
2. **Granular Capability Mapping:** Access control must map to a standardized, platform-enforced capability catalog (`PermissionMaster`).
3. **Owner Protection & Safety:** Critical business rules must remain strictly enforced by the backend (e.g. `BR-ST-06.1`: cannot delete or remove the `OWNER` role from the last active owner).
4. **Autonomous Onboarding:** New salon businesses must start immediately with sensible, industry-standard presets without manual role setup friction.
5. **Clear Separation of Ownership:** The platform owns the system permission catalog; the business owns its active role roster.

## Options

| Option | Benefits | Costs and risks | Evidence |
| :--- | :--- | :--- | :--- |
| **Option A: Static Enum RBAC** (Previous baseline) | Trivial to implement; static type checks in TypeScript. | Inflexible; cannot rename roles; cannot hide unused roles; cannot add custom roles without DB migration and deployment. | Observed in initial Slice 4 draft (`StaffRole` enum). |
| **Option B: Pure Dynamic PBAC** (Ad-hoc permissions per user) | Maximum granular flexibility per staff member. | High management overhead for salon owners; confusing UX; permission drift across employees. | Rejected for MVP operational simplicity. |
| **Option C: Global Role Master + Business Semi-Master (Chosen)** | Combines out-of-the-box presets with tenant-scoped customization. Clean ERD boundaries, scalable to enterprise tiers. | Requires relational join tables and tenant onboarding seed lifecycle. | Standard pattern across mature multi-tenant platforms (Toast, Mindbody, Shopify). |

## Decision

Adopt **Option C: Global Role Master + Business Semi-Master**:

1. **Global Master Layer:**
   - **`PermissionMaster`**: Immutable, platform-defined catalog of granular operational capabilities (e.g. `appointment.create`, `pos.payment.capture`, `inventory.manage`, `staff.roster.edit`, `reports.revenue.view`).
   - **`RoleMaster`**: Global preset templates (`OWNER`, `MANAGER`, `RECEPTIONIST`, `STYLIST`, `CASHIER`, `INVENTORY_MANAGER`) pre-configured with standard permission bundles and default descriptions.
2. **Business Semi-Master Layer:**
   - **`BusinessRole`**: Scoped to `SalonBusiness`. On business onboarding/registration, system presets are cloned into the business's `BusinessRole` table.
   - **Business Customization Rights:**
     - **Visibility:** Toggle `isActive` on presets not needed by the business.
     - **Custom Titles & Descriptions:** Edit display name (e.g. *"Stylist"* &rarr; *"Senior Colorist"*) and customized description.
     - **Custom Roles:** Create new business roles with selected permissions from `PermissionMaster`.
     - **Permission Tuning:** Adjust the set of granted `PermissionMaster` capabilities.
   - **Safety Invariant:** System-critical roles (specifically `OWNER`) cannot be deleted, deactivated, or stripped of administrative permissions if it is the last active owner (`BR-ST-06.1`).
3. **Staff Assignment:**
   - `Staff` links to `BusinessRole` via `StaffRoleAssignment` (or foreign key array of `roleIds`), replacing the static enum column.

## Consequences and follow-up

### Data Access & Persistence
- Add Prisma models: `PermissionMaster`, `RoleMaster`, `RoleMasterPermission`, `BusinessRole`, `BusinessRolePermission`, `StaffRoleAssignment`.
- Add onboarding lifecycle hook: Seeder clones active `RoleMaster` presets into `BusinessRole` upon `SalonBusiness` creation.

### API & Contracts
- Publish endpoints in OpenAPI:
  - `GET /api/partner/roles`: List active business roles, descriptions, and granted permissions.
  - `POST /api/partner/roles`: Create a custom business role.
  - `PUT /api/partner/roles/{roleId}`: Update title, description, active status, or permissions.
  - `DELETE /api/partner/roles/{roleId}`: Soft-delete/deactivate role (rejected if assigned to active staff).
  - `GET /api/partner/permissions`: Catalog of available system capabilities.
  - `PUT /api/partner/staff/{staffId}/roles`: Updated to accept `roleIds: string[]`.

### Authorization & Guards
- NestJS authorization guards evaluate required permissions against the calling staff's resolved `BusinessRolePermission` set rather than static string enum matching.

## Review and history

- 2026-11-07: Accepted by Product Owner. Formalizes database-driven Role Master and Semi-Master architecture for Slice 4 backend and frontend integration.
