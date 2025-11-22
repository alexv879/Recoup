/**
 * Jest Setup File
 *
 * Global test configuration, mocks, and utilities.
 * Runs before all tests.
 */

import '@testing-library/jest-dom';

// ============================================================================
// ENVIRONMENT VARIABLES
// ============================================================================

process.env.NODE_ENV = 'test';

// Firebase (mock credentials for testing)
process.env.FIREBASE_PROJECT_ID = 'test-project-id';
process.env.FIREBASE_CLIENT_EMAIL = 'test@test-project.iam.gserviceaccount.com';
process.env.FIREBASE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nMOCK_KEY\n-----END PRIVATE KEY-----\n';

// Clerk
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.CLERK_SECRET_KEY = 'sk_test_mock';
process.env.CLERK_WEBHOOK_SECRET = 'whsec_test_mock';

// Stripe
process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_mock';

// SendGrid
process.env.SENDGRID_API_KEY = 'SG.test_mock_key';
process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
process.env.SENDGRID_FROM_NAME = 'Test Sender';

// Twilio
process.env.TWILIO_ACCOUNT_SID = 'AC_test_mock';
process.env.TWILIO_AUTH_TOKEN = 'test_mock_token';
process.env.TWILIO_PHONE_NUMBER = '+447700900000';

// OpenAI
process.env.OPENAI_API_KEY = 'sk-test-mock';

// Lob
process.env.LOB_API_KEY = 'test_mock_key';

// Encryption & Security
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
process.env.CRON_SECRET = 'test-cron-secret';
process.env.VOICE_SERVER_WEBHOOK_SECRET = 'test-webhook-secret';

// App URL
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Upstash Redis (mock)
process.env.UPSTASH_REDIS_REST_URL = 'https://mock-redis.upstash.io';
process.env.UPSTASH_REDIS_REST_TOKEN = 'mock_token';

// ============================================================================
// GLOBAL MOCKS
// ============================================================================

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

// Mock Clerk auth
jest.mock('@clerk/nextjs', () => ({
  auth: jest.fn(() => ({
    userId: 'test-user-id',
    sessionId: 'test-session-id',
  })),
  currentUser: jest.fn(() => ({
    id: 'test-user-id',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
  })),
  ClerkProvider: ({ children }: { children: any }) => children,
  SignIn: () => 'Sign In Mock',
  SignUp: () => 'Sign Up Mock',
  UserButton: () => 'User Button Mock',
}));

// Mock Firebase Admin
jest.mock('firebase-admin/app', () => ({
  initializeApp: jest.fn(),
  getApps: jest.fn(() => []),
  cert: jest.fn(),
}));

jest.mock('firebase-admin/firestore', () => {
  const mockDoc = {
    id: 'test-doc-id',
    data: jest.fn(() => ({})),
    exists: true,
    ref: {
      path: 'test/path',
    },
  };

  const mockCollection = {
    doc: jest.fn(() => ({
      get: jest.fn(() => Promise.resolve(mockDoc)),
      set: jest.fn(() => Promise.resolve()),
      update: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
      collection: jest.fn(() => mockCollection),
    })),
    where: jest.fn(function(this: any) { return this; }),
    orderBy: jest.fn(function(this: any) { return this; }),
    limit: jest.fn(function(this: any) { return this; }),
    get: jest.fn(() => Promise.resolve({
      docs: [mockDoc],
      empty: false,
      size: 1,
    })),
    add: jest.fn(() => Promise.resolve({ id: 'test-doc-id' })),
  };

  return {
    getFirestore: jest.fn(() => ({
      collection: jest.fn(() => mockCollection),
    })),
    Timestamp: {
      now: jest.fn(() => ({ toDate: () => new Date() })),
      fromDate: jest.fn((date: Date) => ({ toDate: () => date })),
    },
    FieldValue: {
      serverTimestamp: jest.fn(),
      increment: jest.fn(),
      arrayUnion: jest.fn(),
      arrayRemove: jest.fn(),
      delete: jest.fn(),
    },
  };
});

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: jest.fn(() => Promise.resolve({ id: 'pi_test', client_secret: 'test_secret' })),
      retrieve: jest.fn(() => Promise.resolve({ id: 'pi_test', status: 'succeeded' })),
    },
    paymentLinks: {
      create: jest.fn(() => Promise.resolve({ url: 'https://pay.stripe.com/test' })),
    },
    customers: {
      create: jest.fn(() => Promise.resolve({ id: 'cus_test' })),
    },
    webhooks: {
      constructEvent: jest.fn((payload, sig, secret) => ({
        id: 'evt_test',
        type: 'payment_intent.succeeded',
        data: { object: {} },
      })),
    },
  }));
});

// Mock SendGrid
jest.mock('@sendgrid/mail', () => ({
  setApiKey: jest.fn(),
  send: jest.fn(() => Promise.resolve([{ statusCode: 202 }])),
}));

// Mock Twilio
jest.mock('twilio', () => {
  return jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn(() => Promise.resolve({ sid: 'SM_test', status: 'sent' })),
    },
    calls: {
      create: jest.fn(() => Promise.resolve({ sid: 'CA_test', status: 'initiated' })),
    },
  }));
});

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(() => Promise.resolve({
          choices: [{ message: { content: 'Test response' } }],
        })),
      },
    },
    audio: {
      transcriptions: {
        create: jest.fn(() => Promise.resolve({ text: 'Test transcription' })),
      },
    },
  }));
});

// Mock Upstash Redis
jest.mock('@upstash/redis', () => ({
  Redis: jest.fn().mockImplementation(() => ({
    get: jest.fn(() => Promise.resolve(null)),
    set: jest.fn(() => Promise.resolve('OK')),
    del: jest.fn(() => Promise.resolve(1)),
    incr: jest.fn(() => Promise.resolve(1)),
    expire: jest.fn(() => Promise.resolve(1)),
  })),
}));

jest.mock('@upstash/ratelimit', () => ({
  Ratelimit: jest.fn().mockImplementation(() => ({
    limit: jest.fn(() => Promise.resolve({
      success: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 60000,
    })),
  })),
}));

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

// Suppress console errors in tests (unless debugging)
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    headers: new Headers(),
  } as Response)
);

// Reset all mocks after each test
afterEach(() => {
  jest.clearAllMocks();
});

// ============================================================================
// TEST TIMEOUT
// ============================================================================

jest.setTimeout(10000); // 10 seconds for all tests
