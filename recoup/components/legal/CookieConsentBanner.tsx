'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CookiePreferences {
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

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true
    functional: false,
    analytics: false,
    marketing: false,
    timestamp: Date.now(),
    version: CONSENT_VERSION,
  });

  useEffect(() => {
    // Check if user has already provided consent
    const savedConsent = localStorage.getItem(COOKIE_CONSENT_KEY);

    if (savedConsent) {
      try {
        const parsed = JSON.parse(savedConsent) as CookiePreferences;

        // Check if consent is still valid (within duration and same version)
        const consentAge = Date.now() - parsed.timestamp;
        const maxAge = CONSENT_DURATION_DAYS * 24 * 60 * 60 * 1000;

        if (consentAge < maxAge && parsed.version === CONSENT_VERSION) {
          // Consent is valid, apply preferences
          applyConsent(parsed);
          return;
        }
      } catch (e) {
        // Invalid saved consent, show banner
      }
    }

    // No valid consent found, show banner
    setShowBanner(true);
  }, []);

  const applyConsent = (prefs: CookiePreferences) => {
    // Apply analytics consent (Mixpanel)
    if (typeof window !== 'undefined') {
      if (prefs.analytics) {
        // Enable Mixpanel tracking
        // Mixpanel is initialized in AnalyticsProvider, this just ensures it's not opted out
        if ((window as any).mixpanel) {
          (window as any).mixpanel.opt_in_tracking();
        }
      } else {
        // Disable Mixpanel tracking
        if ((window as any).mixpanel) {
          (window as any).mixpanel.opt_out_tracking();
        }
      }

      // Apply marketing consent (if/when implemented)
      if (prefs.marketing) {
        // Enable marketing cookies (placeholder for future use)
        console.log('Marketing cookies enabled');
      } else {
        // Disable marketing cookies
        console.log('Marketing cookies disabled');
      }

      // Functional cookies are handled by app, just store preference
      // Necessary cookies are always enabled
    }
  };

  const saveConsent = (prefs: CookiePreferences) => {
    const consentData = {
      ...prefs,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    applyConsent(consentData);
    setShowBanner(false);
  };

  const handleAcceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    saveConsent(allAccepted);
  };

  const handleRejectNonEssential = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    saveConsent(onlyNecessary);
  };

  const handleSavePreferences = () => {
    saveConsent(preferences);
  };

  const togglePreference = (key: keyof Omit<CookiePreferences, 'necessary' | 'timestamp' | 'version'>) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Expose function to show banner (for cookie policy page)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).showCookieConsent = () => {
        setShowBanner(true);
        setShowDetails(true);
      };
    }
  }, []);

  if (!showBanner) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-0 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Cookie Preferences</h2>
          <button
            onClick={handleRejectNonEssential}
            className="text-white/80 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {!showDetails ? (
            // Simple view
            <div>
              <p className="text-gray-700 mb-4">
                We use cookies to enhance your experience, provide essential functionality, and analyze
                how you use our service. By clicking "Accept All", you consent to our use of cookies.
              </p>
              <p className="text-sm text-gray-600 mb-4">
                You can customize your preferences or learn more in our{' '}
                <a href="/legal/cookie-policy.html" className="text-blue-600 hover:underline" target="_blank">
                  Cookie Policy
                </a>{' '}
                and{' '}
                <a href="/legal/privacy-policy.html" className="text-blue-600 hover:underline" target="_blank">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          ) : (
            // Detailed view
            <div className="space-y-4">
              <p className="text-gray-700 mb-4">
                Choose which types of cookies you want to allow. You can change these settings at any time.
              </p>

              {/* Necessary Cookies */}
              <div className="border rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Strictly Necessary Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      These cookies are essential for the service to function and cannot be disabled.
                      They include authentication, security, and session management.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={true}
                      disabled
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-not-allowed opacity-50"
                    />
                  </div>
                </div>
              </div>

              {/* Functional Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Functional Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      These cookies remember your preferences and settings to enhance your experience,
                      such as theme preferences and dashboard layout.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.functional}
                      onChange={() => togglePreference('functional')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Analytics Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Analytics Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      These cookies help us understand how you use the service so we can improve it.
                      We use Mixpanel for analytics.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={() => togglePreference('analytics')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Marketing Cookies */}
              <div className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Marketing Cookies
                    </h3>
                    <p className="text-sm text-gray-600">
                      These cookies track your visits to show you relevant content and advertising.
                      We currently do not use marketing cookies.
                    </p>
                  </div>
                  <div className="ml-4">
                    <input
                      type="checkbox"
                      checked={preferences.marketing}
                      onChange={() => togglePreference('marketing')}
                      disabled
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-not-allowed opacity-50"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs text-gray-500 mt-4">
                Your consent will be valid for {CONSENT_DURATION_DAYS} days. You can change your preferences
                at any time by visiting our{' '}
                <a href="/legal/cookie-policy.html" className="text-blue-600 hover:underline" target="_blank">
                  Cookie Policy
                </a>.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3 justify-end border-t">
          {!showDetails ? (
            <>
              <button
                onClick={() => setShowDetails(true)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Customize
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Accept All
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleRejectNonEssential}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Reject Non-Essential
              </button>
              <button
                onClick={handleSavePreferences}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Save Preferences
              </button>
            </>
          )}
        </div>

        {/* GDPR Compliance Notice */}
        <div className="bg-blue-50 border-t border-blue-100 px-6 py-3 text-xs text-gray-600">
          🔒 This consent mechanism complies with UK GDPR and PECR regulations.
          Your data is processed in accordance with our{' '}
          <a href="/legal/privacy-policy.html" className="text-blue-600 hover:underline" target="_blank">
            Privacy Policy
          </a>.
        </div>
      </div>
    </div>
  );
}
