# Beauty SaaS Platform (Nx Monorepo)

[![Nx](https://img.shields.io/badge/powered%20by-nx-143055?style=flat-square&logo=nx&logoColor=white)](https://nx.dev)

A scalable SaaS platform for beauty salons, built with Nx, Angular, and NestJS.

## Product Goal

Build a platform that helps beauty salons run their business and can scale from a single branch to multiple businesses and branches. Salon operations are the first product area: settings, staff, services, customers, appointments, billing, inventory, and an owner dashboard. Public discovery, the customer app, and platform administration extend that foundation in later slices.

The first release goal is an operationally credible single-branch salon. The [Salon Owner release scope](docs/us/salon-owner/release-scope.md) defines the MVP boundary; the [product stories](docs/us/README.md) and [current specs](docs/specs/README.md) define feature behavior. Product success measures belong in each work item's acceptance criteria rather than being inferred from implementation activity.

Development follows the [AI-driven development life cycle](docs/aidd/development-lifecycle.md), with specialist agents owning bounded stages and independent Codex review and security gates.

## 🏗️ Project Structure

```text
cthub-bsaas/
├── apps/
│   ├── web/              # Frontend applications
│   │   ├── admin/        # Admin dashboard (web-admin)
│   │   ├── partner/      # Partner portal (web-partner)
│   │   └── customer/     # Customer app (web-customer)
│   └── api/              # Backend API (NestJS)
│
├── libs/
│   ├── server/             # Backend libraries
│   │   ├── core/
│   │   ├── data-access/
│   │   └── features/
│   ├── shared/             # Shared libraries (isomorphic)
│   └── web/                # Frontend libraries
│       ├── admin/
│       ├── config/
│       ├── core/
│       ├── customer/
│       ├── partner/
│       └── ui/
│
├── docs/                # Project documentation
├── scripts/             # Utility scripts
├── .github/             # GitHub workflows
└── .vscode/            # VS Code settings
```

## 🚀 Development Setup

### Prerequisites

- Node.js 24 (see `package.json` engines)
- npm 9+
- Docker 24.0+ (for local development)
- Git 2.40+
- Use the workspace Nx CLI through npm; a global Nx installation is not required.

### Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/dey-joydeep/cthub-bsaas.git
   cd cthub-bsaas
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in the `apps/api` directory
   - Update the values in `.env` as needed for your local setup
   - For frontend, configure environment files in `apps/web/*/src/environments/`

4. **Start the development servers**

   Start the backend API:

   ```bash
   npx nx serve api
   ```

   In a separate terminal, start the frontend application:

   ```bash
   # For admin dashboard
   npx nx serve web-admin

   # Or for partner portal
   npx nx serve web-partner

   # Or for customer app
   npx nx serve web-customer
   ```

5. **Run database migrations**

   ```bash
   npx nx run api:db:migrate
   ```

## 🛠 Development Commands

### Run applications

- **Start admin dashboard in development mode**

  ```bash
  npx nx serve web-admin
  ```

- **Start partner portal in development mode**

  ```bash
  npx nx serve web-partner
  ```

- **Start customer app in development mode**

  ```bash
  npx nx serve web-customer
  ```

- **Start backend API in development mode**

  ```bash
  npx nx serve api
  ```

### Build applications

- **Build all applications**

  ```bash
  npx nx run-many --target=build --all
  ```

- **Build specific application**

  ```bash
  # Frontend apps
  npx nx build web-admin
  npx nx build web-partner
  npx nx build web-customer

  # Backend
  npx nx build api
  ```

### Testing

- **Run all tests**

  ```bash
  npx nx run-many --target=test --all
  ```

- **Run tests for specific project**

  ```bash
  # Frontend apps
  npx nx test web-admin
  npx nx test web-partner
  npx nx test web-customer

  # Backend
  npx nx test api
  ```

- **Run tests in watch mode**

  ```bash
  # Example for admin app
  npx nx test web-admin --watch
  ```

### Linting

- **Lint all projects**

  ```bash
  npx nx run-many --target=lint --all
  ```

- **Fix linting issues**

  ```bash
  npx nx run-many --target=lint --all --fix
  ```

## 🏗️ Project Structure Details

### Libraries

- **server/**: Backend libraries, separated by feature or concern (e.g., `core`, `data-access`, `features`, `salon`).
- **shared/**: Isomorphic libraries shared between frontend and backend (e.g., DTOs, interfaces, utilities).
- **web/**: Frontend libraries, organized by scope (e.g., `core`, `config`, `ui`) and application-specific features (e.g., `admin/auth`).

#### Library documentation

- Overview of libraries: [libs/README.md](libs/README.md)

- Server:
  - [libs/server/core/README.md](libs/server/core/README.md)
  - [libs/server/data-access/README.md](libs/server/data-access/README.md)
  - [libs/server/features/README.md](libs/server/features/README.md)
  - Features:
    - [libs/server/features/appointment/README.md](libs/server/features/appointment/README.md)
    - [libs/server/features/dashboard/README.md](libs/server/features/dashboard/README.md)
    - [libs/server/features/portfolio/README.md](libs/server/features/portfolio/README.md)
    - [libs/server/features/review/README.md](libs/server/features/review/README.md)
    - [libs/server/features/salon/README.md](libs/server/features/salon/README.md)
    - [libs/server/features/salon-staff-request/README.md](libs/server/features/salon-staff-request/README.md)
    - [libs/server/features/social/README.md](libs/server/features/social/README.md)
    - [libs/server/features/theme/README.md](libs/server/features/theme/README.md)
    - [libs/server/features/user/README.md](libs/server/features/user/README.md)

- Shared:
  - [libs/shared/README.md](libs/shared/README.md)

- Web Core:
  - [libs/web/core/auth/README.md](libs/web/core/auth/README.md)
  - [libs/web/core/http/README.md](libs/web/core/http/README.md)
  - [libs/web/core/testing/README.md](libs/web/core/testing/README.md)

- Web App-specific:
  - [libs/web/admin/auth/README.md](libs/web/admin/auth/README.md)
  - [libs/web/customer/auth/README.md](libs/web/customer/auth/README.md)
  - [libs/web/partner/auth/README.md](libs/web/partner/auth/README.md)

## 🔧 Tools

- **Nx**: Monorepo build system with powerful project graph
- **Angular**: Frontend framework
- **NestJS**: Backend framework
- **Prisma**: Database ORM
- **Jest**: Testing framework
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Tailwind CSS**: Utility-first CSS framework

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Development Workflow

### Branch Naming

Use the following format for branch names:

```text
<type>/<ticket-number>-<short-description>
```

Types:

- `feat/`: New features
- `fix/`: Bug fixes
- `chore/`: Maintenance tasks
- `docs/`: Documentation updates
- `test/`: Adding missing tests
- `refactor/`: Code refactoring
- `style/`: Code style changes

Example:

```text
feat/123-add-user-profile
```

### Commit Messages

Follow Conventional Commits specification:

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Example:

```text
feat(auth): add password reset functionality

- Add password reset endpoint
- Implement email service
- Add validation

Closes #123
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Run tests and linters
4. Push your branch and create a PR
5. Request review from at least one team member
6. Address review comments
7. Squash and merge when approved

## Code Style

### TypeScript/JavaScript

- Use 4 spaces for indentation
- Use single quotes
- Always use semicolons
- Maximum line length: 100 characters
- Sort imports alphabetically

### Styling

This workspace uses a hybrid styling approach that combines **Tailwind CSS** for utility-first styling and standard **SCSS** for component-specific styles.

- **Shared Configuration**: The core Tailwind CSS and PostCSS configurations are located in `libs/web/config`. This ensures a consistent setup across all frontend applications.
- **Global Styles**: A global stylesheet at `libs/web/config/src/styles/styles.css` imports the necessary Tailwind utilities. This file is included in the `build` configuration of each web application in its respective `project.json`.
- **Custom Prefix**: To avoid conflicts with other libraries like Angular Material, all Tailwind utility classes are prefixed with `twc-`. For example, use `twc-flex` instead of `flex`.
- **Preflight Disabled**: Tailwind's `preflight` (a CSS reset) is disabled to prevent overriding the default styles of Angular Material components.

#### Usage Examples

Here are some examples of how to use the `twc-` prefixed utility classes in your HTML templates:

**Flexbox Layout:**

```html
<div class="twc-flex twc-justify-center twc-items-center twc-h-screen">
  <div class="twc-w-1/2 twc-p-4">
    <!-- Content goes here -->
  </div>
</div>
```

**Grid Layout:**

```html
<div class="twc-grid twc-grid-cols-3 twc-gap-4">
  <div class="twc-bg-blue-200 twc-p-4">Item 1</div>
  <div class="twc-bg-blue-200 twc-p-4">Item 2</div>
  <div class="twc-bg-blue-200 twc-p-4">Item 3</div>
</div>
```

- Use CSS Modules for component styles
- Follow BEM naming convention
- Use CSS custom properties for theming
- Mobile-first approach

## API Development

### Guidelines

- Follow RESTful principles
- Use proper HTTP methods
- Use proper HTTP status codes
- Version your API
- Document with OpenAPI/Swagger

### Request/Response Format

```typescript
// Request
{
  "data": {
    // request data
  },
  "meta": {
    // pagination, filters, etc.
  }
}

// Response
{
  "data": {
    // response data
  },
  "meta": {
    // metadata
  },
  "errors": [
    // error details
  ]
}
```

## Database

### Migrations

- Create migrations for schema changes
- Keep migrations small and focused
- Test migrations before deployment
- Document breaking changes

### Querying

- Use the repository pattern
- Use transactions for multiple operations
- Optimize queries with proper indexes
- Avoid N+1 queries

## CI/CD

### Pipeline

- Lint and type check on every push
- Run tests on pull requests
- Build and deploy on merge to main
- Run security scans

### Environments

- `development`: Local development
- `staging`: Pre-production testing
- `production`: Live environment

## Monitoring and Logging

### Logging

- Use structured logging
- Include correlation IDs
- Log at appropriate levels (DEBUG, INFO, WARN, ERROR)
- Do not log sensitive information

### Monitoring

- Set up health checks
- Monitor error rates
- Track performance metrics
- Set up alerts for critical issues

## Documentation

### Code Documentation

- Document public APIs
- Include examples in JSDoc
- Keep documentation up to date
- Document design decisions

### Project Documentation

- Keep README.md updated
- Document architecture decisions
- Maintain API documentation
- Keep setup instructions current

## Troubleshooting

### Common Issues

1. **Dependency issues**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm cache clean --force`
   - Reinstall dependencies with `npm install`

2. **Database connection issues**
   - Verify Docker is running
   - Check database credentials in `.env`
   - Try restarting containers with `docker-compose restart`

3. **Tests failing**
   - Run tests with `--watch` flag
   - Check for flaky tests
   - Update snapshots if needed
