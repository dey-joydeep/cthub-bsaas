# Project Separation Strategy

## Overview
This document outlines the strategy for separating the Beauty SaaS application based on user roles (Admin, Partner/Salon Owner, and Customer) to optimize load times and reduce unnecessary payloads. The separation will focus on creating dedicated frontends for each user type while maintaining an efficient backend architecture.

## Current Architecture Assessment

### New Project Structure
```
cthub-bsaas/         # Root project
├── docs/            # Project documentation
├── apps/
│   ├── api/         # Backend API (renamed from bsaas-back)
│   └── web/         # Frontend applications
│       ├── admin/   # Admin dashboard
│       ├── partner/ # Partner portal
│       └── customer/# Customer app
└── libs/            # Shared libraries
    ├── core/        # Core functionality
    │   ├── auth/    # Authentication
    │   ├── ui/      # Base UI components
    │   └── utils/   # Shared utilities
    ├── features/    # Feature libraries
    ├── data-access/ # Data access layer
    └── shared/      # Shared domain models and DTOs
```

### Identified Issues
1. All user roles share the same frontend bundle
2. Unnecessary code is loaded for all users
3. Shared components are not optimized for specific user roles
4. Mixed authentication/authorization flows
5. Inefficient payload delivery

# Beauty SaaS Project Structure

## 1. Applications Structure

### 1.1 Backend (`/apps/api`)
- **Purpose**: Single backend API serving all frontend applications
- **Structure**:
  ```
  api/
  ├── src/
  │   ├── app/               # Application setup
  │   ├── modules/           # Feature modules
  │   │   ├── auth/         # Authentication
  │   │   ├── users/        # User management
  │   │   └── ...          # Other feature modules
  │   ├── config/           # Configuration
  │   └── main.ts           # Application entry
  └── prisma/               # Database schema and migrations
  ```

### 1.2 Frontend Applications (`/apps/web`)
- **Admin Dashboard** (`/web/admin`)
  - User management
  - System configuration
  - Analytics
  - Reporting

- **Partner Portal** (`/web/partner`)
  - Salon management
  - Appointment scheduling
  - Customer management

- **Customer App** (`/web/customer`)
  - Service discovery
  - Booking system
  - Profile management
  - Salon management
  - Appointment scheduling
  - Staff management

- **Customer App** (`bsaas-customer`)
  - Service discovery
  - Booking system
  - Profile management

## 2. Libraries (`/libs`)

### 2.1 Shared Core (`shared`)

#### Current to New Structure Mapping

**Current Location** | **New Location** | **Notes**
---------------------|------------------|-----------
`apps/bsaas-back/src/common/*` | `libs/shared/src/common/*` | Move common utilities and decorators
`apps/bsaas-back/src/core/types/*` | `libs/shared/src/types/*` | Move shared types and interfaces
`apps/bsaas-back/src/core/validation/*` | `libs/shared/src/validation/*` | Move validation logic
`apps/bsaas-back/src/modules/*/dto/*` | `libs/shared/src/dto/*` | Consolidate DTOs by domain
`apps/bsaas-back/src/modules/*/interfaces/*` | `libs/shared/src/interfaces/*` | Move shared interfaces

#### Key Files to Move:
1. **Authentication**
   - `apps/bsaas-back/src/core/auth/types/*` → `libs/shared/src/types/auth/*`
   - `apps/bsaas-back/src/core/auth/guards/*` → `libs/auth/src/guards/*`

2. **User Management**
   - `apps/bsaas-back/src/modules/user/*` → `libs/shared/src/types/user/*`
   - `apps/bsaas-back/src/core/auth/dto/*` → `libs/shared/src/dto/auth/*`

3. **Common Utilities**
   - `apps/bsaas-back/src/core/utils/*` → `libs/shared/src/utils/*`
   - `apps/bsaas-back/src/core/constants/*` → `libs/shared/src/constants/*`
- **Types & Interfaces** (`/types`)
  - User types
  - API request/response DTOs
  - Common interfaces

- **Validation** (`/validation`)
  - Common validation schemas
  - Custom validators

- **Utils** (`/utils`)
  - Date formatting
  - String manipulation
  - Common utilities

### 2.2 UI Components (`ui`)

#### Current to New Structure Mapping

**Current Location** | **New Location** | **Notes**
---------------------|------------------|-----------
`apps/bsaas-front/src/app/shared/*` | `libs/ui/src/lib/*` | Move shared UI components
`apps/bsaas-front/src/assets/styles/*` | `libs/ui/src/styles/*` | Move global styles
`apps/bsaas-front/src/app/core/layout/*` | `libs/ui/src/layout/*` | Move layout components

#### Key Components to Move:
1. **Base Components**
   - `apps/bsaas-front/src/app/shared/components/buttons/*` → `libs/ui/src/lib/buttons/*`
   - `apps/bsaas-front/src/app/shared/components/forms/*` → `libs/ui/src/lib/forms/*`
   - `apps/bsaas-front/src/app/shared/components/modals/*` → `libs/ui/src/lib/modals/*`

2. **Layout Components**
   - `apps/bsaas-front/src/app/core/layout/header/*` → `libs/ui/src/layout/header/*`
   - `apps/bsaas-front/src/app/core/layout/footer/*` → `libs/ui/src/layout/footer/*`
   - `apps/bsaas-front/src/app/core/layout/sidebar/*` → `libs/ui/src/layout/sidebar/*`
- **Base Components** (`/components/base`)
  - Buttons, inputs, modals
  - Form controls
  - Layout components

- **Theme** (`/theme`)
  - Design tokens
  - Global styles
  - Theming system

### 2.3 Feature Modules

#### Current to New Structure Mapping

**Current Location** | **New Location** | **Notes**
---------------------|------------------|-----------
`apps/bsaas-back/src/modules/appointment/*` | `libs/appointments/src/*` | Move appointment logic
`apps/bsaas-back/src/modules/salon/*` | `libs/salon/src/*` | Move salon management
`apps/bsaas-back/src/modules/review/*` | `libs/reviews/src/*` | Move review functionality
`apps/bsaas-front/src/app/modules/*` | `libs/feature-*/src/*` | Move frontend features

#### Feature Module Breakdown:

1. **Appointments (`/appointments`)**
   - Backend: `apps/bsaas-back/src/modules/appointment/*` → `libs/appointments/src/*`
   - Frontend: `apps/bsaas-front/src/app/modules/appointment/*` → `libs/appointments/src/lib/*`
   - Shared Types: Move to `libs/shared/src/types/appointments/*`

2. **Salon Management (`/salon`)**
   - Backend: `apps/bsaas-back/src/modules/salon/*` → `libs/salon/src/*`
   - Frontend: `apps/bsaas-front/src/app/modules/salon/*` → `libs/salon/src/lib/*`
   - Shared Types: Move to `libs/shared/src/types/salon/*`

3. **Reviews (`/reviews`)**
   - Backend: `apps/bsaas-back/src/modules/review/*` → `libs/reviews/src/*`
   - Frontend: `apps/bsaas-front/src/app/modules/review/*` → `libs/reviews/src/lib/*`
   - Shared Types: Move to `libs/shared/src/types/reviews/*`
- **Auth** (`/auth`)
  - Authentication flows
  - Guards and interceptors
  - User session management

- **Appointments** (`/appointments`)
  - Booking components
  - Calendar integration
  - Appointment management

- **Salon** (`/salon`)
  - Salon listing
  - Service management
  - Staff management

- **Dashboard** (`/dashboard`)
  - Analytics widgets
  - Statistics components
  - Report generation

## 3. Migration Strategy

### Phase 1: Setup (Week 1)
1. **Create New Structure**
   ```bash
   # Create new libraries
   nx generate @nx/js:library shared --directory=libs/shared
   nx generate @nx/angular:library ui --directory=libs/ui
   nx generate @nx/js:library appointments --directory=libs/feature/appointments
   # Repeat for other features
   ```

2. **Move Shared Code**
   - Move types and interfaces to `libs/shared`
   - Move UI components to `libs/ui`
   - Update all imports

### Phase 2: Feature Migration (Weeks 2-3)
1. **Migrate One Feature at a Time**
   - Start with a small, self-contained feature
   - Update both backend and frontend
   - Update tests and CI/CD pipelines

2. **Update Dependencies**
   - Update `tsconfig.json` paths
   - Update import statements
   - Update test configurations

### Phase 3: Testing & Optimization (Week 4)
1. **Testing**
   - Unit tests for all moved code
   - Integration tests for features
   - E2E tests for critical paths

2. **Optimization**
   - Analyze bundle sizes
   - Optimize imports
   - Implement lazy loading

## 4. Configuration

### 3.1 NX Configuration
- **Project Boundaries**:
  ```json
  {
    "enforce-module-boundaries": [
      "error",
      {
        "allow": [],
        "depConstraints": [
          {
            "sourceTag": "type:app",
            "onlyDependOnLibsWithTags": ["scope:shared", "scope:feature"]
          },
          {
            "sourceTag": "scope:feature",
            "onlyDependOnLibsWithTags": ["scope:shared"]
          }
        ]
      }
    ]
  }
  ```

### 3.2 Environment Configuration
- Development
- Staging
- Production

## Implementation Phases

### Phase 1: Frontend Separation (Weeks 1-3)
1. Set up new frontend applications
   - Configure build system for shared code
   - Implement shared authentication flow
   - Set up CI/CD pipelines

2. Migrate shared components
   - Audit existing components
   - Move to `bsaas-common`
   - Update imports and tests

### Phase 2: Backend Optimization (Weeks 4-6)
1. Implement role-based API endpoints
   - Optimize queries for each role
   - Add granular permissions
   - Implement field-level security

2. Performance improvements
   - Add response caching
   - Implement data loaders
   - Optimize database queries

### Phase 3: Integration & Testing (Weeks 7-8)
1. End-to-end testing
   - Role-specific test suites
   - Performance benchmarking
   - Security testing

2. Deployment strategy
   - Canary releases
   - Feature flags
   - Rollback procedures

## Technical Considerations

### Frontend Optimization
- **Lazy Loading**: Route-level code splitting
- **Preloading**: Critical assets preloading
- **Caching**: Service worker for static assets
- **Tree Shaking**: Remove unused code

### Backend Optimization
- **Caching**: Redis for frequent queries
- **Compression**: Enable response compression
- **Pagination**: Implement cursor-based pagination
- **Selective Fields**: Allow clients to request only needed fields

### Authentication & Authorization
1. **Unified Auth Service**
   - Single sign-on (SSO) for all applications
   - JWT with role claims
   - Refresh token rotation

2. **Role-Based Access Control**
   - Fine-grained permissions
   - Feature-level access control
   - Audit logging

## Migration Strategy
1. **Incremental Rollout**
   - Start with read-only features
   - Gradually move to write operations
   - Use feature flags for controlled rollout

2. **Data Consistency**
   - Shared database during transition
   - Event-driven architecture for data synchronization
   - Monitoring for data consistency issues


