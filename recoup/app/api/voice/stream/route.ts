/**
 * WebSocket Streaming Endpoint for Voice Calls
 * WS /api/voice/stream
 *
 * Bridges Twilio audio stream with OpenAI Realtime API
 *
 * Flow:
 * 1. Twilio connects via WebSocket (sends μ-law audio)
 * 2. We connect to OpenAI Realtime API
 * 3. Bridge audio bidirectionally:
 *    - Twilio audio → OpenAI (customer speaking)
 *    - OpenAI audio → Twilio (AI speaking)
 * 4. Handle function calls from OpenAI
 * 5. Track call metrics and outcomes
 *
 * CRITICAL: This uses Next.js API routes with WebSocket upgrade
 * For production, consider using a separate WebSocket server
 */

import { NextRequest } from 'next/server';
import { WebSocket, WebSocketServer } from 'ws';
import { OpenAIRealtimeClient, createCollectionCallClient } from '@/lib/voice/openai-realtime-client';
import { logInfo, logError } from '@/utils/logger';

// Store active call sessions
const activeSessions = new Map<string, {
  twilioWs: WebSocket;
  openaiClient: OpenAIRealtimeClient;
  callSid: string;
  startTime: Date;
  metadata: any;
}>();

/**
 * Handle WebSocket upgrade for voice streaming
 * Next.js doesn't natively support WebSockets in API routes,
 * so this is a special handler that will be configured separately
 */
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const callSid = searchParams.get('callSid');

  if (!callSid) {
    return new Response('Missing callSid parameter', { status: 400 });
  }

  // For Next.js, we return instructions on how to upgrade
  // The actual WebSocket handling is done in a custom server or edge function
  return new Response(
    JSON.stringify({
      message: 'WebSocket endpoint ready',
      callSid,
      protocol: 'wss',
      instructions: 'Upgrade to WebSocket connection'
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
}

/**
 * Handle incoming WebSocket connection from Twilio
 * This function should be called when WebSocket upgrade happens
 */
export async function handleWebSocketConnection(
  twilioWs: WebSocket,
  callSid: string,
  metadata: {
    businessName: string;
    recipientName: string;
    invoiceReference: string;
    amount: number;
    dueDate: string;
    daysPastDue: number;
    invoiceId: string;
  }
): Promise<void> {
  logInfo('WebSocket connection established', { callSid });

  try {
    // Create OpenAI Realtime API client
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const openaiClient = createCollectionCallClient(
      process.env.OPENAI_API_KEY,
      metadata
    );

    // Connect to OpenAI Realtime API
    await openaiClient.connect();

    // Store session
    activeSessions.set(callSid, {
      twilioWs,
      openaiClient,
      callSid,
      startTime: new Date(),
      metadata
    });

    // Set up event handlers for OpenAI Realtime API
    setupOpenAIEventHandlers(openaiClient, twilioWs, callSid, metadata);

    // Set up Twilio WebSocket handlers
    setupTwilioWebSocketHandlers(twilioWs, openaiClient, callSid);

    logInfo('Voice streaming bridge established', { callSid });
  } catch (error) {
    logError('Failed to establish voice streaming bridge', error as Error);

    twilioWs.close();
  }
}

/**
 * Set up OpenAI Realtime API event handlers
 */
function setupOpenAIEventHandlers(
  openaiClient: OpenAIRealtimeClient,
  twilioWs: WebSocket,
  callSid: string,
  metadata: any
): void {
  // Handle audio output from OpenAI (AI speaking)
  openaiClient.on('response.audio.delta', (event) => {
    // Send audio to Twilio
    const audioData = event.delta; // Base64-encoded μ-law audio

    if (twilioWs.readyState === WebSocket.OPEN) {
      twilioWs.send(
        JSON.stringify({
          event: 'media',
          streamSid: callSid,
          media: {
            payload: audioData
          }
        })
      );
    }
  });

  // Handle audio transcript (for logging)
  openaiClient.on('response.audio_transcript.done', (event) => {
    logInfo('AI spoke', {
      callSid,
      transcript: event.transcript
    });
  });

  // Handle function calls
  openaiClient.on('response.function_call_arguments.done', async (event) => {
    const functionName = event.name;
    const args = JSON.parse(event.arguments);

    logInfo('Function call from AI', {
      callSid,
      function: functionName,
      arguments: args
    });

    // Handle different function calls
    try {
      switch (functionName) {
        case 'record_payment_promise':
          await handlePaymentPromise(callSid, args, openaiClient);
          break;

        case 'record_dispute':
          await handleDispute(callSid, args, openaiClient);
          break;

        case 'offer_payment_plan':
          await handlePaymentPlan(callSid, args, openaiClient);
          break;

        case 'rebook_call':
          await handleRebookCall(callSid, args, openaiClient);
          break;

        case 'check_invoice_details':
          await handleCheckInvoiceDetails(callSid, args, openaiClient);
          break;

        case 'flag_vulnerable_customer':
          await handleVulnerableFlag(callSid, args, openaiClient);
          break;

        case 'record_refusal':
          await handleRefusal(callSid, args, openaiClient);
          break;

        default:
          logError('Unknown function call', new Error(`Unknown function: ${functionName}`));
      }
    } catch (error) {
      logError('Error handling function call', error as Error);
    }
  });

  // Handle errors
  openaiClient.on('error', (event) => {
    logError('OpenAI Realtime API error', new Error(event.error?.message || 'Unknown error'));
  });

  // Handle session end
  openaiClient.on('response.done', (event) => {
    logInfo('Response completed', { callSid });
  });
}

/**
 * Set up Twilio WebSocket handlers
 */
function setupTwilioWebSocketHandlers(
  twilioWs: WebSocket,
  openaiClient: OpenAIRealtimeClient,
  callSid: string
): void {
  let streamSid: string | null = null;

  twilioWs.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.event) {
        case 'start':
          streamSid = message.start.streamSid;
          logInfo('Twilio stream started', { callSid, streamSid });

          // Start AI conversation
          openaiClient.createResponse(
            'Greet the customer and explain why you are calling.'
          );
          break;

        case 'media':
          // Audio from customer (μ-law format)
          const audioPayload = message.media.payload;

          // Send to OpenAI Realtime API
          openaiClient.appendAudio(audioPayload);
          break;

        case 'mark':
          // Mark event (used for synchronization)
          logInfo('Twilio mark received', { callSid, name: message.mark?.name });
          break;

        case 'stop':
          // Stream stopped
          logInfo('Twilio stream stopped', { callSid });

          // Disconnect OpenAI
          openaiClient.disconnect();

          // Clean up session
          activeSessions.delete(callSid);
          break;

        default:
          logInfo('Unknown Twilio event', { event: message.event });
      }
    } catch (error) {
      logError('Error processing Twilio message', error as Error);
    }
  });

  twilioWs.on('error', (error) => {
    logError('Twilio WebSocket error', error as Error);
  });

  twilioWs.on('close', () => {
    logInfo('Twilio WebSocket closed', { callSid });

    // Disconnect OpenAI
    openaiClient.disconnect();

    // Clean up session
    activeSessions.delete(callSid);
  });
}

/**
 * Handle payment promise function call
 */
async function handlePaymentPromise(
  callSid: string,
  args: { promise_date: string; notes?: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Payment promise recorded', {
    callSid,
    promise_date: args.promise_date,
    notes: args.notes
  });

  try {
    // Get session metadata to retrieve invoiceId
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { recordPaymentPromise } = await import('@/lib/voice/voice-call-orchestrator');

    // Save promise to database
    const success = await recordPaymentPromise(
      callSid,
      session.metadata.invoiceId,
      args.promise_date,
      args.notes
    );

    if (!success) {
      throw new Error('Failed to save payment promise');
    }

    // Send result back to AI
    openaiClient.sendFunctionCallResult(
      'payment_promise',
      JSON.stringify({
        success: true,
        message: 'Payment promise recorded successfully. Thank them for their commitment.'
      })
    );
  } catch (error) {
    logError('Failed to handle payment promise', error as Error);

    // Send error back to AI
    openaiClient.sendFunctionCallResult(
      'payment_promise',
      JSON.stringify({
        success: false,
        message: 'Failed to record promise, but noted in conversation.'
      })
    );
  }
}

/**
 * Handle dispute function call
 */
async function handleDispute(
  callSid: string,
  args: { reason: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Dispute recorded', {
    callSid,
    reason: args.reason
  });

  try {
    // Get session metadata to retrieve invoiceId
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { recordDispute } = await import('@/lib/voice/voice-call-orchestrator');

    // Save dispute to database
    const success = await recordDispute(
      callSid,
      session.metadata.invoiceId,
      args.reason,
      'Dispute raised during AI collection call'
    );

    if (!success) {
      throw new Error('Failed to save dispute');
    }

    // Send result back to AI
    openaiClient.sendFunctionCallResult(
      'dispute',
      JSON.stringify({
        success: true,
        message: 'Dispute recorded. Apologize and assure them someone will follow up within 24 hours.'
      })
    );
  } catch (error) {
    logError('Failed to handle dispute', error as Error);

    // Send error back to AI
    openaiClient.sendFunctionCallResult(
      'dispute',
      JSON.stringify({
        success: false,
        message: 'Failed to record dispute, but noted in conversation.'
      })
    );
  }
}

/**
 * Handle payment plan offer function call
 */
async function handlePaymentPlan(
  callSid: string,
  args: { installments: number; frequency: string; first_payment_date: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Payment plan offered', {
    callSid,
    installments: args.installments,
    frequency: args.frequency,
    first_payment_date: args.first_payment_date
  });

  try {
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { db, FieldValue } = await import('@/lib/firebase');

    // Get the collection attempt
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (!attemptSnapshot.empty) {
      const attemptDoc = attemptSnapshot.docs[0];
      const attemptData = attemptDoc.data();

      // Update with payment plan details
      await attemptDoc.ref.update({
        callOutcome: 'payment_plan_offered',
        paymentPlan: {
          installments: args.installments,
          frequency: args.frequency,
          firstPaymentDate: args.first_payment_date,
          amountPerInstallment: session.metadata.amount / args.installments
        },
        result: 'pending',
        resultDetails: `Payment plan offered: ${args.installments} ${args.frequency} payments starting ${args.first_payment_date}`,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create payment plan record
      await db.collection('payment_plans').add({
        invoiceId: session.metadata.invoiceId,
        freelancerId: attemptData.freelancerId,
        clientId: attemptData.clientId || null,
        totalAmount: session.metadata.amount,
        installments: args.installments,
        frequency: args.frequency,
        amountPerInstallment: session.metadata.amount / args.installments,
        firstPaymentDate: args.first_payment_date,
        status: 'proposed', // Customer needs to accept
        source: 'ai_voice_call',
        callSid,
        createdAt: FieldValue.serverTimestamp()
      });

      // Notify freelancer
      await db.collection('notifications').add({
        userId: attemptData.freelancerId,
        type: 'payment_plan_proposed',
        title: 'Payment Plan Proposed',
        message: `AI collection agent proposed a ${args.installments}-payment plan to customer.`,
        read: false,
        actionUrl: `/invoices/${session.metadata.invoiceId}`,
        metadata: {
          invoiceId: session.metadata.invoiceId,
          callSid,
          installments: args.installments,
          frequency: args.frequency
        },
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Send result back to AI
    openaiClient.sendFunctionCallResult(
      'offer_payment_plan',
      JSON.stringify({
        success: true,
        message: `Payment plan recorded. Confirm with customer: ${args.installments} payments of £${(session.metadata.amount / args.installments).toFixed(2)} ${args.frequency}, starting ${args.first_payment_date}. Ask if they agree.`
      })
    );
  } catch (error) {
    logError('Failed to handle payment plan', error as Error);

    openaiClient.sendFunctionCallResult(
      'offer_payment_plan',
      JSON.stringify({
        success: false,
        message: 'Failed to record payment plan, but you can still discuss it with the customer.'
      })
    );
  }
}

/**
 * Handle rebook call function call
 */
async function handleRebookCall(
  callSid: string,
  args: { callback_date: string; callback_time: string; reason?: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Call rebook requested', {
    callSid,
    callback_date: args.callback_date,
    callback_time: args.callback_time,
    reason: args.reason
  });

  try {
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { db, FieldValue, Timestamp } = await import('@/lib/firebase');

    // Get the collection attempt
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (!attemptSnapshot.empty) {
      const attemptDoc = attemptSnapshot.docs[0];
      const attemptData = attemptDoc.data();

      // Update outcome
      await attemptDoc.ref.update({
        callOutcome: 'call_back_requested',
        callbackScheduled: {
          date: args.callback_date,
          time: args.callback_time,
          reason: args.reason
        },
        result: 'callback_requested',
        resultDetails: `Customer requested callback on ${args.callback_date} at ${args.callback_time}. Reason: ${args.reason || 'Not convenient now'}`,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Schedule the callback
      const callbackDateTime = new Date(`${args.callback_date}T${args.callback_time}:00`);

      await db.collection('scheduled_tasks').add({
        taskType: 'collection_call_rebook',
        invoiceId: session.metadata.invoiceId,
        freelancerId: attemptData.freelancerId,
        scheduledFor: Timestamp.fromDate(callbackDateTime),
        metadata: {
          callSid,
          originalCallDate: FieldValue.serverTimestamp(),
          customerPhone: attemptData.clientPhone || session.metadata.recipientPhone,
          customerName: session.metadata.recipientName,
          reason: args.reason
        },
        status: 'pending',
        priority: 'normal',
        createdAt: FieldValue.serverTimestamp()
      });

      // Notify freelancer
      await db.collection('notifications').add({
        userId: attemptData.freelancerId,
        type: 'callback_scheduled',
        title: 'Collection Call Rescheduled',
        message: `Customer requested callback on ${args.callback_date} at ${args.callback_time}.`,
        read: false,
        actionUrl: `/invoices/${session.metadata.invoiceId}`,
        metadata: {
          invoiceId: session.metadata.invoiceId,
          callSid,
          callback_date: args.callback_date,
          callback_time: args.callback_time
        },
        createdAt: FieldValue.serverTimestamp()
      });
    }

    openaiClient.sendFunctionCallResult(
      'rebook_call',
      JSON.stringify({
        success: true,
        message: `Callback scheduled for ${args.callback_date} at ${args.callback_time}. Confirm with customer and end the call politely.`
      })
    );
  } catch (error) {
    logError('Failed to handle rebook call', error as Error);

    openaiClient.sendFunctionCallResult(
      'rebook_call',
      JSON.stringify({
        success: false,
        message: 'Failed to schedule callback, but tell customer someone will call them back.'
      })
    );
  }
}

/**
 * Handle check invoice details function call
 */
async function handleCheckInvoiceDetails(
  callSid: string,
  args: { detail_type: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Invoice details requested', {
    callSid,
    detail_type: args.detail_type
  });

  try {
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { db } = await import('@/lib/firebase');

    // Fetch invoice details
    const invoiceDoc = await db.collection('invoices').doc(session.metadata.invoiceId).get();

    if (!invoiceDoc.exists) {
      throw new Error('Invoice not found');
    }

    const invoice = invoiceDoc.data();
    let detailsResponse = '';

    switch (args.detail_type) {
      case 'line_items':
        const items = invoice?.items || [];
        detailsResponse = `Invoice includes: ${items.map((item: any) => `${item.description} - £${item.amount.toFixed(2)}`).join(', ')}. Total: £${session.metadata.amount.toFixed(2)}`;
        break;

      case 'service_dates':
        const serviceDate = invoice?.serviceDate;
        detailsResponse = `Services were provided on ${serviceDate || 'the dates specified in the contract'}. Invoice was issued on ${invoice?.issuedDate || 'N/A'}.`;
        break;

      case 'payment_history':
        const payments = invoice?.payments || [];
        if (payments.length > 0) {
          detailsResponse = `Previous payments: ${payments.map((p: any) => `£${p.amount} on ${p.date}`).join(', ')}. Remaining balance: £${session.metadata.amount.toFixed(2)}`;
        } else {
          detailsResponse = `No payments have been recorded for this invoice yet. Full amount of £${session.metadata.amount.toFixed(2)} is outstanding.`;
        }
        break;

      default:
        detailsResponse = `Invoice reference ${session.metadata.invoiceReference} for £${session.metadata.amount.toFixed(2)}, due ${session.metadata.dueDate}, now ${session.metadata.daysPastDue} days overdue.`;
    }

    openaiClient.sendFunctionCallResult(
      'check_invoice_details',
      JSON.stringify({
        success: true,
        details: detailsResponse,
        message: 'Provide these details to the customer to help clarify.'
      })
    );
  } catch (error) {
    logError('Failed to check invoice details', error as Error);

    openaiClient.sendFunctionCallResult(
      'check_invoice_details',
      JSON.stringify({
        success: false,
        message: 'Unable to retrieve details right now. Offer to send itemized invoice via email.'
      })
    );
  }
}

/**
 * Handle vulnerable customer flag
 */
async function handleVulnerableFlag(
  callSid: string,
  args: { vulnerability_type: string; notes: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Vulnerable customer flagged', {
    callSid,
    vulnerability_type: args.vulnerability_type,
    notes: args.notes
  });

  try {
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { db, FieldValue } = await import('@/lib/firebase');

    // Get the collection attempt
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (!attemptSnapshot.empty) {
      const attemptDoc = attemptSnapshot.docs[0];
      const attemptData = attemptDoc.data();

      // Update attempt with vulnerable flag
      await attemptDoc.ref.update({
        vulnerableCustomer: true,
        vulnerabilityType: args.vulnerability_type,
        vulnerabilityNotes: args.notes,
        callOutcome: 'vulnerable_customer_flagged',
        result: 'requires_specialist',
        resultDetails: `Customer flagged as vulnerable: ${args.vulnerability_type}`,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Update invoice with vulnerability flag
      await db.collection('invoices').doc(session.metadata.invoiceId).update({
        customerVulnerable: true,
        vulnerabilityType: args.vulnerability_type,
        vulnerabilityDate: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create high-priority task for specialist team
      await db.collection('scheduled_tasks').add({
        taskType: 'vulnerable_customer_review',
        invoiceId: session.metadata.invoiceId,
        freelancerId: attemptData.freelancerId,
        scheduledFor: FieldValue.serverTimestamp(), // Immediate
        priority: 'critical',
        metadata: {
          callSid,
          vulnerabilityType: args.vulnerability_type,
          notes: args.notes,
          requiresSpecialistHandling: true
        },
        status: 'pending',
        createdAt: FieldValue.serverTimestamp()
      });

      // Notify freelancer with urgent priority
      await db.collection('notifications').add({
        userId: attemptData.freelancerId,
        type: 'vulnerable_customer_identified',
        title: 'URGENT: Vulnerable Customer Identified',
        message: `Customer has been flagged as vulnerable (${args.vulnerability_type}). Specialist handling required. DO NOT pressure for payment.`,
        read: false,
        priority: 'critical',
        actionUrl: `/invoices/${session.metadata.invoiceId}`,
        metadata: {
          invoiceId: session.metadata.invoiceId,
          callSid,
          vulnerabilityType: args.vulnerability_type
        },
        createdAt: FieldValue.serverTimestamp()
      });
    }

    openaiClient.sendFunctionCallResult(
      'flag_vulnerable_customer',
      JSON.stringify({
        success: true,
        message: 'Customer flagged for specialist support. Switch to supportive tone. DO NOT pressure for payment. Offer to have specialist team contact them within 24 hours. End call sensitively.'
      })
    );
  } catch (error) {
    logError('Failed to flag vulnerable customer', error as Error);

    openaiClient.sendFunctionCallResult(
      'flag_vulnerable_customer',
      JSON.stringify({
        success: false,
        message: 'Note flagged. Still handle customer with care and avoid pressure.'
      })
    );
  }
}

/**
 * Handle refusal to pay
 */
async function handleRefusal(
  callSid: string,
  args: { reason: string; next_action?: string },
  openaiClient: OpenAIRealtimeClient
): Promise<void> {
  logInfo('Payment refusal recorded', {
    callSid,
    reason: args.reason,
    next_action: args.next_action
  });

  try {
    const session = activeSessions.get(callSid);

    if (!session || !session.metadata.invoiceId) {
      throw new Error('Session not found or missing invoice ID');
    }

    const { db, FieldValue } = await import('@/lib/firebase');

    // Get the collection attempt
    const attemptSnapshot = await db
      .collection('collection_attempts')
      .where('callSID', '==', callSid)
      .limit(1)
      .get();

    if (!attemptSnapshot.empty) {
      const attemptDoc = attemptSnapshot.docs[0];
      const attemptData = attemptDoc.data();

      // Update attempt with refusal
      await attemptDoc.ref.update({
        callOutcome: 'refused_to_pay',
        refusalReason: args.reason,
        recommendedNextAction: args.next_action || 'manager_callback',
        result: 'failed',
        resultDetails: `Customer refused to pay. Reason: ${args.reason}`,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Update invoice status
      await db.collection('invoices').doc(session.metadata.invoiceId).update({
        refusalRecorded: true,
        refusalReason: args.reason,
        refusalDate: FieldValue.serverTimestamp(),
        status: 'collection_escalation', // Escalate for further action
        updatedAt: FieldValue.serverTimestamp()
      });

      // Create escalation task
      await db.collection('scheduled_tasks').add({
        taskType: 'collection_escalation',
        invoiceId: session.metadata.invoiceId,
        freelancerId: attemptData.freelancerId,
        scheduledFor: FieldValue.serverTimestamp(),
        priority: 'high',
        metadata: {
          callSid,
          refusalReason: args.reason,
          nextAction: args.next_action || 'manager_callback',
          requiresEscalation: true
        },
        status: 'pending',
        createdAt: FieldValue.serverTimestamp()
      });

      // Notify freelancer
      await db.collection('notifications').add({
        userId: attemptData.freelancerId,
        type: 'payment_refused',
        title: 'Customer Refused Payment',
        message: `Customer explicitly refused to pay. Reason: ${args.reason}. Escalation required.`,
        read: false,
        priority: 'high',
        actionUrl: `/invoices/${session.metadata.invoiceId}`,
        metadata: {
          invoiceId: session.metadata.invoiceId,
          callSid,
          refusalReason: args.reason,
          nextAction: args.next_action
        },
        createdAt: FieldValue.serverTimestamp()
      });
    }

    openaiClient.sendFunctionCallResult(
      'record_refusal',
      JSON.stringify({
        success: true,
        message: 'Refusal recorded. Remain professional. Inform customer that this will be escalated and may result in further action. End call politely.'
      })
    );
  } catch (error) {
    logError('Failed to record refusal', error as Error);

    openaiClient.sendFunctionCallResult(
      'record_refusal',
      JSON.stringify({
        success: false,
        message: 'Failed to record refusal, but maintain professional manner and end call.'
      })
    );
  }
}

/**
 * Get active session by call SID
 */
export function getActiveSession(callSid: string) {
  return activeSessions.get(callSid);
}

/**
 * Get all active sessions
 */
export function getActiveSessions() {
  return Array.from(activeSessions.values());
}

/**
 * Terminate session
 */
export function terminateSession(callSid: string): void {
  const session = activeSessions.get(callSid);

  if (session) {
    session.openaiClient.disconnect();
    session.twilioWs.close();
    activeSessions.delete(callSid);

    logInfo('Session terminated', { callSid });
  }
}

// Export configuration for Next.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
