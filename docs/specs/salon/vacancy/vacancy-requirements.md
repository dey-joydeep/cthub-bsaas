# Vacancy Management

## Overview
This document outlines the requirements for the Vacancy Management feature, which allows salon owners to announce and manage job vacancies within their salon.

## Functional Requirements

### 1. Create Vacancy
- Salon owners can create new job vacancy announcements
- Each vacancy must include:
  - Job title
  - Job description
  - Required qualifications
  - Work hours
  - Salary range (optional)
  - Application deadline

### 2. View Vacancies
- Salon staff can view all active vacancies
- Filter vacancies by:
  - Job type
  - Date posted
  - Application deadline

### 3. Update Vacancy
- Salon owners can update vacancy details
- Changes must be versioned
- Notify applicants of significant changes

### 4. Close/Remove Vacancy
- Mark vacancies as filled or closed
- Archive old vacancies
- Maintain historical record of filled positions

## Technical Requirements

### Data Model
```typescript
interface Vacancy {
  id: string;
  salonId: string;
  title: string;
  description: string;
  requirements: string[];
  workHours: string;
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'FILLED';
  createdAt: Date;
  updatedAt: Date;
  deadline: Date;
  applications: Application[];
}
```

### API Endpoints
- `POST /api/salons/:salonId/vacancies` - Create new vacancy
- `GET /api/salons/:salonId/vacancies` - List vacancies
- `GET /api/salons/:salonId/vacancies/:id` - Get vacancy details
- `PUT /api/salons/:salonId/vacancies/:id` - Update vacancy
- `DELETE /api/salons/:salonId/vacancies/:id` - Remove vacancy

## UI/UX Requirements
- Intuitive form for creating/editing vacancies
- Clear display of active vs. closed positions
- Mobile-responsive design
- Accessibility compliant

## Security
- Only salon owners can create/update/delete vacancies
- Staff can only view published vacancies
- Validate all user inputs
- Rate limiting on API endpoints

## Testing
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for user flows
- Load testing for vacancy listing pages
