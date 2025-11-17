// Analytics Event Schema Validation
import type { AnalyticsEvent } from './types';
import { schemas } from './schemas';

export function validateEvent(event: AnalyticsEvent): { valid: boolean; error?: string } {
    const schema = schemas[event.type];
    if (!schema) return { valid: false, error: 'Unknown event type' };
    // Basic shape validation
    for (const key of Object.keys(schema)) {
        if (!(key in event)) {
            return { valid: false, error: `Missing required field: ${key}` };
        }
    }
    return { valid: true };
}
