# Leave Management

## Overview
This document specifies the requirements for the Leave Management system, enabling staff to request time off and salon owners to manage these requests.

## Functional Requirements

### 1. Leave Request Submission
- Staff can submit leave requests with:
  - Start date and time
  - End date and time
  - Leave type (sick, vacation, personal, etc.)
  - Reason (optional)
  - Supporting documents (optional)

### 2. Leave Types
- Sick leave
- Vacation leave
- Personal leave
- Maternity/Paternity leave
- Unpaid leave

### 3. Leave Approval Workflow
- Automatic notifications to salon owners for new requests
- Owners can:
  - Approve requests
  - Reject with reason
  - Request modifications
- Staff receive notifications of status changes

### 4. Leave Balance Tracking
- Track remaining leave days per staff member
- Different accrual rates based on employment type
- Prorated for part-time staff

## Technical Requirements

### Data Model
```typescript
interface LeaveRequest {
  id: string;
  staffId: string;
  salonId: string;
  startDate: Date;
  endDate: Date;
  leaveType: 'SICK' | 'VACATION' | 'PERSONAL' | 'MATERNITY' | 'UNPAID';
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reason?: string;
  attachments: string[]; // URLs to uploaded documents
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewedAt?: Date;
}
```

### API Endpoints
- `POST /api/staff/leave-requests` - Submit new leave request
- `GET /api/staff/leave-requests` - List staff's leave history
- `GET /api/salons/:salonId/leave-requests` - List all leave requests (owner)
- `PUT /api/leave-requests/:id/status` - Update leave request status
- `GET /api/staff/leave-balance` - Check remaining leave balance

## Business Rules
- Minimum notice period for non-emergency leave
- Blackout dates (e.g., holidays, peak seasons)
- Maximum consecutive leave days
- Carryover policies

## UI/UX Requirements
- Calendar view for leave planning
- Visual indicators for approved/pending/rejected requests
- Mobile-friendly interface
- Email notifications for status changes

## Security
- Staff can only view their own leave history
- Owners can view all staff leave requests
- Role-based access control
- Audit logging for all changes

## Testing
- Unit tests for leave balance calculations
- Integration tests for approval workflow
- E2E tests for leave request submission
- Load testing for concurrent requests
