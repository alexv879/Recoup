// Analytics Event Emitter
import { validateEvent } from './validate';
import { sendEvent } from './transport';
import type { AnalyticsEvent, AnalyticsEventResult } from './types';

const EVENT_QUEUE_KEY = 'relay_event_queue';
const MAX_QUEUE_SIZE = 200;

function getEventQueue(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return [];
    const queue = localStorage.getItem(EVENT_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
}

function saveEventQueue(queue: AnalyticsEvent[]): void {
    if (typeof window !== 'undefined') {
        localStorage.setItem(EVENT_QUEUE_KEY, JSON.stringify(queue));
    }
}

export async function emitEvent(event: AnalyticsEvent): Promise<AnalyticsEventResult> {
    // Validate event schema
    const validation = validateEvent(event);
    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    // Privacy enforcement (strip PII)
    const filteredEvent = { ...event };
    if (filteredEvent.userEmail) delete filteredEvent.userEmail;
    if (filteredEvent.userPhone) delete filteredEvent.userPhone;

    // Attempt to send event
    try {
        await sendEvent(filteredEvent);
        return { success: true };
    } catch (err) {
        // If offline or error, queue event
        const queue = getEventQueue();
        if (queue.length < MAX_QUEUE_SIZE) {
            queue.push(filteredEvent);
            saveEventQueue(queue);
        }
        return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
}

// Flush queued events when online
if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        const queue = getEventQueue();
        while (queue.length > 0) {
            const event = queue.shift();
            try {
                await sendEvent(event!);
            } catch {
                queue.unshift(event!);
                break;
            }
        }
        saveEventQueue(queue);
    });
}
