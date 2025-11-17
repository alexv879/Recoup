# Error Handling & Offline Experience Guide for Relay

## PART 1: ERROR MESSAGE DESIGN

### 1.1 Error Copy Principles [271][272][273][275][278]

**Rule: Be Specific, Never Generic[271]**

❌ **Generic errors (avoid):**
- "An error occurred"
- "Invalid input"
- "Something went wrong"
- "Error 400"

✅ **Specific errors (use):**
- "Email must include @ symbol (e.g., john@company.com)"
- "Invoice amount must be greater than £0"
- "Couldn't send email to john@company.com - check the address"

**Why:** Users can fix specific errors; generic errors leave them confused.

**Error Message Formula [271][278]:**
1. **What happened:** Specific, technical explanation
2. **Why it happened:** Plain language cause
3. **How to fix it:** Clear action (not "try again")
4. **Example (if complex):** Show correct format

**Example:**
```
❌ "Invalid client name"

✅ "Client name must be 2-50 characters
   (You entered 'A' which is too short)
   
   Try: 'Acme Corp' or 'John Smith'"
```

### 1.2 Error Copy Best Practices [271][272][273]

**Tone & Language:**
- ✅ Respectful, helpful tone
- ❌ Avoid: "forbidden", "illegal", "you forgot", "prohibited"
- ❌ Avoid: "sorry", "oops" (doesn't help fix problem)
- ✅ Use: "Please", "We couldn't..."

**Clarity:**
- Use plain language (not "validation failed")
- Avoid technical jargon for end users
- Provide examples for complex inputs
- Show what correct input looks like

**Example Comparisons:**

| ❌ Generic | ✅ Specific |
|-----------|-----------|
| "Invalid date format" | "Use DD/MM/YYYY format (e.g., 15/11/2025)" |
| "Validation error" | "Invoice number already exists (INV-001)" |
| "Request failed" | "Couldn't save invoice - internet connection lost. [Retry]" |

### 1.3 Error Actions [271][272][273][275]

**Every error needs an action:**

**Action 1: Retry**
```html
<!-- For transient errors (network, temporary failure) -->
<button onclick="retryOperation()">
  Retry
</button>
```

**Action 2: Edit/Recover**
```html
<!-- For validation errors, preserve user input -->
<input value="john-at-company.com" />
<!-- Highlight the @ symbol needed -->
```

**Action 3: Contact Support**
```html
<!-- For errors user can't fix -->
<a href="https://support.relay.app?error=ERR_PDF_001">
  Contact Support (Error: ERR_PDF_001)
</a>
```

**Action 4: Documentation**
```html
<!-- For complex errors -->
<a href="/docs/collections-limits">
  Learn about invoice limits
</a>
```

---

## PART 2: NETWORK ERROR HANDLING

### 2.1 Offline Detection & Banner [281][283][284]

**Implementation:**

```javascript
// useOnlineStatus.js - Detect online/offline state
export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
};
```

**Offline Banner Display:**
```html
<!-- Show at top of page when offline -->
<div className={`${isOnline ? 'hidden' : 'fixed top-0 left-0 right-0'} 
                bg-yellow-100 border-b border-yellow-400 p-4 z-50`}>
  <div className="flex items-center gap-3">
    <WiFiOff className="w-5 h-5 text-yellow-700" />
    <div>
      <p className="font-semibold text-yellow-900">You're offline</p>
      <p className="text-sm text-yellow-800">
        Your changes will sync when you reconnect to the internet
      </p>
    </div>
  </div>
</div>
```

### 2.2 Retry Logic with Exponential Backoff [277][280]

**Exponential Backoff Formula:**
```
delay = initialDelay × (2 ^ attemptNumber) + random jitter
```

**Example:**
- Attempt 1: 1 second
- Attempt 2: 2 seconds
- Attempt 3: 4 seconds
- Attempt 4: 8 seconds
- Attempt 5: 16 seconds (max 30 seconds)

**Implementation:**

```javascript
// retryWithBackoff.js - Retry with exponential backoff
export const retryWithBackoff = async (
  operation,
  maxRetries = 5,
  initialDelay = 1000
) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Check if error is retryable
      const isRetryable = [
        408, // Request timeout
        429, // Too many requests (rate limited)
        500, // Server error
        502, // Bad gateway
        503, // Service unavailable
        504  // Gateway timeout
      ].includes(error.response?.status);

      if (!isRetryable) {
        throw error; // Don't retry non-retryable errors
      }

      // Calculate delay with exponential backoff + jitter
      if (attempt < maxRetries - 1) {
        const exponentialDelay = initialDelay * Math.pow(2, attempt);
        const maxDelay = 30000; // 30 seconds max
        const actualDelay = Math.min(exponentialDelay, maxDelay);
        const jitter = Math.random() * 0.1 * actualDelay; // 10% jitter
        const delay = actualDelay + jitter;

        console.log(`Retry attempt ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Usage
const data = await retryWithBackoff(async () => {
  const response = await fetch('/api/invoices');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
});
```

### 2.3 Queue Failed Requests for Retry

```javascript
// requestQueue.js - Queue requests when offline
class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.isOnline = navigator.onLine;

    window.addEventListener('online', () => this.processQueue());
  }

  async add(operation, metadata = {}) {
    this.queue.push({ operation, metadata, timestamp: Date.now() });
    return this.processQueue();
  }

  async processQueue() {
    if (!navigator.onLine || this.isProcessing) return;

    this.isProcessing = true;
    let failed = [];

    while (this.queue.length > 0) {
      const { operation, metadata } = this.queue.shift();

      try {
        console.log(`Processing queued request: ${metadata.name}`);
        await operation();
      } catch (error) {
        console.error(`Failed to process: ${metadata.name}`, error);
        failed.push({ operation, metadata });
      }
    }

    this.queue = failed;
    this.isProcessing = false;

    if (failed.length > 0) {
      console.log(`${failed.length} requests still failing, will retry when online`);
    }
  }
}

export const requestQueue = new RequestQueue();

// Usage: Queue invoice creation while offline
requestQueue.add(
  async () => {
    const response = await fetch('/api/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    });
    if (!response.ok) throw new Error('Failed');
    return response.json();
  },
  { name: 'Create Invoice #INV-123' }
);
```

---

## PART 3: PROGRESSIVE WEB APP (PWA) OFFLINE MODE

### 3.1 Service Worker Implementation [276][279]

**sw.js - Service Worker**

```javascript
const CACHE_VERSION = 'v1';
const CACHE_NAME = `relay-cache-${CACHE_VERSION}`;

// Assets to cache on install
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles/main.css',
  '/js/main.js',
  '/fonts/inter.woff2'
];

// Install: Cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Caching static assets');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
});

// Fetch: Serve from cache, fallback to network
self.addEventListener('fetch', event => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  event.respondWith(
    caches.match(request).then(response => {
      // Return cached response if available
      if (response) return response;

      // Otherwise, fetch from network
      return fetch(request)
        .then(response => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200) return response;

          // Clone response for caching
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });

          return response;
        })
        .catch(() => {
          // Offline: Return offline page if available
          return caches.match('/offline.html');
        });
    })
  );
});
```

**Register Service Worker:**

```javascript
// main.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(registration => {
      console.log('Service Worker registered:', registration);
    })
    .catch(error => {
      console.log('Service Worker registration failed:', error);
    });
}
```

### 3.2 Offline Invoice Storage

```javascript
// offlineStorage.js - IndexedDB for offline invoices
const DB_NAME = 'RelayDB';
const STORE_NAME = 'invoices';

export const openDatabase = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
};

export const saveInvoiceOffline = async (invoice) => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put({
      ...invoice,
      syncedAt: null,
      status: 'draft'
    });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};

export const getOfflineInvoices = async () => {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
};
```

---

## PART 4: LOADING & TIMEOUT ERRORS

### 4.1 Long Request Handling with Progress [287][290]

**Progress Bar for Long Operations:**

```javascript
// LongOperationProgress.jsx
import React, { useState, useEffect } from 'react';

const LongOperationProgress = ({ operation, timeout = 60000 }) => {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('starting');
  const [error, setError] = useState(null);

  useEffect(() => {
    let timeoutId;
    let progressInterval;

    const executeOperation = async () => {
      try {
        setStatus('processing');

        // Simulate progress (update every 200ms)
        progressInterval = setInterval(() => {
          setProgress(prev => {
            // Slow down as progress approaches 100%
            if (prev < 50) return prev + Math.random() * 10;
            if (prev < 90) return prev + Math.random() * 5;
            return Math.min(prev + 1, 99);
          });
        }, 200);

        // Set timeout
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), timeout);

        // Execute operation
        const result = await operation(controller.signal);

        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setProgress(100);
        setStatus('complete');

        return result;
      } catch (err) {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
        setStatus('error');
        setError(err.message);
      }
    };

    executeOperation();

    return () => {
      clearTimeout(timeoutId);
      clearInterval(progressInterval);
    };
  }, [operation, timeout]);

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between mb-2">
          <p className="font-semibold text-gray-900 capitalize">{status}</p>
          <p className="text-sm text-gray-600">{Math.round(progress)}%</p>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${
              status === 'complete' ? 'bg-green-500' :
              status === 'error' ? 'bg-red-500' :
              'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
          <button className="mt-2 text-red-600 hover:text-red-700 font-semibold text-sm">
            Retry
          </button>
        </div>
      )}

      {/* Success Message */}
      {status === 'complete' && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">✓ Operation completed successfully</p>
        </div>
      )}
    </div>
  );
};

export default LongOperationProgress;
```

### 4.2 Timeout Handling

```javascript
// withTimeout.js - Wrap operations with timeout
export const withTimeout = (promise, timeoutMs) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) =>
    (timeoutId = setTimeout(() => {
      reject(new Error(`Operation timed out after ${timeoutMs}ms`));
    }, timeoutMs))
  );

  return Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId));
};

// Usage: PDF generation with 60 second timeout
const generatePDF = async () => {
  try {
    const pdf = await withTimeout(
      fetch('/api/invoices/123/pdf').then(r => r.blob()),
      60000 // 60 second timeout
    );
  } catch (error) {
    if (error.message.includes('timeout')) {
      // Show friendly timeout error
    }
  }
};
```

---

## PART 5: ERROR BOUNDARY

### 5.1 React Error Boundary [286][289]

```javascript
// ErrorBoundary.jsx - Catch and handle errors
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
      retryCount: 0
    });

    // Send to error tracking service (Sentry, etc.)
    // errorTracker.captureException(error);
  }

  handleReset = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prev.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            {/* Error Icon */}
            <div className="text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            </div>

            {/* Error Message */}
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>

            {/* Error Details (Development only) */}
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-40">
                <summary>Error details</summary>
                <pre>{this.state.errorInfo?.componentStack}</pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Try Again ({this.state.retryCount > 0 && `${this.state.retryCount}`})
              </button>
              <a
                href="/support"
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-semibold text-center transition-colors"
              >
                Get Help
              </a>
            </div>

            {/* Fallback Link */}
            <a href="/" className="block text-center text-blue-600 hover:text-blue-700 text-sm">
              Return to Dashboard
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

This guide provides Relay with comprehensive error handling and offline experience patterns based on industry best practices and research from Stripe, Notion, Google, and leading SaaS applications.
