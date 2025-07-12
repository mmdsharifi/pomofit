# Testing Strategy for Pomofit

This document outlines the testing strategy for the Pomofit application, including the types of tests, how to run them, and best practices for writing new tests.

## Testing Approach

Pomofit follows a Test-Driven Development (TDD) approach, which means:

1. Write tests before implementing features
2. Run tests to ensure they fail (red)
3. Implement the minimum code needed to make tests pass (green)
4. Refactor code while keeping tests passing
5. Repeat

## Types of Tests

### Unit Tests

Unit tests verify that individual units of code (functions, hooks, components) work as expected in isolation.

- **Location**: `__tests__/hooks/`, `__tests__/utils/`, `__tests__/components/`
- **Tools**: Jest, React Testing Library
- **Command**: `npm run test`

### Integration Tests

Integration tests verify that multiple units work together correctly.

- **Location**: `__tests__/integration/`
- **Tools**: Jest, React Testing Library
- **Command**: `npm run test`

### End-to-End (E2E) Tests

E2E tests verify that the application works correctly from a user's perspective, testing complete user flows.

- **Location**: `cypress/e2e/`
- **Tools**: Cypress
- **Command**: `npm run e2e` or `npm run e2e:headless`

## Running Tests

### During Development

```bash
# Run tests in watch mode
npm run test:watch

# Run specific tests
npm run test -- -t "test name pattern"

# Run E2E tests
npm run e2e
