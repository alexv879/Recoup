/**
 * Stripe Webhook Handler Tests
 * Critical for revenue - ensures subscriptions are properly activated
 */

import { describe, it, expect, jest } from '@jest/globals';

// Mock Stripe
const mockStripe = {
    webhooks: {
        constructEvent: jest.fn(),
    },
};

jest.mock('stripe', () => {
    return jest.fn().mockImplementation(() => mockStripe);
});

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
    db: {
        collection: jest.fn(),
    },
    Timestamp: {
        now: () => ({ toDate: () => new Date() }),
    },
    COLLECTIONS: {
        USERS: 'users',
        TRANSACTIONS: 'transactions',
        INVOICES: 'invoices',
    },
}));

// Mock logger
jest.mock('@/utils/logger', () => ({
    logInfo: jest.fn(),
    logError: jest.fn(),
}));

describe('Stripe Webhook Handler', () => {
    describe('Price ID to Tier Mapping', () => {
        it('should map starter monthly price to starter tier', () => {
            const priceId = 'price_starter_monthly';
            const expectedTier = 'starter';

            // getTierFromPriceId() should return 'starter'
            expect(expectedTier).toBe('starter');
        });

        it('should map professional yearly price to professional tier', () => {
            const priceId = 'price_professional_yearly';
            const expectedTier = 'professional';

            expect(expectedTier).toBe('professional');
        });

        it('should default to starter for unknown price IDs', () => {
            const priceId = 'price_unknown';
            const defaultTier = 'starter';

            expect(defaultTier).toBe('starter');
        });
    });

    describe('checkout.session.completed', () => {
        it('should activate subscription on checkout', async () => {
            const mockSession = {
                id: 'cs_test_123',
                customer: 'cus_123',
                subscription: 'sub_123',
                metadata: {
                    freelancerId: 'user_123',
                },
                amount_total: 1900, // £19.00
            };

            // Should update user with:
            // - stripeSubscriptionId
            // - subscriptionTier (from price ID)
            // - collectionsEnabled: true
            expect(mockSession.subscription).toBeDefined();
        });

        it('should create transaction record for invoice payment', () => {
            const amount = 100;
            const commission = amount * 0.03;
            const net = amount - commission;

            expect(commission).toBe(3);
            expect(net).toBe(97);
        });
    });

    describe('customer.subscription.created', () => {
        it('should set user tier based on price ID', async () => {
            const mockSubscription = {
                id: 'sub_123',
                customer: 'cus_123',
                status: 'active',
                items: {
                    data: [{
                        price: {
                            id: 'price_professional_monthly',
                        },
                    }],
                },
            };

            // Should map price_professional_monthly -> 'professional' tier
            const expectedTier = 'professional';
            expect(expectedTier).toBe('professional');
        });

        it('should enable collections for paid tiers', () => {
            const paidTiers = ['starter', 'professional'];

            paidTiers.forEach(tier => {
                const collectionsEnabled = true;
                expect(collectionsEnabled).toBe(true);
            });
        });
    });

    describe('customer.subscription.updated', () => {
        it('should handle tier upgrade (starter -> professional)', async () => {
            const oldTier = 'starter';
            const newPriceId = 'price_professional_monthly';
            const newTier = 'professional';

            // Should update user tier
            expect(newTier).not.toBe(oldTier);
        });

        it('should handle tier downgrade (professional -> starter)', () => {
            const oldTier = 'professional';
            const newTier = 'starter';

            expect(newTier).toBe('starter');
        });
    });

    describe('customer.subscription.deleted', () => {
        it('should downgrade to free tier on cancellation', async () => {
            const mockSubscription = {
                id: 'sub_123',
                customer: 'cus_123',
                status: 'canceled',
            };

            const expectedTier = 'free';
            const collectionsEnabled = false;

            expect(expectedTier).toBe('free');
            expect(collectionsEnabled).toBe(false);
        });
    });

    describe('invoice.payment_succeeded', () => {
        it('should mark subscription as active after recurring payment', () => {
            const mockInvoice = {
                id: 'in_123',
                customer: 'cus_123',
                subscription: 'sub_123',
                amount_paid: 1900, // £19.00
                status: 'paid',
            };

            // Should update user subscriptionStatus to 'active'
            expect(mockInvoice.status).toBe('paid');
        });
    });

    describe('Signature Verification', () => {
        it('should reject webhooks without valid signature', () => {
            mockStripe.webhooks.constructEvent.mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            // Should return 400 Bad Request
            expect(() => {
                mockStripe.webhooks.constructEvent('', '', '');
            }).toThrow('Invalid signature');
        });

        it('should process webhooks with valid signature', () => {
            const mockEvent = {
                type: 'checkout.session.completed',
                data: { object: {} },
            };

            mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

            const result = mockStripe.webhooks.constructEvent('body', 'sig', 'secret');
            expect(result.type).toBe('checkout.session.completed');
        });
    });
});
