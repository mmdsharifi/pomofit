## Testing

Pomofit uses a comprehensive testing strategy to ensure code quality and reliability:

### Unit and Integration Tests

We use Jest and React Testing Library for unit and integration tests:

\`\`\`bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
\`\`\`

### End-to-End Tests

We use Cypress for end-to-end testing:

\`\`\`bash
# Open Cypress test runner
npm run cypress

# Run Cypress tests headlessly
npm run cypress:headless

# Run E2E tests with app running
npm run e2e
\`\`\`

### Continuous Integration

Tests are automatically run on every push and pull request using GitHub Actions. The workflow includes:

- Linting
- Unit and integration tests
- End-to-end tests
- Coverage reporting

See the [TESTING.md](./TESTING.md) file for more details on our testing strategy and best practices.
