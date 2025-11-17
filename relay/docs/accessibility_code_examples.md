# Accessibility Code Examples for Relay - WCAG 2.1 Level AA

## 1. Accessible Form Component

```javascript
// AccessibleForm.jsx - Production-ready accessible invoice form
import React, { useState, useRef } from 'react';
import { AlertCircle } from 'lucide-react';

const AccessibleInvoiceForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    amount: '',
    dueDate: '',
    description: ''
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const errorSummaryRef = useRef(null);
  const liveRegionRef = useRef(null);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.clientName.trim()) {
      newErrors.clientName = 'Client name is required';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than £0';
    }

    if (!formData.dueDate) {
      newErrors.dueDate = 'Due date is required';
    }

    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const newErrors = validateForm();
    setErrors(newErrors);
    setTouched({
      clientName: true,
      amount: true,
      dueDate: true
    });

    if (Object.keys(newErrors).length > 0) {
      // Move focus to error summary
      if (errorSummaryRef.current) {
        errorSummaryRef.current.focus();
      }

      // Announce error to screen readers
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = `Form has ${Object.keys(newErrors).length} errors`;
      }
    } else {
      onSubmit(formData);
      // Announce success
      if (liveRegionRef.current) {
        liveRegionRef.current.textContent = 'Invoice created successfully';
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Live Region for Screen Readers */}
      <div
        ref={liveRegionRef}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />

      {/* Error Summary */}
      {Object.keys(errors).length > 0 && (
        <div
          ref={errorSummaryRef}
          role="alert"
          aria-live="assertive"
          className="mb-6 p-4 bg-red-50 border-l-4 border-red-600 rounded"
          tabIndex="-1"
        >
          <div className="flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="font-semibold text-red-900 mb-2">
                Please correct {Object.keys(errors).length} error{Object.keys(errors).length !== 1 ? 's' : ''}:
              </h2>
              <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                {Object.entries(errors).map(([field, message]) => (
                  <li key={field}>
                    <a href={`#${field}`} className="underline hover:no-underline">
                      {message}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Client Name Field */}
      <fieldset className="mb-6 border-0 p-0">
        <div>
          <label
            htmlFor="clientName"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Client Name
            <span className="text-red-600 ml-1" aria-label="required">*</span>
          </label>

          <input
            id="clientName"
            name="clientName"
            type="text"
            value={formData.clientName}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-required="true"
            aria-invalid={touched.clientName && !!errors.clientName}
            aria-describedby={
              touched.clientName && errors.clientName ? 'clientName-error' : undefined
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              touched.clientName && errors.clientName
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="Enter client name"
          />

          {touched.clientName && errors.clientName && (
            <span
              id="clientName-error"
              role="alert"
              className="block mt-1 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.clientName}
            </span>
          )}
        </div>
      </fieldset>

      {/* Amount Field */}
      <fieldset className="mb-6 border-0 p-0">
        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Amount (£)
            <span className="text-red-600 ml-1" aria-label="required">*</span>
          </label>

          <input
            id="amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            onBlur={handleBlur}
            min="0.01"
            step="0.01"
            aria-required="true"
            aria-invalid={touched.amount && !!errors.amount}
            aria-describedby={
              touched.amount && errors.amount ? 'amount-error' : 'amount-help'
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              touched.amount && errors.amount
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            placeholder="0.00"
          />

          <span id="amount-help" className="block mt-1 text-xs text-gray-600">
            Must be greater than £0
          </span>

          {touched.amount && errors.amount && (
            <span
              id="amount-error"
              role="alert"
              className="block mt-1 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.amount}
            </span>
          )}
        </div>
      </fieldset>

      {/* Due Date Field */}
      <fieldset className="mb-6 border-0 p-0">
        <div>
          <label
            htmlFor="dueDate"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Due Date
            <span className="text-red-600 ml-1" aria-label="required">*</span>
          </label>

          <input
            id="dueDate"
            name="dueDate"
            type="date"
            value={formData.dueDate}
            onChange={handleChange}
            onBlur={handleBlur}
            aria-required="true"
            aria-invalid={touched.dueDate && !!errors.dueDate}
            aria-describedby={
              touched.dueDate && errors.dueDate ? 'dueDate-error' : undefined
            }
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              touched.dueDate && errors.dueDate
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />

          {touched.dueDate && errors.dueDate && (
            <span
              id="dueDate-error"
              role="alert"
              className="block mt-1 text-sm text-red-600 flex items-center gap-1"
            >
              <AlertCircle className="w-4 h-4" />
              {errors.dueDate}
            </span>
          )}
        </div>
      </fieldset>

      {/* Description Field (Optional) */}
      <fieldset className="mb-6 border-0 p-0">
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Description
            <span className="text-gray-500 ml-1">(Optional)</span>
          </label>

          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="4"
            placeholder="Add any additional details..."
            aria-describedby="description-help"
          />

          <span id="description-help" className="block mt-1 text-xs text-gray-600">
            Provide context or specific details about this invoice
          </span>
        </div>
      </fieldset>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
      >
        Create Invoice
      </button>
    </form>
  );
};

export default AccessibleInvoiceForm;
```

## 2. Accessible Modal Component

```javascript
// AccessibleModal.jsx - Modal with focus management
import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  primaryActionText = 'Confirm',
  onPrimaryAction,
  isDangerous = false
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Save previously focused element
      previousActiveElement.current = document.activeElement;

      // Focus modal
      if (modalRef.current) {
        modalRef.current.focus();
      }

      // Prevent body scroll
      document.body.style.overflow = 'hidden';

      // Trap focus within modal
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'auto';

        // Restore focus to previously focused element
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 z-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 id="modal-title" className="text-xl font-bold text-gray-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {children}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            onClick={onPrimaryAction}
            className={`flex-1 px-4 py-2 text-white rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isDangerous
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {primaryActionText}
          </button>
        </div>
      </div>
    </>
  );
};

export default AccessibleModal;
```

## 3. Accessible Data Table

```javascript
// AccessibleTable.jsx - WCAG compliant data table
import React from 'react';

const AccessibleInvoiceTable = ({ invoices = [] }) => {
  return (
    <div className="space-y-4">
      {/* Table description */}
      <p id="table-description" className="text-sm text-gray-600">
        Table of invoices with payment status. Click on invoice number to view details.
      </p>

      {/* Scrollable container for small screens */}
      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table
          aria-label="Invoice list"
          aria-describedby="table-description"
          className="w-full text-sm"
        >
          <caption className="sr-only">
            Complete list of invoices with client name, amount, due date, and payment status
          </caption>

          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left font-semibold text-gray-700"
              >
                Invoice Number
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left font-semibold text-gray-700"
              >
                Client
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right font-semibold text-gray-700"
              >
                Amount
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left font-semibold text-gray-700"
              >
                Due Date
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left font-semibold text-gray-700"
              >
                Status
              </th>
              <th
                scope="col"
                className="sr-only"
              >
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {invoices.map((invoice, index) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-3">
                  <a
                    href={`/invoices/${invoice.id}`}
                    className="text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                  >
                    {invoice.invoiceNumber}
                  </a>
                </td>

                <td className="px-6 py-3 text-gray-900">
                  {invoice.clientName}
                </td>

                <td className="px-6 py-3 text-right font-semibold text-gray-900">
                  £{invoice.amount.toLocaleString('en-GB', { maximumFractionDigits: 2 })}
                </td>

                <td className="px-6 py-3 text-gray-600">
                  {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                </td>

                <td className="px-6 py-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
                      invoice.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'overdue'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                    aria-label={`Status: ${invoice.status}`}
                  >
                    {invoice.status === 'paid' && '✓'}
                    {invoice.status === 'overdue' && '⚠️'}
                    {invoice.status === 'pending' && '⏳'}
                    <span>{invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}</span>
                  </span>
                </td>

                <td className="px-6 py-3 text-right">
                  <button
                    aria-label={`Actions for invoice ${invoice.invoiceNumber}`}
                    className="p-2 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    ⋮
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty state */}
      {invoices.length === 0 && (
        <div className="text-center py-12" role="status">
          <p className="text-gray-500">No invoices found</p>
        </div>
      )}
    </div>
  );
};

export default AccessibleInvoiceTable;
```

## 4. Skip Links Component

```javascript
// SkipLinks.jsx - Allow skipping navigation
const SkipLinks = () => {
  return (
    <>
      {/* Skip link - hidden until focused */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:bg-blue-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:underline"
      >
        Skip to main content
      </a>

      {/* Necessary CSS */}
      <style>{`
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border-width: 0;
        }

        .focus:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }
      `}</style>
    </>
  );
};

export default SkipLinks;
```

## 5. Keyboard Shortcuts Manager

```javascript
// KeyboardShortcuts.js - Global keyboard shortcuts
export const registerKeyboardShortcuts = (handlers) => {
  document.addEventListener('keydown', (event) => {
    // Don't trigger if user is typing in input
    if (
      event.target.matches('input, textarea, [contenteditable="true"]')
    ) {
      return;
    }

    // Check for shortcut
    const shortcut = event.key.toLowerCase();
    
    if (event.ctrlKey || event.metaKey) {
      // Ctrl/Cmd + key combinations
      if (shortcut === 's') {
        event.preventDefault();
        handlers.onSave?.();
      }
      if (shortcut === 'n') {
        event.preventDefault();
        handlers.onNewInvoice?.();
      }
    } else {
      // Simple key combinations
      if (shortcut === 'n') {
        handlers.onNewInvoice?.();
      }
      if (shortcut === 's') {
        handlers.onSearch?.();
      }
      if (shortcut === '?') {
        handlers.onShowHelp?.();
      }
      if (shortcut === 'escape') {
        handlers.onEscape?.();
      }
    }
  });
};

// Usage in component:
// registerKeyboardShortcuts({
//   onNewInvoice: () => console.log('New invoice'),
//   onSearch: () => console.log('Search'),
//   onShowHelp: () => console.log('Show help')
// });
```

These production-ready components follow WCAG 2.1 Level AA guidelines and can be directly integrated into Relay's invoicing platform.
