# Profile Management

## Overview
This document specifies the requirements for user profile management, including personal information, contact details, and security settings.

## Functional Requirements

### 1. Personal Information
- Display name/nickname
- Profile picture
- Bio/description
- Date of birth
- Gender (optional)
- Preferred language
- Timezone

### 2. Contact Information
- Primary email (verified)
- Secondary email (optional)
- Phone number (verified)
- Mailing address
- Emergency contact

### 3. Security Settings
- Password management
- Two-factor authentication
- Login activity
- Connected devices
- Login notifications

### 4. Privacy Settings
- Profile visibility
- Contact information visibility
- Activity sharing preferences
- Data export/delete options

## Technical Requirements

### Data Model
```typescript
interface UserProfile {
  userId: string;
  personalInfo: {
    displayName: string;
    firstName: string;
    lastName: string;
    bio?: string;
    dateOfBirth?: Date;
    gender?: string;
    preferredLanguage: string;
    timezone: string;
    avatarUrl?: string;
  };
  contactInfo: {
    primaryEmail: {
      address: string;
      isVerified: boolean;
    };
    secondaryEmail?: {
      address: string;
      isVerified: boolean;
    };
    phoneNumber?: {
      number: string;
      isVerified: boolean;
    };
    address?: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    emergencyContact?: {
      name: string;
      relationship: string;
      phoneNumber: string;
      email?: string;
    };
  };
  security: {
    lastPasswordChange: Date;
    twoFactorEnabled: boolean;
    recoveryEmail?: string;
    securityQuestions?: {
      question: string;
      answerHash: string;
    }[];
  };
  privacy: {
    profileVisibility: 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';
    contactVisibility: 'PUBLIC' | 'CONNECTIONS' | 'PRIVATE';
    activitySharing: boolean;
    dataSharingPreferences: {
      marketingEmails: boolean;
      newsletter: boolean;
      thirdPartySharing: boolean;
    };
  };
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    lastLogin: Date;
    loginHistory: LoginRecord[];
  };
}

interface LoginRecord {
  timestamp: Date;
  ipAddress: string;
  deviceInfo: string;
  location: {
    city?: string;
    region?: string;
    country?: string;
  };
  status: 'SUCCESS' | 'FAILED';
  failureReason?: string;
}
```

### API Endpoints
- `GET /api/users/me/profile` - Get user profile
- `PUT /api/users/me/profile` - Update profile
- `PATCH /api/users/me/password` - Change password
- `POST /api/users/me/avatar` - Upload profile picture
- `GET /api/users/me/security` - Get security settings
- `PUT /api/users/me/security` - Update security settings
- `GET /api/users/me/privacy` - Get privacy settings
- `PUT /api/users/me/privacy` - Update privacy settings

## Business Rules
- Email verification required for primary email
- Phone verification for sensitive operations
- Password complexity requirements
- Rate limiting for sensitive operations
- Account lockout after failed attempts

## UI/UX Requirements
- Responsive design for all devices
- Progress indicators for save operations
- Confirmation for critical actions
- Clear error messages
- Accessibility compliant

## Security
- HTTPS required for all endpoints
- Input validation and sanitization
- CSRF protection
- Rate limiting
- Audit logging

## Testing
- Unit tests for validation logic
- Integration tests for API endpoints
- E2E tests for user flows
- Security testing for vulnerabilities
- Performance testing for profile loading
