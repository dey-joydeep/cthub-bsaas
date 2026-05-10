# Social And Community User Stories

**Date:** 2026-05-11
**Status:** Current future-scope source

## Owner Outcome

As a salon business, I may want community-style engagement later so that customers interact with beauty content beyond bookings. This is future scope and must not block the operational salon MVP.

## Actors

- Customer
- Salon Owner
- Service Staff
- Platform Moderator

## Primary Screens Or Workflows

- Public profile follow
- Activity feed
- Media sharing
- Direct message or inquiry
- Community moderation

## User Stories

### SOC-US-001: Follow salon or staff

As a customer, I want to follow a salon or staff profile so that I can see updates and new work.

### SOC-US-002: Activity feed

As a customer, I want a feed of approved portfolio, offers, and updates so that I can discover relevant content.

### SOC-US-003: Content engagement

As a customer, I want to like, comment, or share approved posts so that I can engage with salon content.

### SOC-US-004: Moderation

As a platform moderator, I want community content moderation so that unsafe or inappropriate content is controlled.

## Functional Requirements

- Support follow/unfollow for public salon or staff profiles.
- Show activity feed from approved public content.
- Support likes/comments/shares only after moderation policy is defined.
- Provide reporting and moderation workflow.
- Notify profile owners about relevant engagement where enabled.

## Business Rules And Edge Cases

- Social features must not expose private appointment or customer data.
- Staff public profiles require owner/staff policy approval.
- Messaging must not become an untracked booking channel without owner visibility.
- Community moderation must be designed before public launch.

## Acceptance Criteria

- Given a customer follows a salon, when the salon posts approved public content, then the content appears in the customer's feed.
- Given content is reported, when moderation marks it hidden, then it is removed from public views.
- Given a staff member is inactive, when public profile loads, then follow and booking CTAs follow business policy.

## Non-Functional Requirements

- Social content must be moderated and abuse-resistant.
- Feed queries must be paginated.
- Notification volume must be rate-limited.
