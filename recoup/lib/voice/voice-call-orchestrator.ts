/**
 * Voice Call Orchestration Service
 * Coordinates AI-powered collection calls using Twilio + OpenAI Realtime API
 *
 * Features:
 * - Initiate collection calls
 * - Track call status and outcomes
 * - Record payment promises and disputes
 * - Calculate costs
 * - Analytics and reporting
 *
 * Cost Estimation (5-minute call):
 * - Twilio: £0.065 (£0.013/min)
 * - OpenAI Realtime: £1.50 (£0.30/min)
 * - Total: ~£1.57 per call
 */

import { initiateCall, getCallStatus, CallResult, CallStatus } from '@/lib/voice/twilio-client';
import { logInfo, logError } from '@/utils/logger';

/**
 * Collection call parameters
 */
export interface CollectionCallParams {
  // Invoice details
  invoiceId: string;
  invoiceReference: string;
  amount: number;
  dueDate: string;
  daysPastDue: number;

  // Business details
  freelancerId: string;
  businessName: string;

  // Customer details
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;

  // Call options
  recordCall?: boolean;
  enableVoicemailDetection?: boolean;
  maxRetries?: number;
}

/**
 * Call outcome
 */
export type CallOutcome =
  | 'payment_promised'
  | 'disputed'
  | 'refused_to_pay'
  | 'no_answer'
  | 'voicemail'
  | 'wrong_number'
  | 'call_back_requested'
  | 'in_progress'
  | 'failed';

/**
 * Collection call result
 */
export interface CollectionCallResult {
  success: boolean;
  callSid?: string;
  outcome?: CallOutcome;
  promiseDate?: string;
  disputeReason?: string;
  notes?: string;
  duration?: number; // seconds
  cost?: number; // GBP
  error?: string;
}

/**
 * Initiate an AI-powered collection call
 */
export async function initiateCollectionCall(
  params: CollectionCallParams
): Promise<CollectionCallResult> {
  const startTime = Date.now();

  try {
    logInfo('Initiating collection call', {
      invoiceId: params.invoiceId,
      clientName: params.clientName,
      amount: params.amount,
      daysPastDue: params.daysPastDue
    });

    // Validate parameters
    if (!params.clientPhone) {
      throw new Error('Client phone number is required');
    }

    if (!params.businessName) {
      throw new Error('Business name is required');
    }

    // Get base URL for TwiML endpoint
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://recoup.app';
    const twimlUrl = `${baseUrl}/api/voice/twiml`;

    // Add metadata as query parameters
    const twimlUrlWithParams = new URL(twimlUrl);
    twimlUrlWithParams.searchParams.set('invoiceId', params.invoiceId);
    twimlUrlWithParams.searchParams.set('clientId', params.clientId);
    twimlUrlWithParams.searchParams.set('businessName', params.businessName);
    twimlUrlWithParams.searchParams.set('clientName', params.clientName);
    twimlUrlWithParams.searchParams.set('invoiceReference', params.invoiceReference);
    twimlUrlWithParams.searchParams.set('amount', params.amount.toString());
    twimlUrlWithParams.searchParams.set('dueDate', params.dueDate);
    twimlUrlWithParams.searchParams.set('daysPastDue', params.daysPastDue.toString());

    // Initiate call via Twilio
    const callResult = await initiateCall({
      to: params.clientPhone,
      twimlUrl: twimlUrlWithParams.toString(),
      statusCallback: `${baseUrl}/api/voice/twiml/status`,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      record: params.recordCall !== false,
      timeout: 60,
      machineDetection: params.enableVoicemailDetection !== false ? 'Enable' : undefined
    });

    if (!callResult.success) {
      throw new Error(callResult.error || 'Call initiation failed');
    }

    const latency = Date.now() - startTime;

    logInfo('Collection call initiated', {
      callSid: callResult.callSid,
      status: callResult.status,
      latency_ms: latency
    });

    return {
      success: true,
      callSid: callResult.callSid,
      outcome: 'in_progress'
    };
  } catch (error) {
    const latency = Date.now() - startTime;

    logError('Failed to initiate collection call', error as Error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get call outcome and details
 */
export async function getCollectionCallOutcome(callSid: string): Promise<CollectionCallResult> {
  try {
    // Fetch from database for full details
    const { db } = await import('@/lib/firebase');

    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (!attemptSnapshot.empty) {
      const attemptData = attemptSnapshot.docs[0].data();

      return {
        success: true,
        callSid,
        outcome: attemptData.callOutcome || 'in_progress',
        promiseDate: attemptData.promiseDate,
        disputeReason: attemptData.disputeReason,
        notes: attemptData.callNotes || attemptData.resultDetails,
        duration: attemptData.callDuration,
        cost: attemptData.actualCost
      };
    }

    // Fall back to Twilio status if not in database yet
    const status = await getCallStatus(callSid);

    let outcome: CallOutcome;

    switch (status) {
      case 'completed':
        outcome = 'in_progress'; // Still processing
        break;
      case 'busy':
      case 'no-answer':
        outcome = 'no_answer';
        break;
      case 'failed':
        outcome = 'failed';
        break;
      default:
        outcome = 'in_progress';
    }

    return {
      success: true,
      callSid,
      outcome
    };
  } catch (error) {
    logError('Failed to get call outcome', error as Error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Record payment promise from call
 */
export async function recordPaymentPromise(
  callSid: string,
  invoiceId: string,
  promiseDate: string,
  notes?: string
): Promise<boolean> {
  try {
    logInfo('Recording payment promise', {
      callSid,
      invoiceId,
      promiseDate,
      notes
    });

    const { db, FieldValue, Timestamp } = await import('@/lib/firebase');

    // Get the collection attempt record
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (attemptSnapshot.empty) {
      logError('Collection attempt not found for callSid', new Error(`CallSid: ${callSid}`));
      return false;
    }

    const attemptDoc = attemptSnapshot.docs[0];
    const attemptData = attemptDoc.data();

    // Update collection attempt with payment promise
    await attemptDoc.ref.update({
      callOutcome: 'payment_promised',
      promiseDate,
      callNotes: notes || 'Customer promised to pay',
      result: 'success',
      resultDetails: `Payment promised by ${promiseDate}`,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update invoice with payment promise
    const promiseDateObj = new Date(promiseDate);
    await db.collection('invoices').doc(invoiceId).update({
      paymentPromiseDate: Timestamp.fromDate(promiseDateObj),
      paymentPromiseNotes: notes,
      status: 'payment_promised', // Custom status for promised payments
      updatedAt: FieldValue.serverTimestamp()
    });

    // Create follow-up reminder for promise date
    const reminderDate = new Date(promiseDateObj);
    reminderDate.setDate(reminderDate.getDate() + 1); // Day after promise date

    await db.collection('scheduled_tasks').add({
      taskType: 'payment_promise_followup',
      invoiceId,
      freelancerId: attemptData.freelancerId,
      scheduledFor: Timestamp.fromDate(reminderDate),
      metadata: {
        callSid,
        promiseDate,
        notes
      },
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    });

    // Notify freelancer
    await db.collection('notifications').add({
      userId: attemptData.freelancerId,
      type: 'payment_promised',
      title: 'Payment Promise Received',
      message: `Customer promised to pay invoice by ${promiseDate}. ${notes || ''}`,
      read: false,
      actionUrl: `/invoices/${invoiceId}`,
      metadata: {
        invoiceId,
        callSid,
        promiseDate
      },
      createdAt: FieldValue.serverTimestamp()
    });

    logInfo('Payment promise recorded successfully', {
      callSid,
      invoiceId,
      promiseDate
    });

    return true;
  } catch (error) {
    logError('Failed to record payment promise', error as Error);
    return false;
  }
}

/**
 * Record dispute from call
 */
export async function recordDispute(
  callSid: string,
  invoiceId: string,
  reason: string,
  notes?: string
): Promise<boolean> {
  try {
    logInfo('Recording dispute', {
      callSid,
      invoiceId,
      reason,
      notes
    });

    const { db, FieldValue } = await import('@/lib/firebase');

    // Get the collection attempt record
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (attemptSnapshot.empty) {
      logError('Collection attempt not found for callSid', new Error(`CallSid: ${callSid}`));
      return false;
    }

    const attemptDoc = attemptSnapshot.docs[0];
    const attemptData = attemptDoc.data();

    // Update collection attempt with dispute
    await attemptDoc.ref.update({
      callOutcome: 'disputed',
      disputeReason: reason,
      callNotes: notes || 'Customer disputed invoice',
      result: 'disputed',
      resultDetails: `Dispute: ${reason}`,
      updatedAt: FieldValue.serverTimestamp()
    });

    // Update invoice status to disputed
    await db.collection('invoices').doc(invoiceId).update({
      status: 'disputed',
      disputeReason: reason,
      disputeNotes: notes,
      disputeDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Create dispute record for tracking
    await db.collection('disputes').add({
      invoiceId,
      freelancerId: attemptData.freelancerId,
      clientId: attemptData.clientId || null,
      reason,
      notes,
      source: 'ai_voice_call',
      callSid,
      status: 'open',
      priority: 'high', // Disputes from calls are high priority
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });

    // Notify freelancer about dispute
    await db.collection('notifications').add({
      userId: attemptData.freelancerId,
      type: 'invoice_disputed',
      title: 'Invoice Disputed',
      message: `Customer disputed invoice during collection call. Reason: ${reason}`,
      read: false,
      priority: 'high',
      actionUrl: `/invoices/${invoiceId}`,
      metadata: {
        invoiceId,
        callSid,
        reason,
        notes
      },
      createdAt: FieldValue.serverTimestamp()
    });

    // Create task for freelancer to resolve dispute
    await db.collection('scheduled_tasks').add({
      taskType: 'dispute_resolution',
      invoiceId,
      freelancerId: attemptData.freelancerId,
      scheduledFor: FieldValue.serverTimestamp(), // Immediate
      priority: 'high',
      metadata: {
        callSid,
        reason,
        notes
      },
      status: 'pending',
      createdAt: FieldValue.serverTimestamp()
    });

    logInfo('Dispute recorded successfully', {
      callSid,
      invoiceId,
      reason
    });

    return true;
  } catch (error) {
    logError('Failed to record dispute', error as Error);
    return false;
  }
}

/**
 * Estimate cost of a collection call
 */
export function estimateCollectionCallCost(
  estimatedDurationMinutes: number = 5
): {
  twilioCost: number;
  openaiCost: number;
  totalCost: number;
} {
  // Twilio costs (UK rates)
  const TWILIO_CALL_COST_PER_MIN = 0.013; // £0.013/min
  const TWILIO_RECORDING_COST_PER_MIN = 0.002; // £0.002/min
  const twilioCost = estimatedDurationMinutes * (TWILIO_CALL_COST_PER_MIN + TWILIO_RECORDING_COST_PER_MIN);

  // OpenAI Realtime API costs
  const OPENAI_AUDIO_INPUT_COST_PER_MIN = 0.06; // £0.06/min
  const OPENAI_AUDIO_OUTPUT_COST_PER_MIN = 0.24; // £0.24/min
  const openaiCost = estimatedDurationMinutes * (OPENAI_AUDIO_INPUT_COST_PER_MIN + OPENAI_AUDIO_OUTPUT_COST_PER_MIN);

  const totalCost = twilioCost + openaiCost;

  return {
    twilioCost: Number(twilioCost.toFixed(3)),
    openaiCost: Number(openaiCost.toFixed(3)),
    totalCost: Number(totalCost.toFixed(2))
  };
}

/**
 * Check if user has access to voice calling (Pro tier only)
 */
export function canAccessVoiceCalling(userTier: string): boolean {
  return userTier === 'pro';
}

/**
 * Get voice calling usage limits
 */
export function getVoiceCallingLimits(userTier: string): {
  maxCallsPerMonth: number;
  maxCallDurationMinutes: number;
} {
  // Pro tier limits
  if (userTier === 'pro') {
    return {
      maxCallsPerMonth: 100, // 100 calls per month
      maxCallDurationMinutes: 10 // 10 minutes max per call
    };
  }

  // Not available for other tiers
  return {
    maxCallsPerMonth: 0,
    maxCallDurationMinutes: 0
  };
}

/**
 * Calculate monthly voice calling cost for user
 */
export function calculateMonthlyVoiceCost(
  callsPerMonth: number,
  avgDurationMinutes: number
): number {
  const { totalCost } = estimateCollectionCallCost(avgDurationMinutes);
  return Number((callsPerMonth * totalCost).toFixed(2));
}

/**
 * Validate if call should be made (business rules)
 */
export function validateCollectionCall(params: CollectionCallParams): {
  valid: boolean;
  reason?: string;
} {
  // Must be at least 7 days overdue
  if (params.daysPastDue < 7) {
    return {
      valid: false,
      reason: 'Invoice must be at least 7 days overdue before making collection calls'
    };
  }

  // Must have valid phone number (UK format)
  const ukPhoneRegex = /^(\+44|0)[1-9]\d{9,10}$/;
  if (!ukPhoneRegex.test(params.clientPhone.replace(/\s/g, ''))) {
    return {
      valid: false,
      reason: 'Invalid UK phone number'
    };
  }

  // Amount must be significant enough (minimum £100)
  if (params.amount < 100) {
    return {
      valid: false,
      reason: 'Invoice amount must be at least £100 for automated collection calls'
    };
  }

  return { valid: true };
}
