/**
 * ACTIVATION EVENTS HOOK
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.2
 *
 * Manages activation event tracking in user metadata
 * Events: firstInvoiceAt, firstReminderAt, firstPaymentAt
 *
 * Usage:
 * const { markActivationEvent } = useActivationEvents();
 * await markActivationEvent('firstInvoiceAt');
 */

'use client';

import { useUser } from '@clerk/nextjs';
import { trackEvent } from '@/lib/analytics';
import { logInfo, logError } from '@/utils/logger';

export interface ActivationEvents {
  firstInvoiceAt?: string;
  firstReminderAt?: string;
  firstPaymentAt?: string;
}

export function useActivationEvents() {
  const { user } = useUser();

  /**
   * Mark an activation event in user metadata
   * Automatically triggers confetti via onboarding checklist
   */
  const markActivationEvent = async (
    eventKey: keyof ActivationEvents
  ): Promise<void> => {
    if (!user) {
      logError('Cannot mark activation event: user not loaded', new Error('User not loaded'));
      return;
    }

    try {
      const metadata = (user.publicMetadata as any) || {};
      const activationEvents = metadata.activationEvents || {};

      // Only set if not already set (first time only)
      if (activationEvents[eventKey]) {
        logInfo('Activation event already marked', { eventKey });
        return;
      }

      // Update user metadata
      await (user as any).update({
        publicMetadata: {
          ...metadata,
          activationEvents: {
            ...activationEvents,
            [eventKey]: new Date().toISOString(),
          },
        },
      });

      // Track analytics event
      const stepKeyMap: Record<keyof ActivationEvents, string> = {
        firstInvoiceAt: 'create_invoice',
        firstReminderAt: 'send_reminder',
        firstPaymentAt: 'receive_payment',
      };

      trackEvent('activation_step_completed', {
        step_key: stepKeyMap[eventKey],
      });

      logInfo('Activation event marked', { eventKey });
    } catch (error) {
      logError('Failed to mark activation event', error as Error);
    }
  };

  /**
   * Get current activation events
   */
  const getActivationEvents = (): ActivationEvents => {
    if (!user) return {};

    const metadata = (user.publicMetadata as any) || {};
    return metadata.activationEvents || {};
  };

  /**
   * Check if all activation steps are complete
   */
  const isActivationComplete = (): boolean => {
    const events = getActivationEvents();
    return !!(
      events.firstInvoiceAt &&
      events.firstReminderAt &&
      events.firstPaymentAt
    );
  };

  return {
    markActivationEvent,
    getActivationEvents,
    isActivationComplete,
  };
}
