# Beauty SaaS Project Structure

## Overview
This document outlines the structure of the Beauty SaaS monorepo, following the separation of concerns and modular architecture principles. The project uses NX workspaces for efficient code sharing and dependency management.

## Root Directory Structure

```
cthub-bsaas/
├── .github/                # GitHub workflows and CI/CD configurations
├── .husky/                 # Git hooks
├── .nx/                    # NX cache and workspace data
├── .vscode/                # VS Code workspace settings
├── apps/                   # All applications
│   ├── api/                # Backend API (NestJS)
│   └── web/                # Frontend applications (Angular)
│       ├── admin/          # Admin dashboard
│       ├── partner/        # Partner portal
│       └── customer/       # Customer application
├── dist/                   # Build output directory
│   ├── apps/
│   │   ├── api/
│   │   └── web/
├── docs/                   # Project documentation
│   ├── architecture/       # Architecture decision records
│   ├── db/                 # Database schemas and migrations
│   ├── diagrams/           # System architecture diagrams
│   └── specs/              # Technical specifications
├── libs/                   # Shared libraries
│   ├── core/               # Core functionality
│   │   ├── auth/          # Authentication and authorization
│   │   ├── config/        # Configuration management
│   │   └── utils/         # Shared utilities
│   ├── features/          # Feature modules
│   │   ├── appointments/  # Appointment management
│   │   ├── salons/        # Salon management
│   │   └── users/         # User management
│   └── shared/            # Shared domain models and DTOs
├── scripts/               # Utility scripts
├── tools/                 # Development tools and configurations
├── .editorconfig          # Editor configuration
├── .eslintrc.json         # ESLint configuration
├── .gitignore            # Git ignore rules
├── .prettierrc           # Code formatting rules
├── angular.json          # Angular workspace configuration
├── jest.config.ts        # Jest test configuration
├── nx.json               # NX workspace configuration
├── package.json          # Root package.json
├── README.md             # Project README
└── tsconfig.base.json    # Base TypeScript configuration
```

## Applications

### Backend API (`apps/api`)
- Built with NestJS
- Follows modular architecture
- RESTful API endpoints
- Database access via Prisma
- Authentication and authorization
- API documentation with Swagger

### Frontend Applications (`apps/web`)

#### Admin Dashboard (`apps/web/admin`)
- Built with Angular
- For system administrators
- User management
- System configuration
- Analytics and reporting

#### Partner Portal (`apps/web/partner`)
- Built with Angular
- For salon owners/partners
- Appointment management
- Staff management
- Business analytics

#### Customer Application (`apps/web/customer`)
- Built with Angular
- For end customers
- Service discovery
- Online booking
- Profile management

## Shared Libraries (`libs/`)

### Core Libraries (`libs/core/`)
- **auth**: Authentication flows, guards, and JWT utilities
- **config**: Application configuration management
- **utils**: Shared utility functions and helpers

### Feature Libraries (`libs/features/`)
- **appointments**: Appointment scheduling and management
- **salons**: Salon and service management
- **users**: User profiles and authentication

### Shared Domain (`libs/shared/`)
- **dto**: Data transfer objects
- **interfaces**: Shared TypeScript interfaces
- **types**: Common type definitions
- **validation**: Shared validation schemas

## Development Workflow

### Prerequisites
- Node.js 18+
- npm 9+
- Docker (for local database)

### Getting Started
1. Clone the repository
2. Run `npm install` to install dependencies
3. Set up environment variables (see `.env.example`)
4. Start the development server: `npm run dev`

### Building for Production
```bash
# Build all applications
npm run build:prod

# Build specific application
npm run build:api
npm run build:admin
npm run build:partner
npm run build:customer
```

### Testing
```bash
# Run all tests
npm test

# Run tests for specific application
npm run test:api
npm run test:admin
npm run test:partner
npm run test:customer

# Run tests with coverage
npm run test:coverage
```

## Deployment

### Backend
- Containerized with Docker
- Deployed to cloud provider (e.g., AWS ECS, Google Cloud Run)
- Environment-specific configurations

### Frontend
- Static files served via CDN
- Server-side rendering (SSR) for better SEO
- Environment-specific builds

## Code Organization Guidelines

1. **Feature-based Structure**: Organize code by feature rather than by type
2. **Single Responsibility**: Each module should have a single responsibility
3. **Layered Architecture**: Separate concerns between presentation, business logic, and data access
4. **Reusability**: Extract shared functionality into libraries
5. **Testing**: Write unit and integration tests for all features

## Version Control
- Follow Conventional Commits specification
- Create feature branches from `main`
- Open pull requests for code review
- Run all tests before pushing changes
