import { db, Timestamp, COLLECTIONS } from '@/lib/firebase';
import { PaymentConfirmation, Transaction, Invoice } from '@/types/models';
import { NotFoundError } from '@/utils/error';
import { logDbOperation } from '@/utils/logger';
import { nanoid } from 'nanoid';
import { PAYMENT_CONFIRMATION_TOKEN_EXPIRY_DAYS, RECOUP_COMMISSION_RATE } from '@/utils/constants';
import crypto from 'crypto';

/**
 * Create payment confirmation record
 */
export async function createPaymentConfirmation(
  invoiceId: string,
  freelancerId: string,
  clientEmail: string,
  expectedAmount: number
): Promise<PaymentConfirmation> {
  const startTime = Date.now();

  const confirmation: PaymentConfirmation = {
    confirmationId: nanoid(),
    invoiceId,
    freelancerId,
    clientEmail,
    confirmationToken: crypto.randomUUID(),
    tokenExpiresAt: Timestamp.fromDate(
      new Date(Date.now() + PAYMENT_CONFIRMATION_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    ),
    status: 'pending_client',
    freelancerVerifiedReceived: false,
    expectedAmount,
    createdAt: Timestamp.now(),
    expiresAt: Timestamp.fromDate(
      new Date(Date.now() + PAYMENT_CONFIRMATION_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    ),
  };

  await db
    .collection(COLLECTIONS.PAYMENT_CONFIRMATIONS)
    .doc(confirmation.confirmationId)
    .set(confirmation);

  logDbOperation('create', COLLECTIONS.PAYMENT_CONFIRMATIONS, { confirmationId: confirmation.confirmationId, duration: Date.now() - startTime });

  return confirmation;
}

/**
 * Client confirms payment (no auth required - uses token)
 */
export async function clientConfirmPayment(
  confirmationToken: string,
  amount: number,
  paymentMethod: 'bank_transfer' | 'card',
  datePaid: string,
  clientNotes?: string
): Promise<PaymentConfirmation> {
  const startTime = Date.now();

  // Find confirmation by token
  const snapshot = await db
    .collection(COLLECTIONS.PAYMENT_CONFIRMATIONS)
    .where('confirmationToken', '==', confirmationToken)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new NotFoundError('Invalid confirmation token');
  }

  const confirmationDoc = snapshot.docs[0];
  const confirmation = confirmationDoc.data() as PaymentConfirmation;

  // Check token expiration
  if (confirmation.tokenExpiresAt.toDate() < new Date()) {
    throw new Error('Confirmation token has expired');
  }

  // Update confirmation
  const updates = {
    status: 'client_confirmed' as const,
    clientConfirmedAt: Timestamp.now(),
    clientConfirmedAmount: amount,
    clientPaymentMethod: paymentMethod,
    clientConfirmedDate: datePaid,
    clientNotes,
  };

  await confirmationDoc.ref.update(updates);

  logDbOperation('update', COLLECTIONS.PAYMENT_CONFIRMATIONS, { confirmationId: confirmation.confirmationId, duration: Date.now() - startTime });

  return { ...confirmation, ...updates };
}

/**
 * Freelancer verifies payment received
 */
export async function freelancerVerifyPayment(
  confirmationId: string,
  userId: string
): Promise<{ confirmation: PaymentConfirmation; transaction: Transaction }> {
  const startTime = Date.now();

  // Get confirmation
  const confirmationDoc = await db
    .collection(COLLECTIONS.PAYMENT_CONFIRMATIONS)
    .doc(confirmationId)
    .get();

  if (!confirmationDoc.exists) {
    throw new NotFoundError('Payment confirmation not found');
  }

  const confirmation = confirmationDoc.data() as PaymentConfirmation;

  // Verify ownership
  if (confirmation.freelancerId !== userId) {
    throw new NotFoundError('Payment confirmation not found');
  }

  // Check client already confirmed
  if (confirmation.status !== 'client_confirmed') {
    throw new Error('Client has not confirmed payment yet');
  }

  // Update confirmation status
  await confirmationDoc.ref.update({
    status: 'both_confirmed',
    freelancerConfirmedAt: Timestamp.now(),
    freelancerVerifiedReceived: true,
    actualAmountPaid: confirmation.amountPaid,
  });

  // Update invoice status to paid
  await db.collection(COLLECTIONS.INVOICES).doc(confirmation.invoiceId).update({
    status: 'paid',
    paidAt: Timestamp.now(),
    firstReminderSentAt: null,
    secondReminderSentAt: null,
  });

  // Create transaction record
  const amount = confirmation.amountPaid || confirmation.expectedAmount;
  const transaction: Transaction = {
    transactionId: nanoid(),
    invoiceId: confirmation.invoiceId,
    freelancerId: userId,
    amount,
    paymentMethod: confirmation.clientPaymentMethod || 'bank_transfer',
    recoupCommission: amount * RECOUP_COMMISSION_RATE,
    freelancerNet: amount * (1 - RECOUP_COMMISSION_RATE),
    commissionRate: RECOUP_COMMISSION_RATE,
    status: 'completed',
    transactionDate: Timestamp.now(),
    completedAt: Timestamp.now(),
    createdAt: Timestamp.now(),
  };

  await db
    .collection(COLLECTIONS.TRANSACTIONS)
    .doc(transaction.transactionId)
    .set(transaction);

  logDbOperation('verify_payment', COLLECTIONS.PAYMENT_CONFIRMATIONS, { confirmationId, duration: Date.now() - startTime });

  return {
    confirmation: { ...confirmation, status: 'both_confirmed' },
    transaction,
  };
}

/**
 * Get payment confirmation by ID
 */
export async function getPaymentConfirmation(
  confirmationId: string,
  userId: string
): Promise<PaymentConfirmation> {
  const doc = await db
    .collection(COLLECTIONS.PAYMENT_CONFIRMATIONS)
    .doc(confirmationId)
    .get();

  if (!doc.exists) {
    throw new NotFoundError('Payment confirmation not found');
  }

  const confirmation = doc.data() as PaymentConfirmation;

  // Verify ownership
  if (confirmation.freelancerId !== userId) {
    throw new NotFoundError('Payment confirmation not found');
  }

  return confirmation;
}

/**
 * Get payment confirmation by token (no auth required)
 */
export async function getPaymentConfirmationByToken(
  token: string
): Promise<PaymentConfirmation> {
  const snapshot = await db
    .collection(COLLECTIONS.PAYMENT_CONFIRMATIONS)
    .where('confirmationToken', '==', token)
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new NotFoundError('Invalid confirmation token');
  }

  const confirmation = snapshot.docs[0].data() as PaymentConfirmation;

  // Check token expiration
  if (confirmation.tokenExpiresAt.toDate() < new Date()) {
    throw new Error('Confirmation token has expired');
  }

  return confirmation;
}

/**
 * List payment confirmations for an invoice
 */
export async function listPaymentConfirmations(
  invoiceId: string,
  userId: string
): Promise<PaymentConfirmation[]> {
  const snapshot = await db
    .collection(COLLECTIONS.PAYMENT_CONFIRMATIONS)
    .where('invoiceId', '==', invoiceId)
    .where('freelancerId', '==', userId)
    .orderBy('createdAt', 'desc')
    .get();

  return snapshot.docs.map((doc) => doc.data() as PaymentConfirmation);
}
