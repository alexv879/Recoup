// Analytics Event Transport (with offline/retry)
import type { AnalyticsEvent } from './types';

const OFFLINE_QUEUE: AnalyticsEvent[] = [];

export async function sendEvent(event: AnalyticsEvent): Promise<void> {
    // Simulate network send (replace with real API call)
    try {
        // If offline, queue event
        if (!navigator.onLine) {
            OFFLINE_QUEUE.push(event);
            return;
        }
        // Send event to analytics provider (stub)
        // await fetch('https://api.mixpanel.com/track', { method: 'POST', body: JSON.stringify(event) });
    } catch (err) {
        // On error, queue for retry
        OFFLINE_QUEUE.push(event);
        throw err;
    }
}

// Retry logic (to be called on reconnect)
export async function flushOfflineQueue() {
    while (OFFLINE_QUEUE.length > 0 && navigator.onLine) {
        const event = OFFLINE_QUEUE.shift();
        if (event) await sendEvent(event);
    }
}
