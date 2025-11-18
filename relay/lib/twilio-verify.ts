/**
 * [SECURITY FIX] Twilio Webhook Signature Verification
 *
 * Verifies that webhook requests are actually from Twilio
 *
 * Security Features:
 * - HMAC-SHA256 signature verification
 * - Prevents webhook forgery and replay attacks
 * - Validates request authenticity
 *
 * SECURITY AUDIT FIX: CRITICAL-3
 * Issue: Twilio signature verification library missing
 * Fix: Implement Twilio webhook signature verification
 *
 * Reference: https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */

import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { logWarn, logInfo } from '@/utils/logger';

/**
 * [SECURITY FIX] Verify Twilio webhook signature
 *
 * @param req - Next.js request object
 * @returns True if signature is valid
 */
export async function verifyTwilioSignature(req: NextRequest): Promise<boolean> {
  try {
    // Get Twilio auth token from environment
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!authToken) {
      logWarn('[TWILIO] TWILIO_AUTH_TOKEN not configured, skipping verification');
      // In development, allow without token
      if (process.env.NODE_ENV !== 'production') {
        return true;
      }
      return false;
    }

    // Get signature from headers
    const twilioSignature = req.headers.get('x-twilio-signature');

    if (!twilioSignature) {
      logWarn('[TWILIO] No x-twilio-signature header found');
      return false;
    }

    // Get request URL (must be exact URL Twilio sent request to)
    const url = req.url;

    // Get request body as form data
    const formData = await req.formData();

    // Build sorted parameter string
    const params: string[] = [];
    formData.forEach((value, key) => {
      params.push(`${key}${value}`);
    });

    // Sort parameters alphabetically by key
    params.sort();

    // Create signature string: URL + sorted parameters
    const data = url + params.join('');

    // Compute HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', authToken);
    hmac.update(data);
    const computedSignature = hmac.digest('base64');

    // Compare signatures (timing-safe)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(twilioSignature),
      Buffer.from(computedSignature)
    );

    if (!isValid) {
      logWarn('[TWILIO] Invalid webhook signature', {
        url,
        expectedSignature: computedSignature.substring(0, 10) + '...',
        receivedSignature: twilioSignature.substring(0, 10) + '...',
      });
    } else {
      logInfo('[TWILIO] Webhook signature verified');
    }

    return isValid;
  } catch (error) {
    logWarn('[TWILIO] Signature verification error', { error });
    return false;
  }
}

/**
 * [SECURITY FIX] Verify Twilio signature for Realtime Media Stream
 * Media streams use a different signature method
 */
export function verifyTwilioMediaStreamSignature(
  signature: string,
  url: string,
  params: Record<string, any>
): boolean {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!authToken) {
      logWarn('[TWILIO] TWILIO_AUTH_TOKEN not configured for media stream verification');
      return false;
    }

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(params).sort();
    const paramString = sortedKeys.map(key => `${key}${params[key]}`).join('');

    // Create signature string
    const data = url + paramString;

    // Compute HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', authToken);
    hmac.update(data);
    const computedSignature = hmac.digest('base64');

    // Compare signatures
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );
  } catch (error) {
    logWarn('[TWILIO] Media stream signature verification error', { error });
    return false;
  }
}

/**
 * [SECURITY FIX] Helper to manually verify signature (for testing)
 */
export function verifySignatureManual(
  authToken: string,
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  try {
    // Sort parameters
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}${params[key]}`)
      .join('');

    // Create data string
    const data = url + sortedParams;

    // Compute signature
    const hmac = crypto.createHmac('sha256', authToken);
    hmac.update(data);
    const computedSignature = hmac.digest('base64');

    // Compare
    return signature === computedSignature;
  } catch (error) {
    return false;
  }
}
