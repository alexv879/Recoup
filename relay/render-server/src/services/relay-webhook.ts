/**
 * Recoup Webhook Service
 * Sends call summaries and outcomes back to main Recoup app
 */

import { CallSummary } from './twilio-handler';
import { config } from '../config';

export interface WebhookPayload {
  event: 'call.completed';
  data: {
    callSid: string;
    invoiceId: string;
    invoiceReference: string;
    clientName: string;
    durationSeconds: number;
    outcome: 'payment_committed' | 'payment_plan' | 'dispute' | 'no_resolution' | 'error';
    transcript: string; // Full conversation transcript
    startTime: string; // ISO 8601
    endTime: string; // ISO 8601
  };
}

export class RecoupWebhookService {
  /**
   * Send call completion webhook to Recoup app
   */
  async sendCallComplete(callSummary: CallSummary, invoiceId: string): Promise<void> {
    try {
      // Build full transcript
      const transcript = callSummary.transcripts
        .map((t) => `[${t.timestamp.toISOString()}] ${t.speaker === 'user' ? 'Client' : 'AI'}: ${t.text}`)
        .join('\n');

      const payload: WebhookPayload = {
        event: 'call.completed',
        data: {
          callSid: callSummary.callSid,
          invoiceId,
          invoiceReference: callSummary.callContext.invoiceReference,
          clientName: callSummary.callContext.clientName,
          durationSeconds: callSummary.durationSeconds,
          outcome: callSummary.outcome,
          transcript,
          startTime: callSummary.startTime.toISOString(),
          endTime: callSummary.endTime.toISOString(),
        },
      };

      const webhookUrl = `${config.recoup.apiUrl}/api/webhooks/voice-call`;

      console.log(`[Webhook] Sending call completion to ${webhookUrl}`);

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': config.recoup.webhookSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('[Webhook] Call completion sent successfully');
    } catch (error) {
      console.error('[Webhook] Failed to send call completion:', error);
      // Don't throw - webhook failure shouldn't crash the server
    }
  }

  /**
   * Send health check to Recoup app (optional)
   */
  async sendHealthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${config.recoup.apiUrl}/api/health`, {
        method: 'GET',
      });

      return response.ok;
    } catch (error) {
      console.error('[Webhook] Health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const recoupWebhookService = new RecoupWebhookService();
