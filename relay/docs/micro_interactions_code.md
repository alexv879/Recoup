# Micro-Interactions Code Examples for Relay

## 1. Confetti Animation Component

```javascript
// Confetti.jsx - Celebratory confetti animation
import React, { useEffect, useRef } from 'react';

const Confetti = ({ isActive, onComplete }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!isActive) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const confetti = [];
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];

    // Create confetti particles
    for (let i = 0; i < 50; i++) {
      confetti.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 5 + 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 3,
        rotation: Math.random() * Math.PI * 2
      });
    }

    let frame = 0;
    const maxFrames = 180; // ~3 seconds at 60fps

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach((particle) => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.vy += 0.2; // Gravity
        particle.rotation += 0.1;

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate(particle.rotation);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      frame++;
      if (frame < maxFrames) {
        requestAnimationFrame(animate);
      } else {
        onComplete?.();
      }
    };

    animate();

    return () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [isActive, onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      aria-hidden="true"
    />
  );
};

export default Confetti;

// Usage in component:
// const [showConfetti, setShowConfetti] = useState(false);
// 
// const handleInvoiceSent = async () => {
//   await sendInvoice();
//   setShowConfetti(true);
// };
// 
// return (
//   <>
//     <Confetti 
//       isActive={showConfetti} 
//       onComplete={() => setShowConfetti(false)} 
//     />
//     {showConfetti && (
//       <div className="fixed inset-0 flex items-center justify-center z-40 pointer-events-none">
//         <div className="text-center animate-bounce">
//           <div className="text-6xl mb-4">🎉</div>
//           <h2 className="text-2xl font-bold text-gray-900">
//             Your first invoice is on its way!
//           </h2>
//         </div>
//       </div>
//     )}
//   </>
// );
```

## 2. Skeleton Screen Component

```javascript
// SkeletonLoader.jsx - Loading placeholder with pulsing animation
import React from 'react';

const SkeletonLoader = ({ 
  count = 5, 
  variant = 'invoice-table' 
}) => {
  if (variant === 'invoice-table') {
    return (
      <div className="space-y-4">
        {/* Header row */}
        <div className="grid grid-cols-5 gap-4 px-6 py-3 bg-gray-50">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>

        {/* Table rows */}
        {[...Array(count)].map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-5 gap-4 px-6 py-4 border-b border-gray-200">
            {[...Array(5)].map((_, colIdx) => (
              <div 
                key={colIdx} 
                className={`h-4 bg-gray-200 rounded animate-pulse ${
                  colIdx === 1 ? 'w-3/4' : 'w-full'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'invoice-detail') {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="h-8 w-1/3 bg-gray-200 rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
        </div>

        {/* Invoice Details Section */}
        <div className="space-y-4">
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-2">
          <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;

// CSS for pulsing animation
// Add to your global styles:
// @keyframes pulse {
//   0%, 100% { opacity: 1; }
//   50% { opacity: 0.7; }
// }
// .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
```

## 3. Optimistic UI Implementation

```javascript
// OptimisticInvoiceList.jsx - Create invoice with optimistic UI
import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, RotateCcw } from 'lucide-react';

const OptimisticInvoiceList = ({ invoices: initialInvoices }) => {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [optimisticInvoices, setOptimisticInvoices] = useState({});
  const [errors, setErrors] = useState({});

  const handleCreateInvoice = async (newInvoice) => {
    const optimisticId = `optimistic-${Date.now()}`;

    // 1. Immediately show invoice as created (optimistic)
    setInvoices(prev => [
      {
        ...newInvoice,
        id: optimisticId,
        status: 'draft'
      },
      ...prev
    ]);

    setOptimisticInvoices(prev => ({
      ...prev,
      [optimisticId]: true
    }));

    try {
      // 2. Make API request in background
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInvoice)
      });

      if (!response.ok) throw new Error('Failed to create invoice');

      const savedInvoice = await response.json();

      // 3. Replace optimistic with real invoice
      setInvoices(prev => 
        prev.map(inv => 
          inv.id === optimisticId ? savedInvoice : inv
        )
      );

      setOptimisticInvoices(prev => {
        const updated = { ...prev };
        delete updated[optimisticId];
        return updated;
      });

      // 4. Show success message
      showNotification('Invoice created successfully', 'success');
    } catch (error) {
      // 5. Handle error
      setErrors(prev => ({
        ...prev,
        [optimisticId]: error.message
      }));

      showNotification('Failed to create invoice', 'error');
    }
  };

  return (
    <div className="space-y-4">
      {invoices.map(invoice => (
        <div
          key={invoice.id}
          className={`p-4 border rounded-lg transition-all ${
            optimisticInvoices[invoice.id]
              ? 'opacity-75 bg-blue-50 border-blue-200'
              : 'bg-white border-gray-200'
          } ${
            errors[invoice.id]
              ? 'bg-red-50 border-red-200'
              : ''
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{invoice.clientName}</h3>
              <p className="text-sm text-gray-600">
                £{invoice.amount.toFixed(2)} • {new Date(invoice.dueDate).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {optimisticInvoices[invoice.id] && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}

              {errors[invoice.id] && (
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  <button 
                    onClick={() => handleCreateInvoice(invoice)}
                    className="text-sm hover:underline"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!optimisticInvoices[invoice.id] && !errors[invoice.id] && (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default OptimisticInvoiceList;
```

## 4. Error Recovery Component

```javascript
// ErrorRecovery.jsx - Helpful error messages with recovery actions
import React from 'react';
import { AlertTriangle, RotateCcw, HelpCircle } from 'lucide-react';

const ErrorRecovery = ({ 
  error, 
  onRetry, 
  onDismiss,
  isRetrying = false 
}) => {
  // Map error codes to helpful messages
  const getErrorInfo = (errorCode) => {
    const errors = {
      'INVALID_EMAIL': {
        title: 'Invalid Email Address',
        message: 'Check that the email address is spelled correctly (e.g., john@company.com)',
        actions: [
          { label: 'Edit Email', action: 'edit' },
          { label: 'Retry', action: 'retry' }
        ]
      },
      'EMAIL_EXISTS': {
        title: 'Client Already Added',
        message: 'This email is already in your client list.',
        actions: [
          { label: 'Use Existing Client', action: 'edit' },
          { label: 'Add Different Email', action: 'edit' }
        ]
      },
      'NETWORK_ERROR': {
        title: 'Connection Lost',
        message: 'Check your internet connection and try again.',
        actions: [
          { label: 'Retry', action: 'retry' }
        ]
      },
      'SERVER_ERROR': {
        title: 'Something Went Wrong',
        message: 'Our servers are having trouble. Please try again in a few moments.',
        actions: [
          { label: 'Retry', action: 'retry' },
          { label: 'Contact Support', action: 'support' }
        ]
      }
    };

    return errors[errorCode] || {
      title: 'Error',
      message: errorCode || 'An unexpected error occurred',
      actions: [
        { label: 'Retry', action: 'retry' }
      ]
    };
  };

  const errorInfo = getErrorInfo(error?.code);

  return (
    <div
      role="alert"
      className="p-4 bg-red-50 border border-red-200 rounded-lg"
    >
      <div className="flex gap-3">
        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        
        <div className="flex-1">
          <h3 className="font-semibold text-red-900 mb-1">
            {errorInfo.title}
          </h3>
          <p className="text-sm text-red-800 mb-3">
            {errorInfo.message}
          </p>

          {/* Error Code for Support */}
          {error?.code && (
            <p className="text-xs text-red-700 mb-3">
              Error code: <code className="font-mono">{error.code}</code>
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {errorInfo.actions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (action.action === 'retry') onRetry?.();
                  // Handle other actions as needed
                }}
                disabled={isRetrying}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-colors ${
                  action.action === 'retry'
                    ? 'bg-red-600 hover:bg-red-700 text-white disabled:opacity-50'
                    : 'bg-red-200 hover:bg-red-300 text-red-900'
                }`}
              >
                {isRetrying && action.action === 'retry' ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    {action.action === 'retry' && <RotateCcw className="w-4 h-4" />}
                    {action.label}
                  </>
                )}
              </button>
            ))}

            <button
              onClick={onDismiss}
              className="text-sm text-red-700 hover:text-red-900 underline"
            >
              Dismiss
            </button>
          </div>

          {/* Support Link */}
          <div className="mt-3 pt-3 border-t border-red-200">
            <a
              href="https://relay.app/support"
              className="inline-flex items-center gap-1 text-xs text-red-700 hover:text-red-900 underline"
            >
              <HelpCircle className="w-3 h-3" />
              Get Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorRecovery;
```

## 5. Empty State Component

```javascript
// EmptyState.jsx - Friendly empty state with CTA
import React from 'react';
import { FileText, Plus, BookOpen } from 'lucide-react';

const EmptyState = ({ 
  type = 'no-invoices',
  onCreateClick,
  onTutorialClick
}) => {
  const emptyStates = {
    'no-invoices': {
      icon: FileText,
      title: 'Create Your First Invoice',
      description: 'When you send an invoice, it will appear here. Get started by creating your first invoice.',
      primaryCTA: {
        label: '⊕ Create Invoice',
        action: onCreateClick
      },
      secondaryCTA: {
        label: '📖 View Tutorial',
        action: onTutorialClick
      }
    },
    'no-results': {
      icon: FileText,
      title: 'No Invoices Found',
      description: 'Try searching by client name, adjusting your filters, or clearing the date range.',
      primaryCTA: {
        label: 'Clear Filters',
        action: () => { /* Clear filters */ }
      },
      secondaryCTA: null
    },
    'all-collected': {
      icon: '✅',
      title: 'Great! All Caught Up',
      description: 'No overdue invoices. Your cash flow is looking healthy!',
      primaryCTA: {
        label: '⊕ Create New Invoice',
        action: onCreateClick
      },
      secondaryCTA: null
    }
  };

  const state = emptyStates[type];
  const Icon = typeof state.icon === 'string' ? null : state.icon;

  return (
    <div className="text-center py-12 px-4">
      {/* Icon */}
      {state.icon === '✅' ? (
        <div className="text-5xl mb-4">✅</div>
      ) : (
        <Icon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      )}

      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {state.title}
      </h2>

      {/* Description */}
      <p className="text-gray-600 max-w-sm mx-auto mb-6">
        {state.description}
      </p>

      {/* CTAs */}
      <div className="flex gap-3 justify-center flex-wrap">
        {state.primaryCTA && (
          <button
            onClick={state.primaryCTA.action}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            {state.primaryCTA.label}
          </button>
        )}

        {state.secondaryCTA && (
          <button
            onClick={state.secondaryCTA.action}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            {state.secondaryCTA.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
```

## 6. Page Transition Animation

```javascript
// PageTransition.jsx - Fade animation between pages
import React, { useEffect, useState } from 'react';

const PageTransition = ({ children, isLoading = false }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, [children]);

  return (
    <div
      className={`transition-opacity duration-200 ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {children}
    </div>
  );
};

export default PageTransition;

// CSS animations
// Add to global styles:
/*
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fadeIn {
  animation: fadeIn 200ms ease-in-out;
}

.animate-modalIn {
  animation: modalIn 200ms ease-out;
}
*/
```

## 7. Haptic Feedback (React Native)

```javascript
// useHaptics.js - Custom hook for haptic feedback
import { Vibration } from 'react-native';

export const useHaptics = () => {
  const patterns = {
    light: () => Vibration.vibrate(10),
    medium: () => Vibration.vibrate(20),
    strong: () => Vibration.vibrate(40),
    success: () => Vibration.vibrate([20, 10, 20]),
    error: () => Vibration.vibrate(50),
    pattern: (pattern) => Vibration.vibrate(pattern)
  };

  return patterns;
};

// Usage in component:
// const haptics = useHaptics();
// 
// const handlePaymentReceived = () => {
//   haptics.success(); // [20, 10, 20] pattern
//   celebratePayment();
// };
//
// const handleError = () => {
//   haptics.error(); // 50ms strong vibration
//   showErrorMessage();
// };
```

These production-ready components implement the full range of micro-interactions and delightful moments researched for Relay's invoicing platform.
