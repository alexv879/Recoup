/**
 * Webhook recovery utilities
 * Handles failed webhook processing and recovery
 */

import { nanoid } from 'nanoid';

export interface FailedWebhook {
    id: string;
    correlationId: string;
    provider: string;
    payload: any;
    error: string;
    retryCount: number;
    lastAttempt: Date;
    nextRetry?: Date;
    createdAt: Date;
}

/**
 * Generate a correlation ID for webhook tracking
 */
export function generateCorrelationId(): string {
    return `wh_${nanoid(16)}`;
}

/**
 * Store a failed webhook for later retry
 */
export async function storeFailedWebhook(
    correlationId: string,
    provider: string,
    payload: any,
    error: string
): Promise<string> {
    try {
        const failedWebhook: FailedWebhook = {
            id: nanoid(),
            correlationId,
            provider,
            payload,
            error,
            retryCount: 0,
            lastAttempt: new Date(),
            nextRetry: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
            createdAt: new Date(),
        };

        // In production, this would store in database
        console.log('Storing failed webhook:', failedWebhook);

        return failedWebhook.id;
    } catch (error) {
        console.error('Failed to store failed webhook:', error);
        throw error;
    }
}