/**
 * Twilio signature verification utilities
 * Validates webhook signatures from Twilio
 *
 * Algorithm per Twilio docs:
 * 1. Take the full URL of the request (including query string)
 * 2. If POST, append all POST parameters sorted alphabetically as key=value
 * 3. Sign the resulting string with HMAC-SHA1 using your auth token
 * 4. Base64 encode the hash
 * 5. Compare with X-Twilio-Signature header
 */

import crypto from 'crypto';
import { logError } from '@/utils/logger';

export interface TwilioWebhookData {
    signature: string;
    url: string;
    authToken: string;
    params?: Record<string, string>; // POST parameters
}

/**
 * Verify Twilio webhook signature
 * @see https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function verifyTwilioSignature({
    signature,
    url,
    authToken,
    params = {},
}: TwilioWebhookData): boolean {
    try {
        // Build the signature string per Twilio's algorithm
        let signatureString = url;

        // If we have POST parameters, append them sorted alphabetically
        if (Object.keys(params).length > 0) {
            const sortedKeys = Object.keys(params).sort();
            for (const key of sortedKeys) {
                signatureString += key + params[key];
            }
        }

        // Create the expected signature using HMAC-SHA1
        const expectedSignature = crypto
            .createHmac('sha1', authToken)
            .update(signatureString)
            .digest('base64');

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        logError('Failed to verify Twilio signature', { error });
        return false;
    }
}