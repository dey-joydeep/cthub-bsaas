# Libraries

This directory contains reusable libraries used across the Beauty SaaS platform. Path aliases match the workspace configuration in `tsconfig.base.json`.

Note: This file provides an overview. Individual libraries include their own README with details (purpose, usage, testing) and link back here.

## Available Libraries (aliases)

- `@cthub-bsaas/shared` – Shared utilities, types, enums, and constants
- `@cthub-bsaas/server-core` – Backend core modules (NestJS)
- `@cthub-bsaas/server-data-access` – Backend data-access layer (ORM, repositories)
- `@cthub-bsaas/web-admin-auth` – Admin app authentication utilities
- `@cthub-bsaas/web-core-auth` – Web core auth services/guards
- `@cthub-bsaas/web-core-http` – Web core HTTP abstractions/interceptors
- `@cthub-bsaas/web-core-testing` – Web testing utilities
- `@cthub-bsaas/web-customer-auth` – Customer app authentication utilities
- `@cthub-bsaas/web-partner-auth` – Partner app authentication utilities

## Adding a New File to a Shared Library

### 1. Create Your New File

Add your new file in the appropriate directory, for example:

```text
libs/shared/src/types/new-type.ts
```

### 2. Update the Barrel Export (Index File)

Add an export to the relevant index file. For example, if you added a new type:

```typescript
// libs/shared/src/types/index.ts
export * from './user.types.js';
export * from './new-type.js'; // Add your new file
```

### 3. Build a library (Nx)

```bash
# Example: build shared library
npx nx build shared
```

### 4. Use your new export

Import your new file in your application:

```typescript
// Import from the barrel export (recommended)
import { NewType } from '@cthub-bsaas/shared/types';

// Or import directly from the main index
import { NewType } from '@cthub-bsaas/shared';
```

## Example: Adding a new enum

1. Create the enum file:

```typescript
// libs/shared/src/enums/payment-status.enum.ts
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}
```

1. Update the enums index:

```typescript
// libs/shared/src/enums/index.ts
export * from './appointment-status.enum.js';
export * from './payment-status.enum.js'; // Add this line
```

1. Build the shared library (see step 3 above)

1. Import in your application:

```typescript
import { PaymentStatus } from '@cthub-bsaas/shared/enums';
```

## Best Practices

- Keep shared code generic and reusable
- Add appropriate TypeScript types and interfaces
- Document your code with JSDoc comments
- Write unit tests for shared utilities
- Keep the public API surface minimal and focused

## Development

To rebuild the shared library automatically during development:

```bash
# Run in watch mode
cd libs/shared
npx tsc -p tsconfig.lib.json --watch
```

## Versioning

Shared libraries follow [Semantic Versioning](https://semver.org/). Update the version in the respective `package.json` file when making changes.

## License

This project is licensed under the terms of the MIT license.
