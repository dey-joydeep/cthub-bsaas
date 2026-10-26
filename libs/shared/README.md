# Shared Library

Purpose: Isomorphic types, utilities, and constants shared across backend and frontend.

See overview: [libs/README.md](../README.md)

This library contains shared code used across the Beauty SaaS application, including:

- **Models**: Shared TypeScript interfaces and types
- **Utils**: Reusable utility functions
- **Constants**: Application-wide constants

## Installation

This library is automatically included in the Nx workspace and can be imported using the `@cthub-bsaas/shared` alias.

## Usage

### Importing from the shared library

```typescript
// Import models
import { User, UserRole, ApiResponse } from '@cthub-bsaas/shared';

// Import utilities
import { formatDate, debounce } from '@cthub-bsaas/shared';

// Import constants
import { API_BASE_URL, HTTP_STATUS } from '@cthub-bsaas/shared';
```

### Available Exports

#### Models

- `User`: Base user interface
- `UserRole`: Union type for user roles
- `ApiResponse`: Standard API response wrapper
- `PaginationMeta`: Pagination metadata
- `PaginatedResponse`: Standard paginated response
- `BaseEntity`: Base interface for all entities

#### Utils

- `formatDate`: Format dates consistently
- `debounce`: Debounce function calls
- `generateId`: Generate unique IDs
- `isBrowser`: Check if running in a browser
- `isServer`: Check if running on a server

#### Constants

- `API_BASE_URL`: Base URL for API requests
- `HTTP_STATUS`: Common HTTP status codes
- `ERROR_MESSAGES`: Common error messages
- `DATE_FORMATS`: Standard date formats
- `VALIDATION_PATTERNS`: Common regex patterns
- `PAGINATION_DEFAULTS`: Default pagination values

## Development

### Building the Library

```bash
npx nx build shared
```

### Running Tests

```bash
npx nx test shared
```

### Linting

```bash
npx nx lint shared
```

## Adding New Code

1. **Models**: Add new interfaces to `src/lib/models/index.ts`
2. **Utils**: Add new utility functions to `src/lib/utils/index.ts`
3. **Constants**: Add new constants to `src/lib/constants/index.ts`

## Best Practices

- Keep the shared library minimal and focused
- Only add code that is used in multiple places
- Document all public APIs
- Write tests for all new functionality
- Follow TypeScript best practices
