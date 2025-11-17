# Payment Verification UX Code Examples for Relay

## 1. Payment Status Badge Component

```javascript
// PaymentStatusBadge.jsx - Displays payment status with color coding and icons
import React from 'react';
import { CheckCircle2, AlertCircle, Clock, XCircle } from 'lucide-react';

const PaymentStatusBadge = ({ status, size = 'md' }) => {
  const statusConfig = {
    paid: {
      label: 'Paid',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-300',
      icon: CheckCircle2,
      ariaLabel: 'Payment verified'
    },
    pending_verification: {
      label: 'Pending Verification',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-300',
      icon: Clock,
      ariaLabel: 'Payment claimed, awaiting verification'
    },
    overdue: {
      label: 'Overdue',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-300',
      icon: AlertCircle,
      ariaLabel: 'Invoice payment overdue'
    },
    rejected: {
      label: 'Payment Rejected',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      icon: XCircle,
      ariaLabel: 'Payment claim rejected'
    },
    pending: {
      label: 'Pending',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-300',
      icon: Clock,
      ariaLabel: 'Invoice pending payment'
    }
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border ${config.bgColor} ${config.borderColor} ${config.textColor} ${sizeClasses[size]} font-semibold`}
      role="status"
      aria-label={config.ariaLabel}
    >
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </div>
  );
};

export default PaymentStatusBadge;

// Usage
<PaymentStatusBadge status="pending_verification" size="md" />
```

## 2. "I Paid" Button Component with Payment Method Selection

```javascript
// IPaidButton.jsx - Client button to claim payment
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';

const IPaidButton = ({ invoiceId, onPaymentClaimed, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentMethods = [
    { id: 'bacs', label: 'Bank Transfer (BACS)', desc: 'Direct debit via UK banking' },
    { id: 'check', label: 'Check', desc: 'Physical check payment' },
    { id: 'cash', label: 'Cash', desc: 'Cash payment in person' },
    { id: 'paypal', label: 'PayPal', desc: 'PayPal transfer' },
    { id: 'stripe', label: 'Card', desc: 'Credit/debit card' },
    { id: 'other', label: 'Other', desc: 'Other payment method' }
  ];

  const handlePaymentClaim = async (method) => {
    if (!method) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/invoices/${invoiceId}/claim-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: method,
          claimedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        const data = await response.json();
        onPaymentClaimed?.(data);
        setIsOpen(false);
        setSelectedMethod(null);
      }
    } catch (error) {
      console.error('Error claiming payment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled || isSubmitting}
        className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2 transition-colors"
        aria-label="Mark invoice as paid"
      >
        <Check className="w-4 h-4" />
        I've Paid This
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-xl z-40">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">How did you pay?</h3>
              <p className="text-sm text-gray-600 mt-1">Select your payment method</p>
            </div>

            <div className="max-h-72 overflow-y-auto">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedMethod(method.id);
                    handlePaymentClaim(method.id);
                  }}
                  disabled={isSubmitting}
                  className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{method.label}</p>
                      <p className="text-sm text-gray-600">{method.desc}</p>
                    </div>
                    {selectedMethod === method.id && isSubmitting && (
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-4 bg-blue-50 border-t border-gray-100 text-sm text-gray-600">
              ⏱️ Your payment claim will be verified within 24 hours
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IPaidButton;
```

## 3. Payment Verification Modal (Freelancer Side)

```javascript
// PaymentVerificationModal.jsx - Freelancer verifies or rejects payment claim
import React, { useState } from 'react';
import { X, AlertTriangle, FileText } from 'lucide-react';

const PaymentVerificationModal = ({ 
  paymentClaim, 
  onConfirm, 
  onReject, 
  onRequestEvidence,
  isOpen,
  onClose 
}) => {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectReason, setShowRejectReason] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !paymentClaim) return null;

  const rejectionReasons = [
    { id: 'no_payment', label: 'No payment received' },
    { id: 'incorrect_amount', label: 'Incorrect amount' },
    { id: 'wrong_invoice', label: 'Payment for wrong invoice' },
    { id: 'duplicate', label: 'Duplicate payment claim' },
    { id: 'other', label: 'Other' }
  ];

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm?.(paymentClaim.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) return;
    
    setIsSubmitting(true);
    try {
      await onReject?.(paymentClaim.id, rejectionReason);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestEvidence = async () => {
    setIsSubmitting(true);
    try {
      await onRequestEvidence?.(paymentClaim.id);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 z-50 max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Payment Claim</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Payment Details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">Invoice Details</p>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Invoice #</span>
                <span className="text-gray-900 font-semibold">{paymentClaim.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Client</span>
                <span className="text-gray-900 font-semibold">{paymentClaim.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Amount</span>
                <span className="text-gray-900 font-semibold">£{paymentClaim.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Method</span>
                <span className="text-gray-900 font-semibold capitalize">{paymentClaim.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700 font-medium">Claimed</span>
                <span className="text-gray-900 font-semibold">{new Date(paymentClaim.claimedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* Confirm Payment */}
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✓ Confirm Payment
            </button>

            {/* Request Evidence */}
            <button
              onClick={handleRequestEvidence}
              disabled={isSubmitting}
              className="w-full px-4 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4" />
              Request Evidence
            </button>

            {/* Reject Payment */}
            <button
              onClick={() => setShowRejectReason(!showRejectReason)}
              className="w-full px-4 py-2.5 border-2 border-red-300 text-red-700 rounded-lg font-semibold hover:bg-red-50 transition-colors"
            >
              ✗ Reject Claim
            </button>
          </div>

          {/* Rejection Reason Selector */}
          {showRejectReason && (
            <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <label className="block text-sm font-semibold text-gray-900">Why are you rejecting this claim?</label>
              
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select a reason...</option>
                {rejectionReasons.map((reason) => (
                  <option key={reason.id} value={reason.id}>
                    {reason.label}
                  </option>
                ))}
              </select>

              {rejectionReason && (
                <button
                  onClick={handleReject}
                  disabled={isSubmitting || !rejectionReason}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Confirm Rejection
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
          <p className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" />
            Rejecting will resume payment reminders to the client
          </p>
        </div>
      </div>
    </>
  );
};

export default PaymentVerificationModal;
```

## 4. Payment Timeline Component

```javascript
// PaymentTimeline.jsx - Visual timeline of invoice payment journey
import React from 'react';
import { Mail, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

const PaymentTimeline = ({ events = [] }) => {
  const getEventIcon = (type) => {
    const icons = {
      sent: <Mail className="w-4 h-4" />,
      opened: <Mail className="w-4 h-4" />,
      reminder_sent: <AlertCircle className="w-4 h-4" />,
      paid_claimed: <Clock className="w-4 h-4" />,
      payment_verified: <CheckCircle2 className="w-4 h-4" />,
      payment_rejected: <AlertCircle className="w-4 h-4" />,
      overdue: <AlertCircle className="w-4 h-4" />
    };
    return icons[type] || <Clock className="w-4 h-4" />;
  };

  const getEventColor = (type) => {
    const colors = {
      sent: 'text-blue-600 bg-blue-100',
      opened: 'text-blue-600 bg-blue-100',
      reminder_sent: 'text-yellow-600 bg-yellow-100',
      paid_claimed: 'text-purple-600 bg-purple-100',
      payment_verified: 'text-green-600 bg-green-100',
      payment_rejected: 'text-red-600 bg-red-100',
      overdue: 'text-red-600 bg-red-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getEventLabel = (type) => {
    const labels = {
      sent: 'Invoice sent',
      opened: 'Invoice opened',
      reminder_sent: 'Reminder sent',
      paid_claimed: 'Payment claimed',
      payment_verified: 'Payment verified',
      payment_rejected: 'Payment rejected',
      overdue: 'Invoice overdue'
    };
    return labels[type] || 'Event';
  };

  if (!events || events.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        <p>No timeline events yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {events.map((event, index) => (
        <div key={index} className="flex gap-4 pb-8 relative">
          {/* Connector Line */}
          {index < events.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
          )}

          {/* Icon Circle */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${getEventColor(event.type)} relative z-10`}>
            {getEventIcon(event.type)}
          </div>

          {/* Content */}
          <div className="flex-grow pt-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-gray-900">{getEventLabel(event.type)}</p>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                )}
              </div>
              <time className="text-sm text-gray-500 flex-shrink-0">
                {new Date(event.timestamp).toLocaleDateString('en-GB', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </time>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Sample data
const sampleEvents = [
  { type: 'sent', timestamp: '2025-11-10T09:00:00', description: 'Sent to john@company.com' },
  { type: 'opened', timestamp: '2025-11-10T10:30:00', description: 'Opened by client' },
  { type: 'reminder_sent', timestamp: '2025-11-15T14:00:00', description: 'Payment reminder sent' },
  { type: 'paid_claimed', timestamp: '2025-11-18T16:45:00', description: 'Client claimed payment via BACS' },
  { type: 'payment_verified', timestamp: '2025-11-19T09:15:00', description: 'Payment verified' }
];

export default PaymentTimeline;
```

## 5. Proof of Payment Upload Component

```javascript
// ProofOfPaymentUpload.jsx - Optional file upload for payment verification
import React, { useState } from 'react';
import { Upload, File, X, CheckCircle2 } from 'lucide-react';

const ProofOfPaymentUpload = ({ 
  invoiceId, 
  onUpload,
  isOptional = true,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['.pdf', '.jpg', '.jpeg', '.png']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadError, setUploadError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const validateFile = (file) => {
    if (file.size > maxFileSize) {
      return `File size must be less than ${maxFileSize / 1024 / 1024}MB`;
    }
    
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
    if (!acceptedFormats.includes(fileExtension)) {
      return `File type must be one of: ${acceptedFormats.join(', ')}`;
    }
    
    return null;
  };

  const handleFilesSelected = async (selectedFiles) => {
    const newFiles = Array.from(selectedFiles);
    let hasError = false;

    for (const file of newFiles) {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        hasError = true;
        break;
      }
    }

    if (!hasError) {
      setFiles([...files, ...newFiles]);
      setUploadError('');
      
      // Auto-upload
      if (onUpload) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          newFiles.forEach(file => formData.append('files', file));
          formData.append('invoiceId', invoiceId);

          await onUpload(formData);
        } catch (error) {
          setUploadError('Upload failed. Please try again.');
        } finally {
          setIsUploading(false);
        }
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesSelected(e.dataTransfer.files);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <div>
        <label className="block text-sm font-semibold text-gray-900 mb-1">
          {isOptional ? (
            <>
              Proof of Payment <span className="text-gray-500 font-normal">(Optional)</span>
            </>
          ) : (
            <>
              Proof of Payment <span className="text-red-600">*</span>
            </>
          )}
        </label>
        <p className="text-sm text-gray-600">
          Upload a bank statement screenshot, payment receipt, or confirmation email
        </p>
      </div>

      {/* Drag & Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-white hover:bg-gray-50'
        }`}
      >
        <Upload className={`w-8 h-8 mx-auto mb-3 ${isDragging ? 'text-blue-600' : 'text-gray-400'}`} />
        
        <p className="text-sm font-medium text-gray-900 mb-1">
          Drag files here or click to browse
        </p>
        <p className="text-xs text-gray-600">
          Accepted: {acceptedFormats.join(', ')} (max {maxFileSize / 1024 / 1024}MB)
        </p>

        <input
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
          id="proof-upload"
          aria-label="Upload proof of payment"
        />
        <label htmlFor="proof-upload" className="cursor-pointer" />
      </div>

      {/* Error Message */}
      {uploadError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {uploadError}
        </div>
      )}

      {/* Uploaded Files List */}
      {files.length > 0 && (
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase">
            Attached Files
          </label>
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded">
              <div className="flex items-center gap-3 min-w-0">
                <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-600 transition-colors"
                aria-label={`Remove ${file.name}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Success Message */}
      {files.length > 0 && !isUploading && (
        <div className="p-3 bg-green-50 border border-green-200 rounded flex items-center gap-2 text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          Files uploaded. We'll review them within 24 hours.
        </div>
      )}

      {/* Uploading Message */}
      {isUploading && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
          Uploading files...
        </div>
      )}
    </div>
  );
};

export default ProofOfPaymentUpload;
```

## 6. Collections Automation Control

```javascript
// CollectionsAutomation.jsx - Pause/Resume collection logic based on payment claims
import React, { useState } from 'react';
import { Pause, Play, AlertCircle } from 'lucide-react';

const CollectionsAutomation = ({ 
  invoiceId, 
  automationStatus = 'active',
  lastPaymentClaim = null,
  onPause,
  onResume 
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePause = async () => {
    setIsUpdating(true);
    try {
      await onPause?.(invoiceId);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResume = async () => {
    setIsUpdating(true);
    try {
      await onResume?.(invoiceId);
    } finally {
      setIsUpdating(false);
    }
  };

  const isPaused = automationStatus === 'paused';

  return (
    <div className={`p-4 rounded-lg border ${isPaused ? 'bg-yellow-50 border-yellow-200' : 'bg-green-50 border-green-200'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {isPaused ? (
              <>
                <Pause className="w-4 h-4 text-yellow-600" />
                <h3 className="font-semibold text-yellow-900">Collections Paused</h3>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-green-600" />
                <h3 className="font-semibold text-green-900">Collections Active</h3>
              </>
            )}
          </div>
          
          <p className={`text-sm ${isPaused ? 'text-yellow-800' : 'text-green-800'}`}>
            {isPaused 
              ? 'Payment reminders are paused. Reminders will resume if payment claim is rejected.'
              : 'Automatic payment reminders are scheduled and active.'
            }
          </p>

          {lastPaymentClaim && (
            <p className="text-xs text-gray-600 mt-2">
              Last claim: {new Date(lastPaymentClaim.claimedAt).toLocaleDateString()} via {lastPaymentClaim.paymentMethod}
            </p>
          )}
        </div>

        {/* Toggle Button */}
        <button
          onClick={isPaused ? handleResume : handlePause}
          disabled={isUpdating}
          className={`flex-shrink-0 px-4 py-2 rounded font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            isPaused
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isUpdating ? 'Updating...' : isPaused ? 'Resume' : 'Pause'}
        </button>
      </div>

      {/* Info Box */}
      <div className="mt-3 p-3 bg-white bg-opacity-50 border border-current border-opacity-10 rounded text-xs flex gap-2">
        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          When a payment is claimed, reminders pause automatically. If you reject the claim, reminders resume immediately.
        </p>
      </div>
    </div>
  );
};

export default CollectionsAutomation;
```

## 7. Accessible Payment Status Notification

```javascript
// PaymentStatusNotification.jsx - Accessible in-app notification
import React from 'react';
import { Bell, X } from 'lucide-react';

const PaymentStatusNotification = ({ 
  type = 'info', // 'info', 'warning', 'success', 'error'
  title,
  message,
  actionLabel,
  onAction,
  onDismiss,
  autoCloseDelay = 5000
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoCloseDelay && type !== 'warning' && type !== 'error') {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
  }, [autoCloseDelay, type, onDismiss]);

  if (!isVisible) return null;

  const typeConfig = {
    info: {
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-900',
      icon: 'text-blue-600',
      actionBg: 'bg-blue-600 hover:bg-blue-700'
    },
    success: {
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      textColor: 'text-green-900',
      icon: 'text-green-600',
      actionBg: 'bg-green-600 hover:bg-green-700'
    },
    warning: {
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-900',
      icon: 'text-yellow-600',
      actionBg: 'bg-yellow-600 hover:bg-yellow-700'
    },
    error: {
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      textColor: 'text-red-900',
      icon: 'text-red-600',
      actionBg: 'bg-red-600 hover:bg-red-700'
    }
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 flex items-start justify-between gap-4 shadow-sm`}
    >
      <div className="flex items-start gap-3 flex-1">
        <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.icon}`} />
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold ${config.textColor}`}>{title}</h4>
          <p className={`text-sm mt-1 ${config.textColor} opacity-90`}>{message}</p>
          
          {actionLabel && onAction && (
            <button
              onClick={onAction}
              className={`text-sm font-semibold mt-2 text-white px-3 py-1 rounded ${config.actionBg} transition-colors`}
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>

      {/* Dismiss Button */}
      <button
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className={`flex-shrink-0 ${config.icon} hover:opacity-75 transition-opacity`}
        aria-label="Dismiss notification"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
};

// Usage examples
const exampleNotifications = {
  paymentClaimed: {
    type: 'info',
    title: 'Payment Claimed',
    message: 'John Smith has claimed payment on Invoice #INV-123 via BACS. Please verify the payment.',
    actionLabel: 'Review Claim',
    onAction: () => console.log('Opening verification modal')
  },
  paymentVerified: {
    type: 'success',
    title: 'Payment Verified',
    message: 'Payment on Invoice #INV-123 has been confirmed. Collections have been closed.',
    autoCloseDelay: 5000
  },
  paymentRejected: {
    type: 'warning',
    title: 'Payment Claim Rejected',
    message: 'You rejected the payment claim on Invoice #INV-123. Reminders will resume tomorrow.',
    autoCloseDelay: null
  }
};

export default PaymentStatusNotification;
```

---

## Integration Best Practices

### Collections Automation Flow

```javascript
/**
 * When client clicks "I Paid":
 * 1. Open payment method selection modal
 * 2. Record payment claim with method, timestamp
 * 3. PAUSE collections automation immediately
 * 4. Send notification to freelancer
 * 5. Set invoice status to "pending_verification"
 * 
 * When freelancer confirms payment:
 * 1. Mark invoice as "paid"
 * 2. Stop collections automation permanently
 * 3. Send confirmation to client
 * 4. Record payment in financials
 * 
 * When freelancer rejects payment:
 * 1. Mark invoice status back to previous state (pending/overdue)
 * 2. RESUME collections automation
 * 3. Notify client with rejection reason
 * 4. (Optional) Request evidence of payment
 */

// Example API endpoints needed:
// POST   /api/invoices/:id/claim-payment
// POST   /api/invoices/:id/verify-payment
// POST   /api/invoices/:id/reject-payment
// POST   /api/invoices/:id/request-evidence
// PATCH  /api/invoices/:id/automation (pause/resume)
```

### Accessibility Checklist

- [ ] Payment status badges use `role="status"` with `aria-label`
- [ ] "I Paid" button has visible focus indicator (2-3px outline)
- [ ] Modal has `aria-modal="true"` and focus trap
- [ ] All form inputs have associated `<label>` elements
- [ ] Error messages associated via `aria-describedby`
- [ ] Timeline uses semantic `<time>` elements
- [ ] File upload dropzone announces drag state to screen readers
- [ ] Keyboard navigation: Tab through all interactive elements
- [ ] Color contrast: 7:1 for text (WCAG AAA)
- [ ] Touch targets minimum 48×48px on mobile

These components follow accessible design patterns and integrate seamlessly with Relay's invoice management system.
