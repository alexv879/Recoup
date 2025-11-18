/**
 * External API tracking wrappers
 *
 * Wraps external API calls to track latency and errors
 */

import { logExternalApiCall } from '@/utils/logger';

/**
 * Wrap an external API call with performance tracking
 */
export async function trackExternalApi<T>(
  service: string,
  operation: string,
  apiCall: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  let success = true;

  try {
    const result = await apiCall();
    const duration = Date.now() - startTime;

    logExternalApiCall(service, operation, duration, true);

    return result;
  } catch (error) {
    success = false;
    const duration = Date.now() - startTime;

    logExternalApiCall(service, operation, duration, false, {
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Stripe API wrapper
 */
export class StripeApiTracker {
  static async track<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    return trackExternalApi('Stripe', operation, apiCall);
  }
}

/**
 * SendGrid API wrapper
 */
export class SendGridApiTracker {
  static async track<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    return trackExternalApi('SendGrid', operation, apiCall);
  }
}

/**
 * Twilio API wrapper
 */
export class TwilioApiTracker {
  static async track<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    return trackExternalApi('Twilio', operation, apiCall);
  }
}

/**
 * Lob API wrapper
 */
export class LobApiTracker {
  static async track<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    return trackExternalApi('Lob', operation, apiCall);
  }
}

/**
 * OpenAI API wrapper
 */
export class OpenAIApiTracker {
  static async track<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    return trackExternalApi('OpenAI', operation, apiCall);
  }
}

/**
 * Deepgram API wrapper
 */
export class DeepgramApiTracker {
  static async track<T>(operation: string, apiCall: () => Promise<T>): Promise<T> {
    return trackExternalApi('Deepgram', operation, apiCall);
  }
}
