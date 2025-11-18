/**
 * Twilio signature verification utilities
 * Validates webhook signatures from Twilio
 */

import crypto from 'crypto';

export interface TwilioWebhookData {
    signature: string;
    body: string;
    url: string;
    authToken: string;
}

/**
 * Verify Twilio webhook signature
 */
export function verifyTwilioSignature({
    signature,
    body,
    url,
    authToken,
}: TwilioWebhookData): boolean {
    try {
        // Create the expected signature
        const expectedSignature = crypto
            .createHmac('sha1', authToken)
            .update(url + body)
            .digest('base64');

        // Use timing-safe comparison to prevent timing attacks
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expectedSignature)
        );
    } catch (error) {
        console.error('Failed to verify Twilio signature:', error);
        return false;
    }
}