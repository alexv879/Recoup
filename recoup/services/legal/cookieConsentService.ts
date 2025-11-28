/**
 * Cookie Consent Service
 *
 * Manages user cookie preferences in compliance with UK GDPR and PECR.
 * This service provides utilities for checking and managing cookie consent.
 */

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

const COOKIE_CONSENT_KEY = 'recoup_cookie_consent';
const CONSENT_VERSION = '1.0';
const CONSENT_DURATION_DAYS = 365;

/**
 * Get saved cookie preferences from localStorage
 */
export function getCookiePreferences(): CookiePreferences | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!saved) {
      return null;
    }

    const parsed = JSON.parse(saved) as CookiePreferences;

    // Check if consent is still valid
    const consentAge = Date.now() - parsed.timestamp;
    const maxAge = CONSENT_DURATION_DAYS * 24 * 60 * 60 * 1000;

    if (consentAge >= maxAge || parsed.version !== CONSENT_VERSION) {
      // Consent expired or version changed
      return null;
    }

    return parsed;
  } catch (e) {
    console.error('Error reading cookie preferences:', e);
    return null;
  }
}

/**
 * Save cookie preferences to localStorage
 */
export function saveCookiePreferences(prefs: Omit<CookiePreferences, 'timestamp' | 'version'>): void {
  if (typeof window === 'undefined') {
    return;
  }

  const preferences: CookiePreferences = {
    ...prefs,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  };

  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  } catch (e) {
    console.error('Error saving cookie preferences:', e);
  }
}

/**
 * Check if user has consented to a specific cookie category
 */
export function hasConsent(category: keyof Omit<CookiePreferences, 'timestamp' | 'version'>): boolean {
  // Necessary cookies are always allowed
  if (category === 'necessary') {
    return true;
  }

  const prefs = getCookiePreferences();
  if (!prefs) {
    // No consent given yet, default to false
    return false;
  }

  return prefs[category];
}

/**
 * Check if user has provided any consent (to determine if banner should show)
 */
export function hasProvidedConsent(): boolean {
  return getCookiePreferences() !== null;
}

/**
 * Clear all cookie preferences (for testing or user request)
 */
export function clearCookiePreferences(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(COOKIE_CONSENT_KEY);
  } catch (e) {
    console.error('Error clearing cookie preferences:', e);
  }
}

/**
 * Get consent age in days
 */
export function getConsentAgeDays(): number | null {
  const prefs = getCookiePreferences();
  if (!prefs) {
    return null;
  }

  const ageMs = Date.now() - prefs.timestamp;
  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

/**
 * Check if analytics tracking is allowed
 * This is a convenience function for the most commonly checked permission
 */
export function canTrackAnalytics(): boolean {
  return hasConsent('analytics');
}

/**
 * Initialize analytics based on consent
 * Call this after user provides consent
 */
export function initializeAnalytics(): void {
  if (typeof window === 'undefined') {
    return;
  }

  if (canTrackAnalytics()) {
    // Enable Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.opt_in_tracking();
    }
  } else {
    // Disable Mixpanel
    if ((window as any).mixpanel) {
      (window as any).mixpanel.opt_out_tracking();
    }
  }
}

/**
 * Log consent event (for audit trail)
 * This can be extended to send to backend for compliance records
 */
export function logConsentEvent(action: 'granted' | 'updated' | 'withdrawn', preferences: CookiePreferences): void {
  if (typeof window === 'undefined') {
    return;
  }

  // For now, just log to console
  // In production, you might want to send this to your backend for audit trail
  console.log('[Cookie Consent]', {
    action,
    preferences,
    timestamp: new Date().toISOString(),
  });

  // Could also track in Mixpanel if analytics consent is given
  if (preferences.analytics && (window as any).mixpanel) {
    (window as any).mixpanel.track('Cookie Consent Changed', {
      action,
      necessary: preferences.necessary,
      functional: preferences.functional,
      analytics: preferences.analytics,
      marketing: preferences.marketing,
    });
  }
}
