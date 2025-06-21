# AI Course Designer - Playwright Tests

This directory contains automated UI tests for the AI Course Designer application using Playwright.

## Test Structure

```
tests/
├── e2e/
│   ├── course-creation-flow.spec.ts  # Comprehensive end-to-end tests
│   └── smoke-test.spec.ts            # Quick smoke tests for CI/CD
└── helpers/
    └── test-data.ts                  # Shared test data and utilities
```

## Running Tests

### Prerequisites

1. Ensure the application is running or the dev server will be started automatically:
   ```bash
   npm run dev
   ```

2. Install Playwright browsers (first time only):
   ```bash
   npx playwright install
   ```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI mode (recommended for development)
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# Run specific test file
npx playwright test tests/e2e/smoke-test.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium

# View test report
npm run test:report
```

## Test Scenarios

### Smoke Tests (`smoke-test.spec.ts`)
- **Application loads**: Verifies basic UI elements are present
- **Quick course generation**: Tests outline generation with minimal configuration
- **API health check**: Ensures all API endpoints are responding
- **Local storage persistence**: Verifies data persists across page reloads

### Full E2E Tests (`course-creation-flow.spec.ts`)
- **Complete course creation flow**: Tests the entire user journey from prompt to course viewing
- **Image generation verification**: Ensures images load correctly
- **Navigation testing**: Verifies slide and module navigation
- **Quiz functionality**: Tests quiz interaction and scoring
- **Saved courses**: Tests loading and managing saved courses
- **Error handling**: Verifies proper error states
- **Performance tests**: Ensures course generation completes within acceptable time

## Configuration

The Playwright configuration (`playwright.config.ts`) includes:
- Automatic dev server startup
- Multiple browser testing (Chrome, Firefox, Safari)
- Screenshots and videos on failure
- HTML reporter for test results
- Parallel test execution

## Tips for Writing New Tests

1. Use the helper functions and constants from `test-data.ts`
2. Always use proper timeouts for async operations
3. Use `test.step()` to organize complex test scenarios
4. Prefer role-based selectors over CSS selectors
5. Add explicit waits for API calls and image loading

## CI/CD Integration

For CI/CD pipelines, use the smoke tests for quick validation:

```bash
# Quick CI test
npx playwright test tests/e2e/smoke-test.spec.ts --project=chromium

# Full test suite
npm test
```

## Troubleshooting

- **Tests timing out**: Increase timeouts in `test-data.ts`
- **Image loading issues**: Check `SKIP_IMAGE_GENERATION` in `.env.local`
- **API errors**: Ensure `OPENAI_API_KEY` is properly configured
- **Port conflicts**: Change port in `playwright.config.ts` if 3000 is in use 