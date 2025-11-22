/**
 * PWA Utilities
 *
 * Service worker registration, push notifications, and install prompt handling
 */

'use client';

// ============================================================================
// SERVICE WORKER REGISTRATION
// ============================================================================

/**
 * Register service worker
 * Call this from a client component or useEffect
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[PWA] Service worker registered:', registration);

    // Check for updates every hour
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New service worker available
          console.log('[PWA] New service worker available');

          // Notify user about update
          if (confirm('A new version of Recoup is available. Reload to update?')) {
            newWorker.postMessage({ type: 'SKIP_WAITING' });
            window.location.reload();
          }
        }
      });
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service worker registration failed:', error);
    return null;
  }
}

/**
 * Unregister all service workers (for debugging)
 */
export async function unregisterServiceWorkers() {
  if (!('serviceWorker' in navigator)) return;

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }

  console.log('[PWA] All service workers unregistered');
}

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================

/**
 * Check if push notifications are supported
 */
export function isPushNotificationSupported(): boolean {
  return 'PushManager' in window && 'Notification' in window;
}

/**
 * Request push notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const permission = await Notification.requestPermission();
  console.log('[PWA] Notification permission:', permission);

  return permission;
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
  vapidPublicKey: string
): Promise<PushSubscription | null> {
  if (!isPushNotificationSupported()) {
    console.log('[PWA] Push notifications not supported');
    return null;
  }

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    console.log('[PWA] Notification permission not granted');
    return null;
  }

  const registration = await navigator.serviceWorker.ready;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
    });

    console.log('[PWA] Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('[PWA] Failed to subscribe to push notifications:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    return false;
  }

  const result = await subscription.unsubscribe();
  console.log('[PWA] Unsubscribed from push notifications');

  return result;
}

/**
 * Send push subscription to server
 */
export async function savePushSubscription(subscription: PushSubscription): Promise<boolean> {
  try {
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(subscription),
    });

    return response.ok;
  } catch (error) {
    console.error('[PWA] Failed to save push subscription:', error);
    return false;
  }
}

// ============================================================================
// INSTALL PROMPT
// ============================================================================

let deferredPrompt: any = null;

/**
 * Listen for install prompt event
 * Call this once on app initialization
 */
export function listenForInstallPrompt(callback?: (prompt: any) => void) {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Prevent the default browser install prompt
    event.preventDefault();

    // Store the event for later use
    deferredPrompt = event;

    console.log('[PWA] Install prompt available');

    // Notify callback
    if (callback) {
      callback(event);
    }
  });

  // Listen for app installed event
  window.addEventListener('appinstalled', () => {
    console.log('[PWA] App installed successfully');
    deferredPrompt = null;
  });
}

/**
 * Show install prompt
 * Returns true if user accepted, false if dismissed
 */
export async function showInstallPrompt(): Promise<boolean> {
  if (!deferredPrompt) {
    console.log('[PWA] Install prompt not available');
    return false;
  }

  // Show the install prompt
  deferredPrompt.prompt();

  // Wait for user's response
  const { outcome } = await deferredPrompt.userChoice;

  console.log('[PWA] Install prompt outcome:', outcome);

  // Clear the deferred prompt
  deferredPrompt = null;

  return outcome === 'accepted';
}

/**
 * Check if install prompt is available
 */
export function isInstallPromptAvailable(): boolean {
  return deferredPrompt !== null;
}

/**
 * Check if app is installed (running in standalone mode)
 */
export function isAppInstalled(): boolean {
  if (typeof window === 'undefined') return false;

  // Check if running in standalone mode
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

  // Check iOS standalone
  const isIosStandalone = (window.navigator as any).standalone === true;

  return isStandalone || isIosStandalone;
}

/**
 * Check if running on iOS
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;

  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

/**
 * Check if running on Android
 */
export function isAndroid(): boolean {
  if (typeof window === 'undefined') return false;

  return /Android/.test(navigator.userAgent);
}

// ============================================================================
// OFFLINE DETECTION
// ============================================================================

/**
 * Check if app is online
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

/**
 * Listen for online/offline events
 */
export function listenForOnlineStatus(
  onOnline: () => void,
  onOffline: () => void
) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Convert VAPID key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Clear all caches (for debugging)
 */
export async function clearAllCaches() {
  if (!('caches' in window)) return;

  const cacheNames = await caches.keys();
  await Promise.all(cacheNames.map((name) => caches.delete(name)));

  console.log('[PWA] All caches cleared');
}
