# Home Module Web API

## Overview
This document describes the API endpoints used by the Home module to fetch and manage home page content.

## Base URL
`/api/home`

## Endpoints

### GET /api/home
Get home page content based on user role and authentication status.

**Request**
```http
GET /api/home
Authorization: Bearer {token}
```

**Response**
```json
{
  "userType": "customer|owner|staff|guest",
  "featuredSalons": [],
  "popularServices": [],
  "specialOffers": [],
  "userDashboard": {},
  "notifications": []
}
```

### GET /api/home/featured
Get featured content for the home page.

**Request**
```http
GET /api/home/featured
```

**Response**
```json
{
  "salons": [],
  "services": [],
  "promotions": []
}
```

## Data Models

### HomePageResponse
```typescript
interface HomePageResponse {
  userType: 'customer' | 'owner' | 'staff' | 'guest';
  featuredSalons: SalonPreview[];
  popularServices: ServicePreview[];
  specialOffers: Promotion[];
  userDashboard?: UserDashboard;
  notifications: Notification[];
}
```

### SalonPreview
```typescript
interface SalonPreview {
  id: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
}
```

### ServicePreview
```typescript
interface ServicePreview {
  id: string;
  name: string;
  duration: number;
  price: number;
  category: string;
  salonId: string;
  salonName: string;
}
```

### UserDashboard
```typescript
interface UserDashboard {
  upcomingAppointments: AppointmentPreview[];
  recentActivity: Activity[];
  quickActions: QuickAction[];
  metrics: {
    totalAppointments: number;
    pendingApprovals: number;
    newMessages: number;
  };
}
```

## Error Responses

### 401 Unauthorized
```json
{
  "error": "Unauthorized",
  "message": "Authentication required"
}
```

### 500 Internal Server Error
```json
{
  "error": "InternalServerError",
  "message": "An unexpected error occurred"
}
```

## Rate Limiting
- 100 requests per minute per IP address
- 1000 requests per minute per authenticated user
