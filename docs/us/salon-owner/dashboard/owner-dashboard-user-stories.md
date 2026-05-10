# Owner Dashboard User Stories

**Date:** 2026-05-11
**Status:** Product-owner draft

## Owner Outcome

As a salon owner, I want a daily command center so that I can see business health, operational risks, and urgent actions without asking staff or opening many screens.

## Actors

- Salon Owner
- Branch Manager
- Platform Admin, support-only access

## Primary Screens

- Owner dashboard
- Branch dashboard
- Alert drawer
- Quick action menu

## User Stories

### DASH-US-001: Daily command center

As a salon owner, I want to see today's bookings, walk-ins, revenue, pending payments, staff utilization, and low-stock alerts in one dashboard so that I can act before revenue or service quality is affected.

### DASH-US-002: Branch comparison

As a multi-branch owner, I want to compare branches by appointments, revenue, no-shows, staff utilization, and customer repeat rate so that I can identify underperforming locations quickly.

### DASH-US-003: Risk alerts

As a branch manager, I want alerts for overbooked staff, pending dues, failed payments, cancelled bookings, and low stock so that I can fix issues during the business day.

### DASH-US-004: Quick actions

As a salon owner, I want quick actions for new booking, walk-in, checkout, customer search, staff attendance, and stock adjustment so that front-desk work is fast during peak hours.

## Functional Requirements

- Show metrics for selected date range: today, yesterday, this week, this month, custom range.
- Support branch filter for single branch, all branches, and branch comparison.
- Show appointment statuses: booked, confirmed, arrived, in service, completed, cancelled, no-show.
- Show revenue split by service, retail product, package, membership, tax, discount, and refund.
- Show pending dues and failed payment count.
- Show staff utilization based on working hours, booked hours, blocked time, and completed service time.
- Show low-stock alerts based on branch-specific thresholds.
- Provide quick links to the exact source screen for each metric.

## Business Rules And Edge Cases

- Revenue cards must distinguish gross revenue, discount, tax, refund, pending due, and net collected amount.
- Cancelled and no-show appointments must not be counted as completed revenue.
- Multi-branch totals must not double-count inter-branch stock transfers.
- Owner can view all branches; branch manager can view only assigned branches.
- Dashboard must clearly show when data is delayed or partially unavailable.

## Acceptance Criteria

- Given I am an owner with multiple branches, when I open the dashboard, then I can switch between all-branch and per-branch views.
- Given there are pending dues, when I click the pending dues card, then I land on a filtered list of bills requiring collection.
- Given staff is overbooked, when I open alerts, then I see staff name, branch, time conflict, and affected appointments.
- Given a low-stock product crosses threshold, when I open the low-stock card, then I see current quantity, threshold, branch, and reorder suggestion.
- Given I do not have permission for a branch, when I open the dashboard, then that branch's data is excluded.

## Non-Functional Requirements

- Dashboard initial data should load within 2 seconds for a single branch on normal broadband.
- Dashboard must be usable on tablet screens at front desk.
- Financial figures must be consistent with billing reports.
- Access must be audited for owner and manager views.
- Sensitive financial widgets must respect role permissions.

## HLD/LLD Hints

- Define dashboard read models separately from transactional write models.
- Prefer cached aggregates for historical ranges and live queries for today's operational cards.
- Define metric contracts precisely before UI implementation.
