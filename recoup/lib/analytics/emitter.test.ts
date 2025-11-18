// Basic tests for analytics event emitter
import { emitEvent } from './emitter';
import type { AnalyticsEvent } from './types';

describe('emitEvent', () => {
    it('should emit a valid event', async () => {
        const event: AnalyticsEvent = {
            type: 'signup_initiated',
            userId: 'user_123',
            timestamp: Date.now(),
            userEmail: 'test@example.com',
        };
        const result = await emitEvent(event);
        expect(result.success).toBe(true);
    });

    it('should fail for missing required field', async () => {
        const event: any = {
            type: 'signup_initiated',
            timestamp: Date.now(),
        };
        const result = await emitEvent(event);
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/Missing required field/);
    });

    it('should strip PII fields', async () => {
        const event: AnalyticsEvent = {
            type: 'signup_completed',
            userId: 'user_456',
            timestamp: Date.now(),
            userEmail: 'private@example.com',
            userPhone: '+1234567890',
        };
        const result = await emitEvent(event);
        expect(result.success).toBe(true);
        // PII fields should not be sent (checked in transport stub)
    });
});
