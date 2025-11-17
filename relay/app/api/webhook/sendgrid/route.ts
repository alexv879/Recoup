/**
 * SendGrid Webhook Handler
 * 
 * POST /api/webhook/sendgrid
 * 
 * Handles SendGrid event notifications for email delivery tracking:
 * - delivered: Email successfully delivered
 * - bounce: Email bounced
 * - dropped: Email dropped by SendGrid
 * - open: Email opened by recipient (optional tracking)
 * - click: Link clicked in email (optional tracking)
 * 
 * Updates emailEvents collection and tracks analytics events
 * 
 * Setup: https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook
 */

import { NextRequest, NextResponse } from 'next/server';
import { firestore } from '@/lib/firebase';
import { trackServerEvent } from '@/lib/analytics-server';
import { logger } from '@/utils/logger';
import crypto from 'crypto';

interface SendGridEvent {
    email: string;
    timestamp: number;
    event: 'processed' | 'delivered' | 'bounce' | 'dropped' | 'deferred' | 'open' | 'click' | 'spamreport' | 'unsubscribe';
    'smtp-id'?: string;
    sg_message_id?: string;
    reason?: string;
    status?: string;
    response?: string;
    // Custom args we attached when sending
    invoiceId?: string;
    reminderLevel?: string;
    userId?: string;
}

/**
 * Verify SendGrid webhook signature
 * https://docs.sendgrid.com/for-developers/tracking-events/getting-started-event-webhook#verify-signature
 */
function verifySignature(
    payload: string,
    signature: string,
    timestamp: string
): boolean {
    const publicKey = process.env.SENDGRID_WEBHOOK_PUBLIC_KEY;

    if (!publicKey) {
        logger.warn('SENDGRID_WEBHOOK_PUBLIC_KEY not configured, skipping signature verification');
        return true; // Allow in development
    }

    try {
        const verifier = crypto.createVerify('RSA-SHA256');
        verifier.update(timestamp + payload);
        return verifier.verify(publicKey, signature, 'base64');
    } catch (error) {
        logger.error('Signature verification failed', { error });
        return false;
    }
}

/**
 * Map SendGrid delivery status to our internal status
 */
function mapDeliveryStatus(event: string): 'sent' | 'delivered' | 'bounced' | 'failed' {
    switch (event) {
        case 'delivered':
            return 'delivered';
        case 'bounce':
        case 'dropped':
        case 'spamreport':
            return 'bounced';
        case 'deferred':
            return 'sent'; // Still attempting delivery
        case 'processed':
        default:
            return 'sent';
    }
}

/**
 * Update email event in Firestore
 */
async function updateEmailEvent(
    messageId: string,
    status: 'sent' | 'delivered' | 'bounced' | 'failed',
    metadata?: {
        reason?: string;
        response?: string;
        timestamp?: number;
    }
): Promise<void> {
    // Find email event by SendGrid message ID
    const emailEventsRef = firestore.collection('emailEvents');
    const query = emailEventsRef
        .where('sendgridMessageId', '==', messageId)
        .limit(1);

    const snapshot = await query.get();

    if (snapshot.empty) {
        logger.warn('Email event not found for message ID', { messageId });
        return;
    }

    const doc = snapshot.docs[0];
    const updateData: any = {
        deliveryStatus: status,
        updatedAt: new Date(),
    };

    if (metadata?.reason) {
        updateData.error = metadata.reason;
    }

    if (metadata?.response) {
        updateData.deliveryResponse = metadata.response;
    }

    if (metadata?.timestamp) {
        updateData.deliveredAt = new Date(metadata.timestamp * 1000);
    }

    await doc.ref.update(updateData);
}

export async function POST(request: NextRequest) {
    try {
        // Get signature headers for verification
        const signature = request.headers.get('x-twilio-email-event-webhook-signature');
        const timestamp = request.headers.get('x-twilio-email-event-webhook-timestamp');

        // Parse events from body
        const body = await request.text();
        const events: SendGridEvent[] = JSON.parse(body);

        // Verify signature if configured
        if (signature && timestamp) {
            const isValid = verifySignature(body, signature, timestamp);

            if (!isValid) {
                logger.error('Invalid SendGrid webhook signature');
                return NextResponse.json(
                    { error: 'Invalid signature' },
                    { status: 401 }
                );
            }
        }

        logger.info(`Processing ${events.length} SendGrid webhook events`);

        // Process each event
        for (const event of events) {
            const messageId = event.sg_message_id;

            if (!messageId) {
                logger.warn('Event missing sg_message_id', { event: event.event });
                continue;
            }

            const deliveryStatus = mapDeliveryStatus(event.event);

            // Update email event in Firestore
            await updateEmailEvent(messageId, deliveryStatus, {
                reason: event.reason,
                response: event.response,
                timestamp: event.timestamp,
            });

            // Track analytics events
            if (event.event === 'delivered') {
                await trackServerEvent('email_delivered', {
                    invoice_id: event.invoiceId,
                    reminder_level: event.reminderLevel,
                    sendgrid_message_id: messageId,
                });
            } else if (event.event === 'bounce' || event.event === 'dropped') {
                await trackServerEvent('email_failed', {
                    invoice_id: event.invoiceId,
                    reminder_level: event.reminderLevel,
                    sendgrid_message_id: messageId,
                    error_message: event.reason || event.response || 'Email bounced or dropped',
                });
            }

            logger.info('Processed SendGrid event', {
                event: event.event,
                messageId,
                email: event.email,
                invoiceId: event.invoiceId,
            });
        }

        return NextResponse.json({ success: true, processed: events.length });
    } catch (error) {
        logger.error('SendGrid webhook processing failed', {
            error: error instanceof Error ? error.message : String(error),
        });

        // Always return 200 to prevent SendGrid from retrying
        // We log the error for manual investigation
        return NextResponse.json(
            { error: 'Internal error', logged: true },
            { status: 200 }
        );
    }
}
