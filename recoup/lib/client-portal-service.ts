/**
 * Client Portal Service
 * Self-service portal for clients to view invoices, make payments, and communicate
 */

import { logger } from '@/utils/logger';
import { createHash, randomBytes } from 'crypto';

export interface ClientPortalAccess {
  clientId: string;
  email: string;
  accessToken: string; // Secure token for portal access
  portalUrl: string;
  isActive: boolean;
  expiresAt?: Date; // Optional expiry
  lastAccessedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPortalSettings {
  userId: string; // Business owner
  enabled: boolean;
  customDomain?: string; // e.g., portal.yourbusiness.com
  branding: {
    logoUrl?: string;
    primaryColor?: string;
    companyName: string;
  };
  features: {
    viewInvoices: boolean;
    viewEstimates: boolean;
    makePayments: boolean;
    uploadDocuments: boolean;
    messaging: boolean;
    viewPaymentHistory: boolean;
  };
  notifications: {
    notifyOnNewInvoice: boolean;
    notifyOnPaymentReceived: boolean;
    notifyOnMessage: boolean;
  };
  paymentMethods: {
    stripe: boolean;
    paypal: boolean;
    bankTransfer: boolean;
  };
  termsAndConditions?: string;
  welcomeMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClientPortalInvoice {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
  issueDate: Date;
  dueDate: Date;
  description: string;
  lineItems: Array<{
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }>;
  pdfUrl?: string;
  paymentUrl?: string; // Payment link
  viewUrl: string; // Portal view URL
  canPay: boolean;
}

export interface ClientPortalMessage {
  id: string;
  clientId: string;
  userId: string;
  sender: 'client' | 'business';
  senderName: string;
  subject: string;
  message: string;
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
  isRead: boolean;
  createdAt: Date;
}

export interface ClientPortalDocument {
  id: string;
  clientId: string;
  userId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: 'client' | 'business';
  description?: string;
  category?: 'contract' | 'receipt' | 'other';
  createdAt: Date;
}

export interface ClientPortalPayment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  method: 'stripe' | 'paypal' | 'bank_transfer';
  status: 'pending' | 'completed' | 'failed';
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
}

// ==============================================================================
// PORTAL ACCESS MANAGEMENT
// ==============================================================================

/**
 * Generate secure access token for client portal
 */
export function generatePortalAccessToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create portal access for client
 */
export function createPortalAccess(params: {
  clientId: string;
  email: string;
  baseUrl: string;
  expiryDays?: number;
}): ClientPortalAccess {
  const { clientId, email, baseUrl, expiryDays } = params;

  const accessToken = generatePortalAccessToken();
  const portalUrl = `${baseUrl}/portal/${accessToken}`;

  const expiresAt = expiryDays
    ? new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000)
    : undefined;

  const access: ClientPortalAccess = {
    clientId,
    email,
    accessToken,
    portalUrl,
    isActive: true,
    expiresAt,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info('Created client portal access', {
    clientId,
    email,
    expiresAt: expiresAt?.toISOString(),
  });

  return access;
}

/**
 * Verify portal access token
 */
export function verifyPortalAccess(params: {
  accessToken: string;
  access: ClientPortalAccess;
}): {
  valid: boolean;
  reason?: string;
} {
  const { accessToken, access } = params;

  if (!access.isActive) {
    return { valid: false, reason: 'Access has been revoked' };
  }

  if (access.accessToken !== accessToken) {
    return { valid: false, reason: 'Invalid access token' };
  }

  if (access.expiresAt && new Date() > access.expiresAt) {
    return { valid: false, reason: 'Access token has expired' };
  }

  return { valid: true };
}

/**
 * Revoke portal access
 */
export function revokePortalAccess(access: ClientPortalAccess): ClientPortalAccess {
  return {
    ...access,
    isActive: false,
    updatedAt: new Date(),
  };
}

/**
 * Refresh portal access (extend expiry)
 */
export function refreshPortalAccess(params: {
  access: ClientPortalAccess;
  expiryDays: number;
}): ClientPortalAccess {
  const expiresAt = new Date(Date.now() + params.expiryDays * 24 * 60 * 60 * 1000);

  return {
    ...params.access,
    expiresAt,
    updatedAt: new Date(),
  };
}

// ==============================================================================
// PORTAL DATA AGGREGATION
// ==============================================================================

/**
 * Get client portal dashboard data
 */
export async function getClientPortalDashboard(params: {
  clientId: string;
  userId: string;
}): Promise<{
  summary: {
    totalInvoiced: number;
    totalPaid: number;
    totalOutstanding: number;
    overdueCount: number;
  };
  recentInvoices: ClientPortalInvoice[];
  recentPayments: ClientPortalPayment[];
  unreadMessages: number;
}> {
  const { clientId, userId } = params;

  // TODO: Fetch from database
  // This is a placeholder structure

  return {
    summary: {
      totalInvoiced: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      overdueCount: 0,
    },
    recentInvoices: [],
    recentPayments: [],
    unreadMessages: 0,
  };
}

/**
 * Format invoice for client portal display
 */
export function formatInvoiceForPortal(params: {
  invoice: any; // Use actual Invoice type
  portalSettings: ClientPortalSettings;
  baseUrl: string;
}): ClientPortalInvoice {
  const { invoice, portalSettings, baseUrl } = params;

  const amountDue = invoice.totalAmount - (invoice.amountPaid || 0);
  const canPay = portalSettings.features.makePayments && amountDue > 0;

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    amount: invoice.totalAmount,
    amountPaid: invoice.amountPaid || 0,
    amountDue,
    currency: invoice.currency || 'GBP',
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    description: invoice.description || `Invoice ${invoice.invoiceNumber}`,
    lineItems: invoice.lineItems || [],
    pdfUrl: invoice.pdfUrl,
    paymentUrl: canPay ? `${baseUrl}/portal/pay/${invoice.id}` : undefined,
    viewUrl: `${baseUrl}/portal/invoice/${invoice.id}`,
    canPay,
  };
}

// ==============================================================================
// MESSAGING
// ==============================================================================

/**
 * Send message from business to client
 */
export function sendMessageToClient(params: {
  clientId: string;
  userId: string;
  senderName: string;
  subject: string;
  message: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
}): ClientPortalMessage {
  const { clientId, userId, senderName, subject, message, attachments = [] } = params;

  const msg: ClientPortalMessage = {
    id: generateId(),
    clientId,
    userId,
    sender: 'business',
    senderName,
    subject,
    message,
    attachments,
    isRead: false,
    createdAt: new Date(),
  };

  logger.info('Sent message to client', {
    clientId,
    subject,
  });

  return msg;
}

/**
 * Send message from client to business
 */
export function sendMessageToBusiness(params: {
  clientId: string;
  userId: string;
  senderName: string;
  subject: string;
  message: string;
  attachments?: Array<{
    filename: string;
    url: string;
    size: number;
  }>;
}): ClientPortalMessage {
  const { clientId, userId, senderName, subject, message, attachments = [] } = params;

  const msg: ClientPortalMessage = {
    id: generateId(),
    clientId,
    userId,
    sender: 'client',
    senderName,
    subject,
    message,
    attachments,
    isRead: false,
    createdAt: new Date(),
  };

  logger.info('Received message from client', {
    clientId,
    subject,
  });

  return msg;
}

/**
 * Mark message as read
 */
export function markMessageRead(message: ClientPortalMessage): ClientPortalMessage {
  return {
    ...message,
    isRead: true,
  };
}

// ==============================================================================
// DOCUMENT MANAGEMENT
// ==============================================================================

/**
 * Upload document to client portal
 */
export function uploadDocument(params: {
  clientId: string;
  userId: string;
  filename: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: 'client' | 'business';
  description?: string;
  category?: 'contract' | 'receipt' | 'other';
}): ClientPortalDocument {
  const doc: ClientPortalDocument = {
    id: generateId(),
    clientId: params.clientId,
    userId: params.userId,
    filename: params.filename,
    fileUrl: params.fileUrl,
    fileSize: params.fileSize,
    fileType: params.fileType,
    uploadedBy: params.uploadedBy,
    description: params.description,
    category: params.category,
    createdAt: new Date(),
  };

  logger.info('Document uploaded to portal', {
    clientId: params.clientId,
    filename: params.filename,
    uploadedBy: params.uploadedBy,
  });

  return doc;
}

// ==============================================================================
// PAYMENT PROCESSING
// ==============================================================================

/**
 * Create payment intent for invoice
 */
export async function createPortalPaymentIntent(params: {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  clientEmail: string;
  method: 'stripe' | 'paypal' | 'bank_transfer';
}): Promise<{
  payment: ClientPortalPayment;
  paymentUrl?: string;
  instructions?: string;
}> {
  const { invoiceId, invoiceNumber, amount, currency, clientEmail, method } = params;

  const payment: ClientPortalPayment = {
    id: generateId(),
    invoiceId,
    invoiceNumber,
    amount,
    currency,
    method,
    status: 'pending',
    createdAt: new Date(),
  };

  let paymentUrl: string | undefined;
  let instructions: string | undefined;

  if (method === 'stripe') {
    // TODO: Create Stripe payment intent
    paymentUrl = `https://checkout.stripe.com/pay/${payment.id}`;
  } else if (method === 'paypal') {
    // TODO: Create PayPal payment
    paymentUrl = `https://www.paypal.com/invoice/${payment.id}`;
  } else if (method === 'bank_transfer') {
    instructions = `Please transfer £${amount.toFixed(2)} to:
Account Name: [Your Business]
Sort Code: XX-XX-XX
Account Number: XXXXXXXX
Reference: ${invoiceNumber}`;
  }

  logger.info('Created portal payment intent', {
    invoiceId,
    amount,
    method,
  });

  return {
    payment,
    paymentUrl,
    instructions,
  };
}

/**
 * Process payment webhook (Stripe/PayPal callback)
 */
export function processPaymentWebhook(params: {
  paymentId: string;
  status: 'completed' | 'failed';
  transactionId?: string;
}): ClientPortalPayment {
  const { paymentId, status, transactionId } = params;

  // TODO: Update payment in database

  logger.info('Processed payment webhook', {
    paymentId,
    status,
    transactionId,
  });

  return {
    id: paymentId,
    invoiceId: '',
    invoiceNumber: '',
    amount: 0,
    currency: 'GBP',
    method: 'stripe',
    status,
    transactionId,
    paidAt: status === 'completed' ? new Date() : undefined,
    createdAt: new Date(),
  };
}

// ==============================================================================
// NOTIFICATIONS
// ==============================================================================

/**
 * Send portal invitation email
 */
export async function sendPortalInvitation(params: {
  clientEmail: string;
  clientName: string;
  businessName: string;
  portalUrl: string;
  welcomeMessage?: string;
}): Promise<void> {
  const { clientEmail, clientName, businessName, portalUrl, welcomeMessage } = params;

  // TODO: Integrate with notification service

  logger.info('Sent portal invitation', {
    clientEmail,
    portalUrl,
  });
}

/**
 * Send new invoice notification to client portal
 */
export async function notifyClientNewInvoice(params: {
  clientEmail: string;
  clientName: string;
  invoice: ClientPortalInvoice;
  portalUrl: string;
}): Promise<void> {
  const { clientEmail, clientName, invoice, portalUrl } = params;

  // TODO: Integrate with notification service

  logger.info('Notified client of new invoice', {
    clientEmail,
    invoiceNumber: invoice.invoiceNumber,
  });
}

// ==============================================================================
// TIER LIMITS
// ==============================================================================

/**
 * Check tier limits for client portal
 */
export function checkClientPortalLimit(params: {
  tier: 'free' | 'starter' | 'professional' | 'business';
}): {
  allowed: boolean;
  features: ClientPortalSettings['features'];
  branding: {
    customDomain: boolean;
    customLogo: boolean;
    whiteLabel: boolean;
  };
} {
  const tiers = {
    free: {
      allowed: false,
      features: {
        viewInvoices: false,
        viewEstimates: false,
        makePayments: false,
        uploadDocuments: false,
        messaging: false,
        viewPaymentHistory: false,
      },
      branding: {
        customDomain: false,
        customLogo: false,
        whiteLabel: false,
      },
    },
    starter: {
      allowed: true,
      features: {
        viewInvoices: true,
        viewEstimates: true,
        makePayments: true,
        uploadDocuments: true,
        messaging: true,
        viewPaymentHistory: true,
      },
      branding: {
        customDomain: false,
        customLogo: true,
        whiteLabel: false,
      },
    },
    professional: {
      allowed: true,
      features: {
        viewInvoices: true,
        viewEstimates: true,
        makePayments: true,
        uploadDocuments: true,
        messaging: true,
        viewPaymentHistory: true,
      },
      branding: {
        customDomain: true,
        customLogo: true,
        whiteLabel: false,
      },
    },
    business: {
      allowed: true,
      features: {
        viewInvoices: true,
        viewEstimates: true,
        makePayments: true,
        uploadDocuments: true,
        messaging: true,
        viewPaymentHistory: true,
      },
      branding: {
        customDomain: true,
        customLogo: true,
        whiteLabel: true, // No "Powered by Recoup" branding
      },
    },
  };

  return tiers[params.tier];
}

// ==============================================================================
// UTILITIES
// ==============================================================================

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
