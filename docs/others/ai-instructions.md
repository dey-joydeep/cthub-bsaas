# AI Development Guidelines and Progress Tracking

## AI Development Standards

### Code Implementation

- Use PostgreSQL and/or MongoDB for production logic (no demo/in-memory data in production)
- Place interfaces in a dedicated 'models' folder, with each interface in a separate file
- Demo data is only allowed in test/mocks
- For any function parameter of object type with 3 or more properties, define a named type or interface
- Follow project-wide naming conventions:
  - Table names: TitleCase for Prisma Model, snake_case for DB (@@map)
  - Column names: camelCase for model/interface member, snake_case for DB (@map)
  - TypeScript code (interfaces, services, tests) must use camelCase for model members
  - Use 2 spaces for indentation (TypeScript/JavaScript)
  - Use single quotes for strings
  - Always use semicolons
  - Maximum line length: 100 characters

## Development Workflow

### Frontend Development

1. **Implementation**
   - Implement frontend components following Angular Style Guide
   - Ensure proper component composition
   - Separate smart and presentational components
   - Follow single responsibility principle
   - Maximum file length: 400 lines
   - Maximum function length: 50 lines

2. **Quality Checks**
   - Run linting checks (ESLint)
   - Verify compilation (TypeScript)
   - Ensure no console.log in production code
   - Check for accessibility compliance

3. **Testing**
   - Write unit tests (Jest/Karma)
   - Write integration tests
   - Perform edge case testing
   - Test across different browsers and devices
   - Aim for 80%+ code coverage

### Backend Development

1. **Implementation**
   - Implement backend services
   - Follow SOLID principles
   - Write self-documenting code
   - Keep functions small and focused (max 20 lines)
   - Use meaningful names for variables, functions, and classes

2. **Quality Checks**
   - Run linting checks
   - Verify compilation
   - Check for security vulnerabilities
   - Ensure proper error handling

3. **Testing**
   - Write unit tests
   - Test API endpoints
   - Test database interactions
   - Test third-party service integrations
   - Use test databases (never production data)

### Performance Standards

- **Core Web Vitals**
  - LCP: < 2.5s
  - FID: < 100ms
  - CLS: < 0.1
  - TTI: < 3.8s
  - TBT: < 200ms

- **Optimization**
  - Lazy load non-critical modules
  - Optimize images and assets
  - Implement proper caching strategies
  - Minimize main thread work

## Module Implementation Standards

### Core Module Structure

Each module should follow this standardized structure:

```text
module-name/
├── controllers/       # Route handlers
├── services/          # Business logic
├── models/            # Data models and interfaces
├── dtos/              # Data Transfer Objects
├── interfaces/        # TypeScript interfaces
├── constants/         # Module-specific constants
├── validators/        # Request validation
├── tests/             # Test files
│   ├── unit/          # Unit tests
│   ├── integration/   # Integration tests
│   └── e2e/           # End-to-end tests
└── index.ts           # Public API exports
```

### Standard CRUD Operations

Each entity should implement:

1. **Basic Operations**
   - `getAll`: List with pagination, filtering, sorting
   - `getById`: Get single item by ID
   - `create`: Create new item with validation
   - `update`: Update existing item
   - `delete`: Remove item with proper cleanup

2. **Common Service Methods**
   - `validate[Entity]Data`: Input validation
   - `normalize[Entity]Output`: Standardize response format
   - `check[Entity]Permissions`: Authorization checks
   - `search[Entities]`: Advanced search capabilities

### Data Handling

1. **Input/Output**
   - Use DTOs for all API requests/responses
   - Implement proper input validation
   - Normalize output data structures
   - Handle data transformation consistently

2. **Database Operations**
   - Use transactions for multi-step operations
   - Implement proper error handling
   - Include audit logging
   - Support soft deletes where appropriate

### API Standards

1. **Endpoints**
   - Follow RESTful conventions
   - Use proper HTTP methods and status codes
   - Implement consistent error responses
   - Include rate limiting and request validation

2. **Documentation**
   - Document all endpoints
   - Include request/response examples
   - Document error scenarios
   - Keep API versioning in mind

### Testing Requirements

1. **Test Coverage**
   - Unit tests for all services and utilities
   - Integration tests for API endpoints
   - E2E tests for critical user journeys
   - 80%+ code coverage minimum

2. **Test Data**
   - Use factories for test data generation
   - Clean up test data after tests
   - Test both success and error cases
   - Include edge case scenarios

### Progress Tracking

Track implementation status using this checklist for each module:

- [ ] **Core Functionality**
  - [ ] Basic CRUD operations
  - [ ] Input validation
  - [ ] Output normalization
  - [ ] Error handling

- [ ] **API Layer**
  - [ ] RESTful endpoints
  - [ ] Request validation
  - [ ] Authentication/Authorization
  - [ ] Rate limiting

- [ ] **Testing**
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests
  - [ ] Test coverage report

- [ ] **Documentation**
  - [ ] API documentation
  - [ ] Code comments
  - [ ] Usage examples
  - [ ] Error handling guide

## Development Best Practices

### Code Generation & Review

1. **Code Quality**
   - Always review generated code before committing
   - Ensure compliance with project standards
   - Follow consistent code style (Prettier/ESLint)
   - Use meaningful variable and function names
   - Keep functions focused and single-purpose

2. **Type Safety**
   - Use proper TypeScript types (no `any` without justification)
   - Define interfaces for complex data structures
   - Use enums for fixed sets of values
   - Leverage TypeScript's type inference

3. **Error Handling**
   - Implement proper error boundaries
   - Use custom error classes
   - Include meaningful error messages
   - Log errors with sufficient context

4. **Documentation**
   - Document complex logic with comments
   - Use JSDoc for public APIs
   - Keep README files up to date
   - Document architectural decisions

### Security Best Practices

1. **Data Protection**
   - Validate all inputs (client and server-side)
   - Sanitize outputs to prevent XSS
   - Encrypt sensitive data at rest and in transit
   - Implement proper session management

2. **Access Control**
   - Implement proper authentication/authorization
   - Follow least privilege principle
   - Use role-based access control (RBAC)
   - Implement rate limiting and request throttling

3. **Secure Development**
   - Keep dependencies updated
   - Use environment variables for configuration
   - No sensitive data in code or version control
   - Regular security audits and penetration testing

4. **Compliance**
   - Follow OWASP Top 10
   - Implement CORS policies
   - Use secure headers (CSP, HSTS, etc.)
   - Regular security training for developers

### Testing Strategy

1. **Test Types**
   - Unit tests for individual components
   - Integration tests for module interactions
   - E2E tests for critical user journeys
   - Performance and load testing

2. **Test Quality**
   - Test both happy and error paths
   - Cover edge cases and boundary conditions
   - Ensure test isolation and repeatability
   - Maintain test data consistency

3. **Test Implementation**
   - Use proper mocking for external dependencies
   - Implement test factories for data generation
   - Include accessibility testing
   - Document test cases and scenarios

4. **Test Maintenance**
   - Track test coverage (aim for 80%+)
   - Regularly update tests with code changes
   - Monitor test execution time
   - Automate test execution in CI/CD

### Security Implementation

- Never hardcode sensitive information
- Validate all inputs
- Sanitize outputs
- Follow least privilege principle
- Keep dependencies updated
- Implement CSRF protection
- Use secure headers
- Implement rate limiting
- Regular security audits
- Follow OWASP guidelines

### Performance Optimization

- Optimize database queries
- Use proper indexing
- Implement caching where appropriate
- Monitor resource usage
- Profile and optimize hot paths
- Minimize main thread work
- Optimize asset delivery
- Implement code splitting
- Use efficient data structures
- Regular performance audits

## Maintenance & Documentation

### Documentation Standards

- Keep all documentation updated with progress
- Document architectural decisions
- Maintain API documentation
- Keep README files current
- Document deployment procedures

### Version Control

- Write clear, concise commit messages
- Follow feature branch workflow
- Create pull requests for code review
- Use meaningful branch names
- Keep commits atomic

### CI/CD

- Automate testing
- Automate deployment
- Monitor build status
- Track deployment health
- Implement rollback procedures

### Monitoring

- Set up error tracking
- Monitor performance metrics
- Track user behavior
- Set up alerts
- Regular health checks

## Version History

- 2025-07-16: Initial version created from AI_PROGRESS_TRACKER.md
- 2025-07-16: Merged content from QUALITY_STANDARDS.md and development checklists
- 2025-07-16: Fixed markdown linting issues
