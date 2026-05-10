# Server-Side Rendering (SSR) Setup

## Overview
This document explains how to enable and use Server-Side Rendering (SSR) in the Beauty SaaS frontend application.

## Current Status
- SSR is pre-configured but disabled by default
- The application currently runs in client-side rendering (CSR) mode
- All necessary SSR files and configurations are in place

## Enabling SSR

### 1. Add Build Scripts
Add these scripts to `package.json` in the project root:

```json
"scripts": {
  "dev:ssr:admin": "nx serve-ssr admin",
  "dev:ssr:partner": "nx serve-ssr partner",
  "dev:ssr:customer": "nx serve-ssr customer",
  "serve:ssr:admin": "node dist/apps/web/admin/server/server.mjs",
  "serve:ssr:partner": "node dist/apps/web/partner/server/server.mjs",
  "serve:ssr:customer": "node dist/apps/web/customer/server/server.mjs",
  "build:ssr:admin": "nx build admin && nx build admin --configuration=production && nx server admin --configuration=production",
  "build:ssr:partner": "nx build partner && nx build partner --configuration=production && nx server partner --configuration=production",
  "build:ssr:customer": "nx build customer && nx build customer --configuration=production && nx server customer --configuration=production",
  "prerender:admin": "nx prerender admin",
  "prerender:partner": "nx prerender partner",
  "prerender:customer": "nx prerender customer"
}
```

### 2. Build and Serve with SSR

#### Development Mode
```bash
npm run dev:ssr
```

#### Production Build
```bash
# Build the application with SSR
npm run build:ssr

# Start the SSR server
npm run serve:ssr
```

### 3. Prerendering (Optional)
For better performance, you can pre-render specific routes:
```bash
npm run prerender
```

## Key Files
- `apps/web/[app-name]/src/main.server.ts` - Server entry point
- `apps/web/[app-name]/src/app/app.config.server.ts` - Server configuration
- `apps/web/[app-name]/tsconfig.server.json` - TypeScript config for server
- `apps/web/[app-name]/server.ts` - Express server implementation

## Notes
- SSR requires Node.js server environment
- Ensure all browser-specific APIs are properly guarded
- Test thoroughly after enabling SSR as some client-side code may need adjustments
