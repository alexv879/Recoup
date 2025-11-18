# Recoup Testing Guide

Comprehensive testing documentation for the Recoup application.

## Table of Contents

1. [Overview](#overview)
2. [Test Structure](#test-structure)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Test Coverage](#test-coverage)
6. [CI/CD Integration](#cicd-integration)

---

## Overview

Recoup uses **Jest** with **ts-jest** for testing. We follow a three-tier testing strategy:

1. **Unit Tests** - Test individual functions and components in isolation
2. **Integration Tests** - Test API routes, webhooks, and service interactions
3. **End-to-End Tests** - Test complete user journeys

### Coverage Requirements

- **Overall**: 80% coverage minimum
- **Critical paths**: 90% coverage minimum
  - Payment service (`services/paymentService.ts`)
  - Escalation logic (`lib/escalation-decision.ts`)
  - Stripe webhook (`app/api/webhook/stripe/route.ts`)

---

## Test Structure

```
__tests__/
├── unit/                    # Unit tests
│   ├── lib/                 # Library function tests
│   │   └── escalation-decision.test.ts
│   ├── services/            # Service layer tests
│   │   └── paymentService.test.ts
│   └── utils/               # Utility function tests
│
├── integration/             # Integration tests
│   ├── webhooks/            # Webhook handler tests
│   │   ├── stripe.test.ts
│   │   ├── sendgrid.test.ts
│   │   └── twilio.test.ts
│   └── api/                 # API route tests
│
├── e2e/                     # End-to-end tests
│   ├── payment-flow.test.ts
│   └── escalation-flow.test.ts
│
└── utils/                   # Test utilities
    └── testHelpers.ts       # Mock factories and utilities
```

---

## Running Tests

### All Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode (development)
npm run test:watch
```

### Test Subsets

```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# CI mode (optimized for CI/CD)
npm run test:ci
```

### Specific Tests

```bash
# Run tests matching pattern
npm test -- paymentService

# Run single test file
npm test -- __tests__/unit/services/paymentService.test.ts

# Run tests in specific describe block
npm test -- -t "createPaymentConfirmation"
```

---

## Writing Tests

### Unit Test Example

```typescript
// __tests__/unit/lib/myFunction.test.ts
import { myFunction } from '@/lib/myFunction'

describe('myFunction', () => {
  it('should return expected result', () => {
    const result = myFunction(input)
    expect(result).toBe(expected)
  })

  it('should throw error for invalid input', () => {
    expect(() => myFunction(invalidInput)).toThrow('Error message')
  })
})
```

### Integration Test Example

```typescript
// __tests__/integration/api/myRoute.test.ts
import { POST } from '@/app/api/my-route/route'
import { mockNextRequest } from '../../utils/testHelpers'

describe('POST /api/my-route', () => {
  it('should process request successfully', async () => {
    const request = mockNextRequest('POST', '/api/my-route', {
      body: { data: 'test' },
    })

    const response = await POST(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data).toMatchObject({ success: true })
  })
})
```

### E2E Test Example

```typescript
// __tests__/e2e/user-journey.test.ts
describe('Complete User Journey', () => {
  it('should complete payment flow', async () => {
    // 1. Create invoice
    const invoice = await createTestInvoice()

    // 2. Initiate payment
    const confirmation = await initiatePayment(invoice.id)

    // 3. Client confirms
    await clientConfirmsPayment(confirmation.token)

    // 4. Freelancer verifies
    const transaction = await freelancerVerifies(confirmation.id)

    // 5. Verify commission calculated correctly
    expect(transaction.recoupCommission).toBe(3000) // 3%
  })
})
```

---

## Test Utilities

### Mock Helpers

Located in `__tests__/utils/testHelpers.ts`:

```typescript
// Firebase mocks
mockFirebaseTimestamp()
mockInvoice()
mockUser()
mockPaymentConfirmation()

// Stripe mocks
mockStripeEvent()
mockStripeCheckoutSession()
mockStripeSubscription()

// SendGrid mocks
mockSendGridEvent()

// Twilio mocks
mockTwilioSmsResponse()
mockTwilioVoiceResponse()

// Request mocks
mockRequest()
mockNextRequest()

// Database mocks
createMockFirestoreDoc()
createMockFirestoreQuerySnapshot()

// Error simulation
simulateStripeError()
simulateFirebaseError()
simulateNetworkError()
```

### Using Mocks

```typescript
import { mockInvoice, mockUser } from '../../utils/testHelpers'

describe('My Test', () => {
  it('should work with mock data', () => {
    const invoice = mockInvoice({
      amount: 100000,
      status: 'unpaid',
    })

    const user = mockUser({
      id: 'user_123',
    })

    // Your test logic
  })
})
```

---

## Test Coverage

### Viewing Coverage Reports

```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/lcov-report/index.html
```

### Coverage Configuration

Coverage thresholds are defined in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    statements: 80,
    branches: 70,
    functions: 80,
    lines: 80,
  },
  // Critical paths require higher coverage
  './lib/escalation-decision.ts': {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90,
  },
}
```

### Improving Coverage

1. **Identify gaps**: Check coverage report for uncovered lines
2. **Add tests**: Focus on critical paths first
3. **Test edge cases**: Empty inputs, null values, errors
4. **Test happy path**: Normal execution flow
5. **Test error handling**: All error scenarios

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Every push to `main`, `develop`, `claude/**` branches
- Every pull request
- Scheduled daily at 2 AM UTC

### Workflow Steps

1. **Lint & Type Check** - Verify code quality
2. **Unit Tests** - Fast, isolated tests
3. **Integration Tests** - API and service tests
4. **Coverage Check** - Ensure ≥80% coverage
5. **E2E Tests** - Critical user journeys
6. **Coverage Upload** - Send to Codecov

### Test Workflow File

`.github/workflows/test.yml`

---

## Best Practices

### 1. Test Naming

```typescript
// ❌ Bad
it('test 1', () => {})

// ✅ Good
it('should create payment confirmation with correct expiry date', () => {})
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should calculate commission correctly', () => {
  // Arrange
  const amount = 100000

  // Act
  const commission = calculateCommission(amount)

  // Assert
  expect(commission).toBe(3000)
})
```

### 3. Test One Thing

```typescript
// ❌ Bad - Testing multiple things
it('should create user and send email', () => {
  const user = createUser()
  expect(user).toBeDefined()
  expect(sendEmail).toHaveBeenCalled()
})

// ✅ Good - Separate tests
it('should create user', () => {
  const user = createUser()
  expect(user).toBeDefined()
})

it('should send welcome email after user creation', () => {
  createUser()
  expect(sendEmail).toHaveBeenCalled()
})
```

### 4. Don't Test Implementation Details

```typescript
// ❌ Bad - Testing internal state
it('should set isProcessing to true', () => {
  expect(component.isProcessing).toBe(true)
})

// ✅ Good - Testing behavior
it('should show loading spinner while processing', () => {
  expect(screen.getByRole('status')).toBeInTheDocument()
})
```

### 5. Use Descriptive Test Data

```typescript
// ❌ Bad
const invoice = mockInvoice({ amount: 123 })

// ✅ Good
const INVOICE_AMOUNT_GBP_1000 = 100000 // £1000 in pence
const invoice = mockInvoice({ amount: INVOICE_AMOUNT_GBP_1000 })
```

---

## Debugging Tests

### Debug Single Test

```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest __tests__/unit/myTest.test.ts

# Then attach debugger in VS Code
```

### VS Code Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${relativeFile}", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Troubleshooting

#### Tests Timing Out

```typescript
// Increase timeout for slow tests
it('should process large dataset', async () => {
  // ...
}, 15000) // 15 second timeout
```

#### Mock Not Working

```typescript
// Ensure mocks are cleared between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

#### TypeScript Errors

```bash
# Rebuild TypeScript
npm run build

# Check tsconfig.json is correct
```

---

## Performance Testing

### Load Tests

Located in `tests/load/`:

```bash
# Install Artillery
npm install -g artillery

# Run basic load test
artillery run tests/load/basic-load-test.yml

# Run stress test
artillery run tests/load/stress-test.yml
```

### Test Against Staging

```bash
TARGET_URL=https://staging.recoup.app \
  artillery run tests/load/basic-load-test.yml
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Artillery Load Testing](https://www.artillery.io/docs)

---

**Last Updated**: 2024-01-15
**Maintained By**: Engineering Team
