/**
 * Webhook Security Module
 *
 * Provides signature validation for all incoming webhooks
 * Prevents replay attacks and ensures webhook authenticity
 *
 * **Supported Providers:**
 * - Stripe (HMAC-SHA256)
 * - Clerk (SVIX signatures)
 * - Twilio (HMAC-SHA1)
 * - Lob (HMAC-SHA256)
 * - Custom webhooks (HMAC-SHA256)
 */

import crypto from 'crypto';
import { logError, logWarn } from '@/utils/logger';

/**
 * Validate Stripe webhook signature
 * @see https://stripe.com/docs/webhooks/signatures
 */
export function validateStripeSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
): boolean {
    try {
        const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

        // Extract timestamp and signatures
        const elements = signature.split(',');
        const timestamp = elements.find(e => e.startsWith('t='))?.split('=')[1];
        const signatures = elements.filter(e => e.startsWith('v1='));

        if (!timestamp || signatures.length === 0) {
            logWarn('Invalid Stripe signature format');
            return false;
        }

        // Construct signed payload
        const signedPayload = `${timestamp}.${payloadString}`;

        // Compute expected signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(signedPayload)
            .digest('hex');

        // Check if any signature matches
        const signatureMatches = signatures.some(sig => {
            const providedSig = sig.split('=')[1];
            return crypto.timingSafeEqual(
                Buffer.from(expectedSignature),
                Buffer.from(providedSig)
            );
        });

        // Check timestamp (prevent replay attacks - 5 minute window)
        const currentTime = Math.floor(Date.now() / 1000);
        const timestampAge = currentTime - parseInt(timestamp, 10);
        if (timestampAge > 300) {
            logWarn('Stripe webhook timestamp too old', { age: timestampAge });
            return false;
        }

        return signatureMatches;
    } catch (error) {
        logError('Stripe signature validation failed', error);
        return false;
    }
}

/**
 * Validate Clerk (SVIX) webhook signature
 * @see https://docs.svix.com/receiving/verifying-payloads/how
 */
export function validateClerkSignature(
    payload: string | Buffer,
    headers: {
        'svix-id': string;
        'svix-timestamp': string;
        'svix-signature': string;
    },
    secret: string
): boolean {
    try {
        const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

        // Extract signature components
        const svixId = headers['svix-id'];
        const svixTimestamp = headers['svix-timestamp'];
        const svixSignature = headers['svix-signature'];

        if (!svixId || !svixTimestamp || !svixSignature) {
            logWarn('Missing Clerk/SVIX signature headers');
            return false;
        }

        // Construct signed content
        const signedContent = `${svixId}.${svixTimestamp}.${payloadString}`;

        // Get secret (remove whsec_ prefix if present)
        const secretBytes = secret.startsWith('whsec_')
            ? Buffer.from(secret.slice(6), 'base64')
            : Buffer.from(secret);

        // Compute expected signature
        const expectedSignature = crypto
            .createHmac('sha256', secretBytes)
            .update(signedContent)
            .digest('base64');

        // Extract provided signatures (v1=signature format)
        const providedSignatures = svixSignature.split(' ');
        const signatureMatches = providedSignatures.some(sig => {
            const [version, signature] = sig.split(',');
            if (version === 'v1') {
                try {
                    return crypto.timingSafeEqual(
                        Buffer.from(expectedSignature),
                        Buffer.from(signature)
                    );
                } catch {
                    return false;
                }
            }
            return false;
        });

        // Check timestamp (prevent replay attacks - 5 minute window)
        const currentTime = Math.floor(Date.now() / 1000);
        const timestamp = parseInt(svixTimestamp, 10);
        const timestampAge = currentTime - timestamp;
        if (timestampAge > 300) {
            logWarn('Clerk webhook timestamp too old', { age: timestampAge });
            return false;
        }

        return signatureMatches;
    } catch (error) {
        logError('Clerk signature validation failed', error);
        return false;
    }
}

/**
 * Validate Twilio webhook signature
 * @see https://www.twilio.com/docs/usage/webhooks/webhooks-security
 */
export function validateTwilioSignature(
    url: string,
    params: Record<string, any>,
    signature: string,
    authToken: string
): boolean {
    try {
        // Sort parameters alphabetically
        const sortedKeys = Object.keys(params).sort();

        // Construct data string
        let data = url;
        sortedKeys.forEach(key => {
            data += key + params[key];
        });

        // Compute expected signature
        const expectedSignature = crypto
            .createHmac('sha1', authToken)
            .update(Buffer.from(data, 'utf-8'))
            .digest('base64');

        // Compare signatures
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        logError('Twilio signature validation failed', error);
        return false;
    }
}

/**
 * Validate Lob webhook signature
 * @see https://docs.lob.com/#webhooks
 */
export function validateLobSignature(
    payload: string | Buffer,
    signature: string,
    secret: string
): boolean {
    try {
        const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

        // Compute expected signature
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadString)
            .digest('hex');

        // Compare signatures
        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(signature)
        );
    } catch (error) {
        logError('Lob signature validation failed', error);
        return false;
    }
}

/**
 * Validate custom webhook signature (HMAC-SHA256)
 * Generic signature validation for custom webhooks
 */
export function validateCustomWebhookSignature(
    payload: string | Buffer,
    signature: string,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
    try {
        const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

        // Compute expected signature
        const expectedSignature = crypto
            .createHmac(algorithm, secret)
            .update(payloadString)
            .digest('hex');

        // Compare signatures (remove common prefixes)
        const providedSig = signature.replace(/^(sha256=|sha512=)/, '');

        return crypto.timingSafeEqual(
            Buffer.from(expectedSignature),
            Buffer.from(providedSig)
        );
    } catch (error) {
        logError('Custom webhook signature validation failed', error);
        return false;
    }
}

/**
 * Generate webhook signature for outgoing webhooks
 */
export function generateWebhookSignature(
    payload: string | Buffer,
    secret: string,
    algorithm: 'sha256' | 'sha512' = 'sha256'
): string {
    const payloadString = typeof payload === 'string' ? payload : payload.toString('utf8');

    return crypto
        .createHmac(algorithm, secret)
        .update(payloadString)
        .digest('hex');
}

/**
 * Validate webhook timestamp (prevent replay attacks)
 */
export function isWebhookTimestampValid(
    timestamp: number,
    maxAgeSeconds: number = 300 // 5 minutes default
): boolean {
    const currentTime = Math.floor(Date.now() / 1000);
    const age = currentTime - timestamp;

    if (age > maxAgeSeconds) {
        logWarn('Webhook timestamp too old', { age, maxAge: maxAgeSeconds });
        return false;
    }

    if (age < -60) {
        // Timestamp is in the future (allow 1 minute clock skew)
        logWarn('Webhook timestamp in future', { age });
        return false;
    }

    return true;
}

/**
 * Extract raw body from Next.js request
 * Required for signature validation
 */
export async function getRawBody(req: Request): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    const reader = req.body?.getReader();

    if (!reader) {
        throw new Error('Request body is not readable');
    }

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
    }

    return Buffer.concat(chunks.map(chunk => Buffer.from(chunk)));
}
