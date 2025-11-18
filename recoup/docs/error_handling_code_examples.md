# Error Handling & Offline Code Examples for Relay

## 1. Comprehensive Error Handling Component

```javascript
// ErrorHandler.jsx - Complete error handling with retry
import React, { useState } from 'react';
import { AlertCircle, WifiOff, RotateCcw, HelpCircle } from 'lucide-react';

const ErrorHandler = ({ 
  error, 
  onRetry, 
  isRetrying = false,
  context = 'operation' // invoice, payment, collection, etc.
}) => {
  const [showDetails, setShowDetails] = useState(false);

  // Map error types to user-friendly messages
  const getErrorInfo = (error) => {
    const status = error?.response?.status;
    const code = error?.code;

    // Network errors
    if (code === 'ECONNREFUSED' || code === 'ERR_NETWORK') {
      return {
        title: 'Connection Failed',
        message: 'Unable to reach the server. Check your internet connection.',
        icon: '🔌',
        actions: ['retry']
      };
    }

    if (code === 'ETIMEDOUT') {
      return {
        title: 'Request Timed Out',
        message: 'The operation took too long. Please try again.',
        icon: '⏱️',
        actions: ['retry']
      };
    }

    // HTTP errors
    if (status === 400) {
      return {
        title: 'Invalid Request',
        message: 'Please check your input and try again.',
        icon: '❌',
        actions: ['edit']
      };
    }

    if (status === 401) {
      return {
        title: 'Authentication Failed',
        message: 'Your session has expired. Please log in again.',
        icon: '🔐',
        actions: ['login']
      };
    }

    if (status === 403) {
      return {
        title: 'Permission Denied',
        message: 'You don\'t have permission to perform this action.',
        icon: '🚫',
        actions: []
      };
    }

    if (status === 404) {
      return {
        title: 'Not Found',
        message: 'The requested item doesn\'t exist or has been deleted.',
        icon: '🔍',
        actions: []
      };
    }

    if (status === 409) {
      return {
        title: 'Conflict',
        message: 'This item has been modified. Please refresh and try again.',
        icon: '⚔️',
        actions: ['refresh']
      };
    }

    if (status === 429) {
      return {
        title: 'Too Many Requests',
        message: 'You\'re making requests too quickly. Please wait a moment.',
        icon: '⚡',
        actions: ['wait']
      };
    }

    if (status >= 500) {
      return {
        title: 'Server Error',
        message: 'Something went wrong on our end. We\'re working on it.',
        icon: '💥',
        actions: ['retry', 'support']
      };
    }

    // Default
    return {
      title: 'Something Went Wrong',
      message: error?.message || 'An unexpected error occurred.',
      icon: '⚠️',
      actions: ['retry', 'support']
    };
  };

  const errorInfo = getErrorInfo(error);

  return (
    <div className="space-y-4">
      {/* Error Card */}
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex gap-4">
          {/* Icon */}
          <div className="text-3xl flex-shrink-0">{errorInfo.icon}</div>

          {/* Content */}
          <div className="flex-1">
            {/* Title */}
            <h3 className="font-semibold text-red-900 mb-1">
              {errorInfo.title}
            </h3>

            {/* Message */}
            <p className="text-sm text-red-800 mb-3">
              {errorInfo.message}
            </p>

            {/* Error Code */}
            {error?.code && (
              <p className="text-xs text-red-700 font-mono mb-3">
                Error: {error.code}
              </p>
            )}

            {/* Error Details (collapsible) */}
            {error?.message && process.env.NODE_ENV === 'development' && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-red-700 hover:text-red-800 underline mb-3"
              >
                {showDetails ? 'Hide' : 'Show'} Details
              </button>
            )}

            {showDetails && (
              <div className="text-xs bg-red-100 p-2 rounded font-mono max-h-40 overflow-auto mb-3">
                <p className="whitespace-pre-wrap break-all">
                  {error?.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 flex-wrap">
              {errorInfo.actions.includes('retry') && (
                <button
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-semibold transition-colors disabled:opacity-50"
                >
                  {isRetrying ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Retrying...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </>
                  )}
                </button>
              )}

              {errorInfo.actions.includes('edit') && (
                <button className="px-3 py-1.5 bg-red-200 hover:bg-red-300 text-red-900 text-sm rounded font-semibold transition-colors">
                  Edit Input
                </button>
              )}

              {errorInfo.actions.includes('support') && (
                <a
                  href={`/support?error=${error?.code || 'unknown'}&context=${context}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-200 hover:bg-red-300 text-red-900 text-sm rounded font-semibold transition-colors"
                >
                  <HelpCircle className="w-4 h-4" />
                  Get Help
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorHandler;
```

## 2. Offline Banner Component

```javascript
// OfflineBanner.jsx - Shown when user loses connection
import React, { useEffect, useState } from 'react';
import { WifiOff, Wifi, AlertCircle } from 'lucide-react';

const OfflineBanner = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);
  const [queuedCount, setQueuedCount] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setTimeout(() => setShowBanner(false), 3000); // Auto-hide after 3s
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isOnline
          ? 'bg-green-100 border-b border-green-400'
          : 'bg-yellow-100 border-b border-yellow-400'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Icon & Message */}
        <div className="flex items-center gap-3">
          {isOnline ? (
            <>
              <Wifi className="w-5 h-5 text-green-700" />
              <div>
                <p className="font-semibold text-green-900">You're back online!</p>
                {queuedCount > 0 && (
                  <p className="text-sm text-green-800">
                    Syncing {queuedCount} queued action{queuedCount !== 1 ? 's' : ''}...
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-yellow-700" />
              <div>
                <p className="font-semibold text-yellow-900">You're offline</p>
                <p className="text-sm text-yellow-800">
                  Changes will sync when you reconnect to the internet
                </p>
              </div>
            </>
          )}
        </div>

        {/* Right: Close Button */}
        <button
          onClick={() => setShowBanner(false)}
          className={`text-${isOnline ? 'green' : 'yellow'}-700 hover:text-${isOnline ? 'green' : 'yellow'}-900`}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default OfflineBanner;
```

## 3. Retry with Exponential Backoff Hook

```javascript
// useRetry.js - Custom hook for retry logic
import { useState, useCallback } from 'react';

export const useRetry = (options = {}) => {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    factor = 2,
    backoffFactor = 0.1 // jitter multiplier
  } = options;

  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (operation, isRetryable = () => true) => {
      let lastError;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          setIsRetrying(attempt > 0);
          setRetryCount(attempt);
          return await operation();
        } catch (err) {
          lastError = err;

          // Check if error is retryable
          if (!isRetryable(err)) {
            setError(err);
            throw err;
          }

          // Calculate exponential backoff with jitter
          if (attempt < maxRetries - 1) {
            const exponentialDelay = initialDelay * Math.pow(factor, attempt);
            const cappedDelay = Math.min(exponentialDelay, maxDelay);
            const jitter = Math.random() * backoffFactor * cappedDelay;
            const delay = cappedDelay + jitter;

            console.log(`Retry ${attempt + 1}/${maxRetries} in ${Math.round(delay)}ms`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      setError(lastError);
      setIsRetrying(false);
      throw lastError;
    },
    [maxRetries, initialDelay, maxDelay, factor, backoffFactor]
  );

  const reset = useCallback(() => {
    setIsRetrying(false);
    setRetryCount(0);
    setError(null);
  }, []);

  return {
    execute,
    isRetrying,
    retryCount,
    error,
    reset
  };
};

// Usage
const MyComponent = () => {
  const { execute, isRetrying, error } = useRetry();

  const handleSaveInvoice = async () => {
    try {
      await execute(
        async () => {
          const response = await fetch('/api/invoices', {
            method: 'POST',
            body: JSON.stringify(invoiceData)
          });
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          return response.json();
        },
        (err) => {
          // Retry only on network or server errors
          return err.response?.status >= 500 || !err.response;
        }
      );
    } catch (err) {
      console.error('Failed to save invoice:', err);
    }
  };

  return (
    <button
      onClick={handleSaveInvoice}
      disabled={isRetrying}
    >
      {isRetrying ? 'Retrying...' : 'Save Invoice'}
    </button>
  );
};
```

## 4. Request Queue for Offline Sync

```javascript
// OfflineRequestQueue.jsx - Queue and sync requests
import React, { useEffect, useState } from 'react';

export class OfflineQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
  }

  add(request) {
    this.queue.push({
      ...request,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      attempts: 0
    });
  }

  async process() {
    if (this.processing || !navigator.onLine) return;

    this.processing = true;
    const processed = [];

    while (this.queue.length > 0) {
      const request = this.queue[0];

      try {
        await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body
        });

        processed.push(this.queue.shift());
      } catch (error) {
        request.attempts++;

        if (request.attempts >= 5) {
          console.error('Failed to process request after 5 attempts:', request);
          processed.push(this.queue.shift());
        } else {
          break; // Stop processing on first failure
        }
      }
    }

    this.processing = false;
    return processed;
  }

  getSize() {
    return this.queue.length;
  }
}

const queue = new OfflineQueue();

// Hook to monitor queue
export const useOfflineQueue = () => {
  const [queueSize, setQueueSize] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setQueueSize(queue.getSize());
    }, 1000);

    window.addEventListener('online', () => {
      queue.process();
    });

    return () => clearInterval(interval);
  }, []);

  return { queueSize, queue };
};
```

## 5. Error Boundary with Fallback UI

```javascript
// InvoiceErrorBoundary.jsx - Error boundary for invoice operations
import React from 'react';
import ErrorHandler from './ErrorHandler';

class InvoiceErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.setState({ error });
    console.error('Invoice error:', error);
  }

  handleRetry = () => {
    this.setState(prev => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <ErrorHandler
            error={this.state.error}
            onRetry={this.handleRetry}
            context="invoice"
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default InvoiceErrorBoundary;
```

These production-ready components handle all error scenarios and offline experiences for Relay's invoicing platform.
