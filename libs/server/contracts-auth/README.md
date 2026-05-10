# Server Contracts Auth

This library contains the data contracts (ports and DI tokens) for the authentication-related features of the server-side application. It was generated with [Nx](https://nx.dev).

## Purpose

The primary purpose of this library is to enforce the Dependency Inversion Principle and break circular dependencies between feature libraries (e.g., `server-features-auth`) and infrastructure libraries (e.g., `server-infrastructure`).

-   **Feature libraries** depend on the contracts (ports) defined here.
-   **Infrastructure libraries** provide the concrete implementations for these contracts.
-   The main application module (`app.module.ts`) is responsible for wiring up the implementations with the contracts.

## Contents

This library includes:

-   `TotpPort`: The port (interface) for the Time-based One-Time Password (TOTP) service.
-   `TOTP_PORT`: The dependency injection token for the `TotpPort`.

## Building and Testing

Run `nx build server-contracts-auth` to build the library.

Run `nx test server-contracts-auth` to execute the unit tests via [Jest](https://jestjs.io).

Run `nx lint server-contracts-auth` to execute the linter via [ESLint](https://eslint.org/).
