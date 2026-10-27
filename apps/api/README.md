# Beauty SaaS Backend

A production-ready, multi-tenant beauty salon SaaS backend built with Node.js, TypeScript, Express, Prisma, PostgreSQL, and Angular frontend integration.

## Features

- Multi-tenant architecture
- Portfolio management
- Social login (Google, Facebook)
- Color theme customization per tenant
- User activity tracking
- RESTful API with robust error handling
- Internationalization (i18n)
- Mobile-friendly API design
- JWT authentication & security best practices
- Swagger/OpenAPI documentation
- Role-Based Access Control (RBAC)

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (for local dev)

### Setup

1. Clone the repo
2. Copy `.env.example` to `.env` and set your secrets
3. Run with Docker Compose:

   ```sh
   docker-compose up --build
   ```

   Or run locally:

   ```sh
   npm install
   npx prisma migrate dev
   npm run dev
   ```

### API Documentation

- Visit [http://localhost:3000/api/docs](http://localhost:3000/api/docs) for Swagger UI

### Environment Variables

See `.env.example` for all required variables.

### Development

```bash
npm run dev
```

### Production

```bash
npm run start:prod
```

### Testing

```bash
npm run test
```

### Project Structure

```plaintext
src/
├── common/                    # Shared utilities and helpers
│   ├── constants/            # Application-wide constants
│   ├── decorators/           # Custom decorators
│   ├── enums/                # Shared enums
│   ├── exceptions/           # Custom exceptions
│   ├── filters/              # Exception filters
│   ├── guards/               # Authentication/authorization guards
│   ├── interceptors/         # Request/response interceptors
│   ├── middleware/           # Global middleware
│   ├── pipes/                # Validation and transformation pipes
│   └── utils/                # Utility functions
│
├── config/                   # Configuration files
│   ├── app.config.ts         # Application configuration
│   ├── auth.config.ts        # Auth configuration
│   └── database.config.ts    # Database configuration
│
├── core/                     # Core application modules
│   ├── auth/                 # Authentication module
│   │   ├── dto/             # Auth DTOs
│   │   ├── guards/           # Auth guards
│   │   ├── strategies/       # Auth strategies (JWT, Local, etc.)
│   │   ├── auth.module.ts
│   │   └── auth.service.ts
│   │
│   └── database/             # Database module
│       ├── migrations/       # Database migrations
│       ├── repositories/     # Repository pattern implementations
│       └── database.module.ts
│
├── modules/                  # Feature modules
│   ├── users/               # User management
│   ├── appointment/         # Appointment management
│   ├── salon/               # Salon management
│   └── ...other modules
│
├── shared/                   # Shared module (imported by any module)
│   ├── decorators/          # Shared decorators
│   ├── filters/             # Shared exception filters
│   ├── interceptors/        # Shared interceptors
│   ├── pipes/               # Shared pipes
│   └── shared.module.ts     # Exports shared providers
│
├── app.module.ts            # Root module
├── app.controller.ts        # Root controller
├── app.service.ts           # Root service
└── main.ts                 # Application entry point

- `src/controllers` - Route controllers
- `src/routes` - Express routes
- `src/middleware` - Auth, validation, error handling
- `src/validators` - Zod schemas
- `src/locales` - i18n translation files
- `src/docs` - OpenAPI/Swagger docs

### DevOps

- Dockerfile and docker-compose included
- Ready for CI/CD integration

### Staff Management Endpoints (2025-04)

- `POST /salons/:salonId/staff` — Add staff (inactive by default)
- `POST /salons/:salonId/staff/:staffId/activate` — Activate staff
- `POST /salons/:salonId/staff/:staffId/deactivate` — Deactivate staff
- `DELETE /salons/:salonId/staff/:staffId` — Remove staff (soft delete)
- Only owner/admin can access these endpoints.

---

## License

MIT
```
