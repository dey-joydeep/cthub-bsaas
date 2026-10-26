# Frontend Quality Standards

## TypeScript

- Enable strict mode
- Use interfaces for public API definitions
- Use types for internal type definitions
- Avoid `any` type
- Use `unknown` instead of `any` when type is unknown
- Use `readonly` for immutable properties
- Use `const` assertions where appropriate

## Storage Service

### Implementation Standards

- **SSR Compatibility**:
  - Always use `PlatformUtils` for browser storage access
  - Handle cases where storage might not be available (SSR, private browsing)
  - Provide fallback behavior for server-side rendering

- **Type Safety**:
  - Use generics for type-safe storage operations
  - Validate stored data on retrieval
  - Handle serialization/deserialization consistently

- **Error Handling**:
  - Gracefully handle storage quota exceeded errors
  - Log storage failures appropriately
  - Provide meaningful error messages for debugging

- **Performance**:
  - Minimize direct storage access
  - Consider in-memory caching for frequently accessed data
  - Batch storage operations when possible

## Component Architecture

### Components

- Smart vs Presentational component separation
- Proper use of lifecycle hooks
- Clean template syntax
- Single responsibility principle
- Proper use of `@Input()` and `@Output()`
- No direct DOM manipulation

### State Management

- Minimal local state
- Immutable state updates
- Proper state organization
- Use of appropriate state management solution
- No direct state mutation

## Performance

### Frontend Optimization

- Lazy load non-critical components
- Optimize images and assets
- Implement proper caching strategies
- Minimize main thread work
- Use code splitting
- Bundle size monitoring

### Web Vitals

- LCP: < 2.5s
- FID: < 100ms
- CLS: < 0.1
- TTI: < 3.8s
- TBT: < 200ms

## Testing

### Unit Testing

- Write tests for all business logic
- Follow AAA pattern (Arrange, Act, Assert)
- Test edge cases and error conditions
- Mock external dependencies
- Aim for 80%+ code coverage

### Integration Testing

- Test component interactions
- Test API integrations
- Test routing and navigation
- Test form validations

### E2E Testing

- Test critical user journeys
- Use realistic test data
- Test across different browsers and devices
- Include accessibility testing

## Accessibility

- Semantic HTML
- Keyboard navigation
- ARIA attributes
- Color contrast
- Screen reader support
- Focus management

## Security

- Input validation
- XSS protection
- CSRF protection
- Secure HTTP headers
- Content Security Policy (CSP)
- Sanitize user inputs

## Browser Compatibility

- Latest Chrome, Firefox, Safari, Edge
- Mobile browsers (Chrome for Android, Safari for iOS)
- Progressive enhancement
- Feature detection
- Polyfills when necessary
