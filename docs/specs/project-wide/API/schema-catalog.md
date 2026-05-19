# Project-Wide API Schema Catalog

**Date:** 2026-05-19
**Status:** Production planning baseline

## Purpose

Define the operation-level DTO intent for `openapi.yaml`. During implementation, each operation-specific DTO class/interface must preserve these fields, constraints, and ownership rules unless the corresponding FRD/LLD/Validation document is updated first.

The OpenAPI file defines route, method, auth, envelope, path/query/header parameters, and response status contract. This catalog defines operation-specific payload content so developers do not infer DTOs from UI screens.

## Shared DTO Rules

| Rule | Requirement |
| --- | --- |
| IDs | UUID strings unless a path explicitly uses `slug`, `provider`, or `key`. |
| Dates | UTC ISO-8601 strings. |
| Money/decimal | String values with two decimal places for money. |
| Booleans | Must not be nullable unless a tri-state business rule is documented. |
| Lists | Cursor pagination is required for large or audit-style lists. |
| Scope | Partner endpoints must enforce business/branch scope from authenticated context plus explicit query/body scope. |
| Errors | Error codes must come from the feature error catalog or validation spec. |

## Account And Profile

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| `getMyProfile` | None. | `userId`, `displayName`, `email`, `phone`, `avatarUrl`, `locale`, `timezone`, `editableFields[]`, `readonlyFields[]`, `updatedAt`. |
| `updateMyProfile` | Optional editable fields: `displayName`, `phone`, `avatarUrl`, `timezone`. | Updated profile plus `changedFields[]`. |
| `getMySecuritySummary` | None. | `mfaEnabled`, `passkeyCount`, `connectedAccountCount`, `activeSessionCount`, `lastPasswordChangeAt`, `lastLoginAt`, `requiresReauth`. |
| `updateMyLocalePreference` | Required `locale`; optional `timezone`. | `locale`, `timezone`, `updatedAt`. |
| `updateMyCommunicationPreferences` | Channel preferences by `email`, `sms`, `whatsapp`, `push`; each has `transactionalEnabled`, `marketingEnabled`, `reminderEnabled`. | Normalized preferences and `consentUpdatedAt`. |
| `listMyConnectedAccounts` | None. | Array of `provider`, `providerUserLabel`, `linkedAt`, `canUnlink`. |
| `unlinkMyConnectedAccount` | Path `provider`; optional `reauthToken`. | `provider`, `unlinkedAt`, `remainingSignInMethods[]`. |
| `createMyPrivacyRequest` | Required `requestType` (`export` or `delete`); optional `reason`. | `requestId`, `requestType`, `status`, `createdAt`, `expectedCompletionAt`. |
| `listMyPrivacyRequests` | Optional cursor query. | Array of `requestId`, `requestType`, `status`, `createdAt`, `completedAt`, `downloadExpiresAt`. |

## App Shell

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| `getShellContext` | None. | `actor`, `app`, `locale`, `timezone`, `businesses[]`, `branches[]`, `activeBusinessId`, `activeBranchId`, `permissions[]`, `navigation[]`, `featureFlags[]`. |
| `listMyRecentNotifications` | Optional `limit`. | Array of `notificationId`, `category`, `title`, `bodyPreview`, `readAt`, `createdAt`, `actionUrl`. |
| `getMyCartSummary` | None. | `itemCount`, `subtotal`, `currency`, `expiresAt`. |

## Customer App

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| `getCustomerDashboard` | None. | `upcomingAppointment`, `recentVisits[]`, `rewardSummary`, `pendingReceipts[]`, `recommendedSalons[]`. |
| `getCustomerBookingContext` | Optional `businessId`, `branchId`, `serviceId`. | `salon`, `branches[]`, `services[]`, `staffOptions[]`, `policySummary`, `availableDateRange`. |
| `createCustomerBooking` | Required `businessId`, `branchId`, `serviceIds[]`, `startAt`; optional `staffId`, `notes`. | `appointmentId`, `status`, `startAt`, `endAt`, `salon`, `services[]`, `policySnapshot`. |
| `listCustomerAppointments` | Optional `status`, `from`, `to`, cursor. | Array of `appointmentId`, `status`, `salon`, `branch`, `startAt`, `endAt`, `services[]`, `actions[]`. |
| `rescheduleCustomerAppointment` | Required `startAt`; optional `reason`, `staffId`. | Updated appointment and `policyImpact`. |
| `cancelCustomerAppointment` | Required `reason`; optional `notes`. | `appointmentId`, `status`, `cancelledAt`, `policyImpact`. |
| `listCustomerFavorites` | Optional `targetType`. | Array of `targetType`, `targetId`, `label`, `imageUrl`, `addedAt`. |
| `upsertCustomerFavorite` | Path `targetType`, `targetId`; required `favorite`. | `targetType`, `targetId`, `favorite`, `updatedAt`. |
| `listCustomerRewards` | Optional `businessId`. | Array of `businessId`, `pointsBalance`, `tier`, `availableBenefits[]`, `expiresAt`. |
| `listCustomerReceipts` | Optional `businessId`, `from`, `to`, cursor. | Array of `receiptId`, `businessName`, `invoiceNumber`, `total`, `paid`, `due`, `currency`, `issuedAt`. |
| `submitCustomerReview` | Required `appointmentId`, `rating`; optional `comment`, `staffRatings[]`, `mediaIds[]`. | `reviewId`, `status`, `submittedAt`, `moderationState`. |

## Public Discovery

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| `getPublicHome` | Optional `city`, `area`. | `featuredSalons[]`, `popularServices[]`, `nearbyAreas[]`, `seo`. |
| `searchPublicSalons` | Query `q`, optional `city`, `area`, `serviceId`, `ratingMin`, cursor. | Array of `salonId`, `slug`, `name`, `area`, `rating`, `reviewCount`, `startingPrice`, `nextAvailability`. |
| `getPublicSalonProfile` | Path `slug`. | `salonId`, `slug`, `name`, `description`, `branches[]`, `ratingSummary`, `gallery[]`, `policies`, `seo`. |
| `listPublicSalonServices` | Path `slug`; optional `categoryId`. | Array of `serviceId`, `name`, `durationMinutes`, `priceFrom`, `category`, `bookable`. |
| `listPublicSalonReviews` | Path `slug`; cursor. | Array of approved reviews with `reviewId`, `rating`, `comment`, `customerDisplayName`, `visitedAt`, `ownerReply`. |
| `listPublicSalonPortfolio` | Path `slug`; optional `category`. | Array of `mediaId`, `imageUrl`, `caption`, `serviceTags[]`, `createdAt`. |
| `getPublicAvailabilitySignal` | Path `slug`; optional `serviceIds[]`, `date`. | `hasAvailability`, `earliestSlotAt`, `branchSignals[]`. |

## Platform Admin

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| `getPlatformDashboard` | Optional date range. | `tenantCounts`, `healthSummary`, `supportQueue`, `riskAlerts[]`, `recentAudit[]`. |
| `createSalonProvisioning` | Required `businessName`, `ownerEmail`, `country`, `timezone`; optional `initialBranch`, `planCode`. | `tenantId`, `businessId`, `ownerInviteId`, `status`, `createdAt`. |
| `listPlatformTenants` | Optional `q`, `status`, `planCode`, cursor. | Array of `tenantId`, `businessName`, `status`, `planCode`, `ownerEmail`, `createdAt`, `lastActiveAt`. |
| `getPlatformTenant` | Path `id`. | Tenant detail, businesses, branches, subscription, usage, risk flags, recent audit. |
| `updatePlatformTenantStatus` | Required `status`, `reason`; optional `effectiveAt`. | `tenantId`, `oldStatus`, `newStatus`, `updatedAt`. |
| `openPlatformSupportView` | Required `tenantId`, `reason`, `scope`; optional `expiresInMinutes`. | `supportViewId`, `expiresAt`, `allowedScopes[]`. |
| `listPlatformFeatureFlags` | Optional `scope`. | Array of `key`, `scope`, `enabled`, `defaultValue`, `overrides[]`. |
| `updatePlatformFeatureFlag` | Path `key`; required `enabled`, `reason`; optional `scope`, `targetId`. | `key`, `enabled`, `updatedAt`, `updatedBy`. |
| `setPlatformMaintenanceMode` | Required `enabled`; optional `message`, `startsAt`, `endsAt`, `affectedApps[]`. | Maintenance state and schedule. |
| `searchPlatformAdminAudit` | Optional actor, target, action, date range, cursor. | Array of audit records. |

## Notifications And Integrations

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| `listNotificationTemplates` | Optional `businessId`, `channel`, `category`. | Array of `templateId`, `channel`, `category`, `enabled`, `updatedAt`. |
| `updateNotificationTemplate` | Required `enabled`, `subject`, `body`; optional locale/channel overrides. | Updated template and audit summary. |
| `listNotificationDeliveries` | Optional `businessId`, `status`, `channel`, date range, cursor. | Array of delivery log summaries. |
| `getNotificationDelivery` | Path `id`. | Delivery detail, recipient mask, provider status, attempts[], error code. |
| `listPlatformNotificationDeliveries` | Optional status/channel/provider/date range, cursor. | Platform delivery logs with tenant metadata. |
| `listIntegrationProviders` | Optional `businessId`. | Array of `provider`, `displayName`, `category`, `configured`, `health`, `lastCheckedAt`. |
| `configureIntegrationProvider` | Path `provider`; required `enabled`; provider-specific credentials/config in encrypted payload fields. | Provider configuration summary without secrets. |
| `testIntegrationProvider` | Path `provider`. | `testRunId`, `status`, `startedAt`. |
| `getIntegrationHealth` | Optional `businessId`. | Provider health summary and recent failures. |
| `handleProviderWebhook` | Path `provider`; provider-signed payload. | `accepted`, `eventId`, `deduplicated`. |
| `getPlatformIntegrationHealth` | Optional provider/category. | Platform-wide provider health and incident indicators. |

## Reporting, Reputation, And Data Privacy

| Operation | Request Fields | Response Data |
| --- | --- | --- |
| Reporting reads | `businessId`, optional `branchId`, `from`, `to`, report-specific filters. | Report metadata, totals, grouped rows, currency, generatedAt. |
| `createReportExport` | Required `reportType`, `format`, filters. | `exportId`, `status`, `createdAt`, `expiresAt`. |
| `getReportExportStatus` | Path `id`. | `exportId`, `status`, `downloadUrl`, `expiresAt`, `errorCode`. |
| `getPlatformReportOverview` | Optional date range. | Tenant/platform KPIs, trend rows, health indicators. |
| `listOwnerReviews` | Optional `businessId`, `status`, rating/date filters, cursor. | Review summaries with moderation state and reply state. |
| `replyToReview` | Required `message`; optional `visibility`. | `replyId`, `reviewId`, `status`, `createdAt`. |
| `moderateReview` | Required `decision`, `reason`. | `reviewId`, `oldState`, `newState`, `moderatedAt`. |
| `getReputationInsights` | Required `businessId`; optional date range. | Rating trend, response metrics, flagged themes. |
| `createBusinessDataExport` | Required `businessId`, `exportType`, `format`; optional filters. | `exportId`, `status`, `createdAt`, `expiresAt`. |
| `getBusinessDataExportStatus` | Path `id`. | Export status and download metadata. |
| `mergeCustomerProfiles` | Required `sourceCustomerId`, `targetCustomerId`, `mergeReason`, `fieldDecisions`. | `mergeId`, `sourceCustomerId`, `targetCustomerId`, `status`, `mergedAt`. |
| `accessRestrictedCustomerNote` | Required `reason`; optional `caseReference`. | `accessGrantId`, `expiresAt`, `noteView`. |
| `listPlatformPrivacyRequests` | Optional status/type/date filters, cursor. | Privacy request queue summaries. |
| `reviewPlatformPrivacyRequest` | Required `decision`, `reason`; optional `assignedTo`, `dueAt`. | `requestId`, `oldStatus`, `newStatus`, `reviewedAt`. |

## Implementation Rule

When a feature slice is implemented, the developer must replace generic OpenAPI object payload references with named DTO schemas for the touched operations in the same PR. The replacement must preserve this catalog, the feature validation spec, and the feature LLD. If the implementation changes a field, the relevant FRD/LLD/Validation document must be updated before the code merge.

