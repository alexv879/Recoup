'use client';

/**
 * PWA Install Prompt Component
 *
 * Shows a banner prompting users to install the app on their device
 */

import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { showInstallPrompt, isInstallPromptAvailable, isAppInstalled, isIOS, listenForInstallPrompt } from '@/lib/pwa';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Don't show if app is already installed
    if (isAppInstalled()) {
      return;
    }

    // Check if we've dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      return;
    }

    // Listen for install prompt availability
    listenForInstallPrompt(() => {
      // Show prompt after 30 seconds of browsing
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    });

    // On iOS, show custom instructions
    if (isIOS()) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 30000);
    }
  }, []);

  const handleInstall = async () => {
    setIsInstalling(true);

    try {
      const accepted = await showInstallPrompt();

      if (accepted) {
        setShowPrompt(false);
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (!showPrompt) {
    return null;
  }

  // iOS-specific instructions
  if (isIOS()) {
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg z-50 animate-slide-up">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <div className="flex-shrink-0">
            <Smartphone className="h-6 w-6" />
          </div>

          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Install Recoup App</h3>
            <p className="text-sm text-blue-100 mb-3">
              Get quick access from your home screen
            </p>

            <div className="bg-blue-800/50 rounded-lg p-3 space-y-2 text-sm">
              <p className="font-medium">To install:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-100">
                <li>Tap the Share button <span className="inline-block">📤</span></li>
                <li>Scroll and tap "Add to Home Screen"</li>
                <li>Tap "Add" in the top right</li>
              </ol>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-white/80 hover:text-white transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop install prompt
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 shadow-lg z-50 animate-slide-up">
      <div className="max-w-4xl mx-auto flex items-center gap-4">
        <div className="flex-shrink-0">
          <div className="bg-white rounded-full p-2">
            <Download className="h-6 w-6 text-blue-600" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-1">Install Recoup App</h3>
          <p className="text-sm text-blue-100">
            Get instant access from your home screen. Works offline with push notifications.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDismiss}
            className="px-4 py-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
          >
            Not now
          </button>

          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalling ? 'Installing...' : 'Install'}
          </button>
        </div>
      </div>
    </div>
  );
}
