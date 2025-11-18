# Testing Guide

## Overview

Recoup uses **Jest** with **ts-jest** for unit and integration testing. All tests are written in TypeScript and follow best practices for testing Node.js/Next.js applications.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode (for development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm test -- --coverage
```

### Run a specific test file
```bash
npm test -- helpers.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="encrypt"
```

## Test Structure

Tests are organized alongside the code they test in `__tests__` directories:

```
recoup/
├── utils/
│   ├── __tests__/
│   │   └── helpers.test.ts     # Tests for utils/helpers.ts
│   └── helpers.ts
├── services/
│   ├── __tests__/
│   │   ├── paymentService.test.ts
│   │   └── invoiceService.test.ts
│   ├── paymentService.ts
│   └── invoiceService.ts
└── __tests__/
    └── api/
        └── health.test.ts       # API endpoint tests
```

## Test Coverage

Current test coverage focuses on:

### ✅ Crypto Functions (`utils/__tests__/helpers.test.ts`)
- **encrypt/decrypt**: AES-256-CBC encryption with proper IV generation
- **generateSecureToken**: Cryptographically secure token generation
- **generateReferralCode**: Unique referral code format validation
- **Edge cases**: Empty strings, special characters, Unicode, corrupted data

**Key tests:**
- Encryption round-trip (encrypt → decrypt)
- Random IV generation (same plaintext → different ciphertext)
- Error handling for invalid/corrupted ciphertext
- Format validation (IV:ciphertext structure)

### ✅ Payment Service (`services/__tests__/paymentService.test.ts`)
- **createPaymentConfirmation**: Dual-confirmation payment record creation
- **clientConfirmPayment**: Token-based client payment confirmation
- **Error handling**: Invalid tokens, expired tokens, database errors

**Key tests:**
- Payment confirmation structure validation
- UUID token format verification
- Token expiry enforcement
- Authorization checks

### ✅ Invoice Service (`services/__tests__/invoiceService.test.ts`)
- **createInvoice**: Invoice creation with required fields
- **getInvoiceById**: Authorization and ownership verification
- **listInvoices**: Pagination and filtering
- **Error handling**: NotFoundError for missing/unauthorized invoices

**Key tests:**
- Default field values (status, currency)
- Ownership verification (freelancerId matching)
- Optional field handling (description)
- Database error propagation

### ✅ API Endpoints (`__tests__/api/health.test.ts`)
- **GET /api/health**: Health check endpoint
- **Error response format**: Consistent error structures across all endpoints

**Key tests:**
- Health check response structure
- ISO timestamp format validation
- Error response consistency (404, 400, 500)
- Security (no stack traces in production errors)

## Coverage Thresholds

Configured in `jest.config.js`:
```javascript
coverageThreshold: {
  global: {
    branches: 50,
    functions: 50,
    lines: 50,
    statements: 50,
  },
}
```

**Note:** These are starter thresholds. Increase as test suite matures.

## Writing Tests

### Test File Template

```typescript
/**
 * Test suite for [Module Name]
 * Description of what this module does
 */

import { functionToTest } from '../moduleToTest';

// Mock external dependencies
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(),
  },
  // ... other mocks
}));

describe('Module Name', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('functionName()', () => {
    /**
     * Test description explaining what is being tested
     * and why it's important
     */
    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test-data';
      
      // Act
      const result = functionToTest(input);
      
      // Assert
      expect(result).toBe('expected-output');
    });
  });
});
```

### Best Practices

1. **Use descriptive test names**
   ```typescript
   ✅ it('should throw error for expired token', () => {})
   ❌ it('test token', () => {})
   ```

2. **Test one thing per test**
   ```typescript
   ✅ it('should encrypt text correctly', () => {})
   ✅ it('should handle empty strings', () => {})
   ❌ it('should encrypt and handle edge cases', () => {})
   ```

3. **Mock external dependencies**
   ```typescript
   // Mock Firebase to avoid real database calls
   jest.mock('@/lib/firebase');
   
   // Mock API clients
   jest.mock('@/lib/stripe');
   jest.mock('@/lib/sendgrid');
   ```

4. **Test error cases**
   ```typescript
   it('should throw NotFoundError for missing invoice', async () => {
     await expect(
       getInvoiceById('non-existent', 'user-123')
     ).rejects.toThrow(NotFoundError);
   });
   ```

5. **Add descriptive comments**
   ```typescript
   /**
    * Test encryption produces different ciphertext each time
    * Due to random IV generation, same plaintext should encrypt differently
    */
   it('should produce different ciphertext for same input', () => {
     // Test implementation
   });
   ```

## Mocking Strategies

### Firebase Mocking

```typescript
jest.mock('@/lib/firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn().mockResolvedValue(undefined),
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockData,
        }),
      })),
    })),
  },
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date('2025-01-01') })),
    fromDate: jest.fn((date) => ({ toDate: () => date })),
  },
  COLLECTIONS: {
    INVOICES: 'invoices',
    USERS: 'users',
  },
}));
```

### API Client Mocking

```typescript
jest.mock('@/lib/stripe', () => ({
  createStripePaymentLink: jest.fn().mockResolvedValue({
    url: 'https://checkout.stripe.com/test',
  }),
}));

jest.mock('@/lib/sendgrid', () => ({
  sendInvoiceEmail: jest.fn().mockResolvedValue(true),
}));
```

## CI/CD Integration

Tests run automatically on:
- **Pull requests** to `main` or `develop` branches
- **Pushes** to `main` or `develop` branches

### GitHub Actions Workflow

See `.github/workflows/ci.yml` for the complete CI/CD pipeline:

1. **Lint check**: `npm run lint`
2. **Test execution**: `npm test -- --coverage`
3. **Build verification**: `npm run build`
4. **Security audit**: `npm audit`

### Required Checks

Before merging a PR, ensure:
- ✅ All tests pass
- ✅ Linter passes
- ✅ Coverage meets thresholds
- ✅ Build succeeds

## Environment Variables for Testing

Test environment is configured in `jest.setup.js`:

```javascript
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.ENCRYPTION_KEY = '0123456789abcdef...'; // 64 hex chars
process.env.STRIPE_SECRET_KEY = 'sk_test_mock...';
// ... other mocked keys
```

**Important:** Tests use mock API keys. Real API calls should be mocked.

## Debugging Tests

### Enable verbose output
```bash
npm test -- --verbose
```

### See console output
```bash
DEBUG=true npm test
```

### Debug specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand helpers.test.ts
```

Then open `chrome://inspect` in Chrome.

## Test Utilities

### jest.setup.js
- Sets NODE_ENV to 'test'
- Mocks all environment variables
- Suppresses console.log (unless DEBUG=true)
- Sets global test timeout

### jest.config.js
- TypeScript support via ts-jest
- Coverage configuration
- Module path aliases (@/)
- Test file patterns

## Continuous Improvement

### Adding New Tests

When adding new features:

1. **Write tests first** (TDD approach)
2. **Test happy path** (expected behavior)
3. **Test edge cases** (empty, null, invalid)
4. **Test error cases** (exceptions, failures)
5. **Run coverage** to find gaps

### Increasing Coverage

Target files with low coverage:
```bash
npm test -- --coverage --coverageReporters=text
```

Focus on:
- Business-critical logic (payments, invoices)
- Security-sensitive code (encryption, auth)
- Complex algorithms (collections, notifications)

## Common Issues

### Mock not working?
```typescript
// Ensure mock is defined BEFORE import
jest.mock('@/lib/firebase');
import { someFunction } from './myModule';
```

### Can't find module with @ alias?
Check `jest.config.js` has:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/$1',
}
```

### Tests timing out?
Increase timeout in specific test:
```typescript
it('slow test', async () => {
  // test code
}, 15000); // 15 second timeout
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library Best Practices](https://testing-library.com/docs/)
- [TypeScript Jest Guide](https://kulshekhar.github.io/ts-jest/)

---

**Remember:** Good tests are:
- ✅ Fast (no real API calls)
- ✅ Independent (no shared state)
- ✅ Repeatable (same result every time)
- ✅ Self-validating (pass/fail, no manual verification)
- ✅ Timely (written with or before code)
