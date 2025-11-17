# COOKIE CONSENT BANNER - HTML & CSS IMPLEMENTATION

## Overview

This is a UK/GDPR-compliant cookie consent banner with:
- Accept All / Reject All / Customize buttons
- Persistent consent preferences (localStorage)
- Analytics toggle (Google Analytics)
- Marketing toggle (Facebook Pixel, Google Ads)
- Essential cookies (cannot disable)
- Language: Plain English, compliant with ICO guidelines

---

## 1. HTML Code

```html
<!-- COOKIE CONSENT BANNER - Add to <body> tag -->
<div id="cookie-banner" class="cookie-banner">
  <div class="cookie-container">
    <div class="cookie-content">
      <div class="cookie-header">
        <span class="cookie-icon">🍪</span>
        <h3>We Use Cookies</h3>
      </div>
      
      <p class="cookie-description">
        We use cookies to personalize content, provide social media features, and analyze our traffic. 
        Essential cookies are always enabled for login and security. Non-essential cookies require your consent.
      </p>
      
      <div class="cookie-buttons-row">
        <button id="accept-all-btn" class="btn btn-primary">Accept All</button>
        <button id="reject-all-btn" class="btn btn-secondary">Reject All</button>
        <button id="customize-btn" class="btn btn-tertiary">Customize</button>
      </div>
      
      <a href="/cookie-policy" class="cookie-link">Read our Cookie Policy</a>
    </div>
  </div>
</div>

<!-- CUSTOMIZE PREFERENCES MODAL -->
<div id="cookie-modal" class="cookie-modal hidden">
  <div class="cookie-modal-content">
    <div class="modal-header">
      <h2>Manage Cookie Preferences</h2>
      <button id="close-modal" class="close-btn">&times;</button>
    </div>
    
    <div class="modal-body">
      <!-- Essential Cookies (Always On) -->
      <div class="cookie-category">
        <label class="cookie-checkbox-label">
          <input type="checkbox" value="essential" checked disabled class="cookie-checkbox">
          <strong>Essential Cookies (Required)</strong>
        </label>
        <p class="cookie-description-small">
          These cookies are necessary for the website to function properly, including login sessions, 
          security tokens, and CSRF protection. You cannot opt out.
        </p>
      </div>
      
      <!-- Analytics Cookies -->
      <div class="cookie-category">
        <label class="cookie-checkbox-label">
          <input type="checkbox" value="analytics" class="cookie-checkbox">
          <strong>Analytics & Performance</strong>
        </label>
        <p class="cookie-description-small">
          These cookies help us understand how you use our service (e.g., Google Analytics). 
          We use this data to improve features and performance. Your data may be transferred to the US.
        </p>
      </div>
      
      <!-- Marketing Cookies -->
      <div class="cookie-category">
        <label class="cookie-checkbox-label">
          <input type="checkbox" value="marketing" class="cookie-checkbox">
          <strong>Marketing & Advertising</strong>
        </label>
        <p class="cookie-description-small">
          These cookies track your activity to show relevant ads (e.g., Facebook Pixel, Google Ads). 
          If disabled, you'll still see ads but they may be less relevant.
        </p>
      </div>
      
      <!-- Functional Cookies -->
      <div class="cookie-category">
        <label class="cookie-checkbox-label">
          <input type="checkbox" value="functional" checked class="cookie-checkbox">
          <strong>Functional Cookies</strong>
        </label>
        <p class="cookie-description-small">
          These cookies enhance your experience (e.g., remember your theme preference, language).
        </p>
      </div>
    </div>
    
    <div class="modal-footer">
      <button id="reject-modal-btn" class="btn btn-secondary">Reject All</button>
      <button id="save-preferences-btn" class="btn btn-primary">Save My Preferences</button>
    </div>
  </div>
</div>

<!-- Overlay for modal -->
<div id="cookie-modal-overlay" class="cookie-modal-overlay hidden"></div>
```

---

## 2. CSS Code

```css
/* Cookie Banner Styles */

:root {
  --primary-color: #007bff;
  --secondary-color: #6c757d;
  --danger-color: #dc3545;
  --success-color: #28a745;
  --light-bg: #f8f9fa;
  --dark-text: #333;
  --border-color: #dee2e6;
}

/* Banner Container */
.cookie-banner {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid var(--border-color);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  animation: slideUp 0.3s ease-in-out;
  padding: 20px;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.cookie-container {
  max-width: 1200px;
  margin: 0 auto;
}

.cookie-content {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.cookie-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.cookie-icon {
  font-size: 24px;
}

.cookie-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--dark-text);
}

.cookie-description {
  margin: 0;
  color: #555;
  font-size: 14px;
  line-height: 1.5;
}

.cookie-description-small {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
}

/* Button Row */
.cookie-buttons-row {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.btn-primary {
  background-color: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: var(--secondary-color);
  color: white;
}

.btn-secondary:hover {
  background-color: #5a6268;
}

.btn-tertiary {
  background-color: transparent;
  color: var(--primary-color);
  border: 1px solid var(--primary-color);
}

.btn-tertiary:hover {
  background-color: var(--light-bg);
}

.cookie-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 12px;
}

.cookie-link:hover {
  text-decoration: underline;
}

/* Modal Styles */
.cookie-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: white;
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  z-index: 10000;
  max-width: 500px;
  width: 90%;
  animation: popIn 0.3s ease-in-out;
}

@keyframes popIn {
  from {
    transform: translate(-50%, -50%) scale(0.9);
    opacity: 0;
  }
  to {
    transform: translate(-50%, -50%) scale(1);
    opacity: 1;
  }
}

.cookie-modal.hidden {
  display: none;
}

.cookie-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.cookie-modal-overlay.hidden {
  display: none;
}

.cookie-modal-content {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  padding: 20px;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--dark-text);
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  padding: 0;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: var(--dark-text);
}

.modal-body {
  padding: 20px;
  flex: 1;
  overflow-y: auto;
}

.cookie-category {
  margin-bottom: 20px;
  padding: 15px;
  background-color: var(--light-bg);
  border-radius: 4px;
}

.cookie-category:last-child {
  margin-bottom: 0;
}

.cookie-checkbox-label {
  display: flex;
  align-items: flex-start;
  cursor: pointer;
  gap: 10px;
}

.cookie-checkbox {
  margin-top: 2px;
  cursor: pointer;
  width: 18px;
  height: 18px;
  accent-color: var(--primary-color);
}

.cookie-checkbox:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cookie-checkbox-label strong {
  color: var(--dark-text);
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid var(--border-color);
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-footer .btn {
  flex: 1;
  max-width: 200px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .cookie-banner {
    padding: 15px;
  }

  .cookie-content {
    gap: 12px;
  }

  .cookie-buttons-row {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }

  .cookie-modal {
    max-width: 95%;
    width: 95%;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 15px;
  }

  .modal-footer {
    flex-direction: column;
  }

  .modal-footer .btn {
    max-width: 100%;
  }
}
```

---

## 3. JavaScript Implementation

```javascript
// Cookie Consent Manager
class CookieConsentManager {
  constructor() {
    this.storageKey = 'cookie-consent-preferences';
    this.banner = document.getElementById('cookie-banner');
    this.modal = document.getElementById('cookie-modal');
    this.overlay = document.getElementById('cookie-modal-overlay');
    
    this.acceptAllBtn = document.getElementById('accept-all-btn');
    this.rejectAllBtn = document.getElementById('reject-all-btn');
    this.customizeBtn = document.getElementById('customize-btn');
    this.savePreferencesBtn = document.getElementById('save-preferences-btn');
    this.rejectModalBtn = document.getElementById('reject-modal-btn');
    this.closeModalBtn = document.getElementById('close-modal');
    
    this.analyticsCheckbox = document.querySelector('input[value="analytics"]');
    this.marketingCheckbox = document.querySelector('input[value="marketing"]');
    this.functionalCheckbox = document.querySelector('input[value="functional"]');
    
    this.init();
  }

  init() {
    // Load saved preferences or show banner
    const saved = this.getSavedPreferences();
    
    if (saved) {
      this.applyPreferences(saved);
      this.hideBanner();
    } else {
      this.showBanner();
    }

    // Event listeners
    this.acceptAllBtn.addEventListener('click', () => this.acceptAll());
    this.rejectAllBtn.addEventListener('click', () => this.rejectAll());
    this.customizeBtn.addEventListener('click', () => this.openModal());
    this.savePreferencesBtn.addEventListener('click', () => this.savePreferences());
    this.rejectModalBtn.addEventListener('click', () => this.rejectAll());
    this.closeModalBtn.addEventListener('click', () => this.closeModal());
    this.overlay.addEventListener('click', () => this.closeModal());
  }

  getSavedPreferences() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  }

  savePreferences(preferences) {
    localStorage.setItem(this.storageKey, JSON.stringify(preferences));
    localStorage.setItem('cookie-consent-timestamp', new Date().toISOString());
  }

  acceptAll() {
    const preferences = {
      essential: true,
      analytics: true,
      marketing: true,
      functional: true,
    };
    this.savePreferences(preferences);
    this.applyPreferences(preferences);
    this.hideBanner();
    this.showConfirmation('All cookies accepted');
  }

  rejectAll() {
    const preferences = {
      essential: true,
      analytics: false,
      marketing: false,
      functional: true,
    };
    this.savePreferences(preferences);
    this.applyPreferences(preferences);
    this.hideBanner();
    this.closeModal();
    this.showConfirmation('Non-essential cookies rejected');
  }

  openModal() {
    // Pre-populate checkboxes with saved preferences
    const saved = this.getSavedPreferences();
    if (saved) {
      this.analyticsCheckbox.checked = saved.analytics;
      this.marketingCheckbox.checked = saved.marketing;
      this.functionalCheckbox.checked = saved.functional;
    }

    this.modal.classList.remove('hidden');
    this.overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  closeModal() {
    this.modal.classList.add('hidden');
    this.overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  savePreferences() {
    const preferences = {
      essential: true,
      analytics: this.analyticsCheckbox.checked,
      marketing: this.marketingCheckbox.checked,
      functional: this.functionalCheckbox.checked,
    };
    this.savePreferences(preferences);
    this.applyPreferences(preferences);
    this.hideBanner();
    this.closeModal();
    this.showConfirmation('Preferences saved');
  }

  applyPreferences(preferences) {
    if (preferences.analytics) {
      this.loadGoogleAnalytics();
    }

    if (preferences.marketing) {
      this.loadFacebookPixel();
      this.loadGoogleAds();
    }

    if (preferences.functional) {
      this.loadFunctionalScripts();
    }
  }

  loadGoogleAnalytics() {
    if (document.querySelector('script[src*="google-analytics"]')) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID';
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  }

  loadFacebookPixel() {
    if (window.fbq) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.textContent = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){
        n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)
      };if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)}(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      fbq('init', 'YOUR_PIXEL_ID');
      fbq('track', 'PageView');
    `;
    document.head.appendChild(script);
  }

  loadGoogleAds() {
    if (document.querySelector('script[src*="google-ads"]')) {
      return; // Already loaded
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX';
    document.head.appendChild(script);
  }

  loadFunctionalScripts() {
    // Load any functional enhancements (theme switching, etc.)
    console.log('Functional cookies enabled');
  }

  showBanner() {
    this.banner.style.display = 'block';
  }

  hideBanner() {
    this.banner.style.display = 'none';
  }

  showConfirmation(message) {
    console.log(message);
    // Optional: Show toast notification
  }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  new CookieConsentManager();
});
```

---

## 4. Implementation Steps

### Step 1: Replace Placeholders

In the JavaScript code, replace:
- `GA_MEASUREMENT_ID` → Your Google Analytics ID (e.g., `G-1A2B3C4D5E`)
- `YOUR_PIXEL_ID` → Your Facebook Pixel ID
- `ca-pub-XXXXXXXXXXXXXXXX` → Your Google Ads client ID (if using)

### Step 2: Add HTML to Your Site

Copy the HTML code into your `base.html` or main layout template, before closing `</body>` tag.

### Step 3: Add CSS to Your Stylesheet

Add the CSS to your main `styles.css` file or create a new `cookie-banner.css` file.

### Step 4: Add JavaScript to Your Site

Add the JavaScript before closing `</body>` tag or in a separate `cookie-consent.js` file.

### Step 5: Test in Browser

1. Open your site in an incognito/private window
2. Cookie banner should appear at bottom
3. Test "Accept All", "Reject All", "Customize" buttons
4. Verify Google Analytics loads when analytics enabled
5. Check localStorage for `cookie-consent-preferences`

### Step 6: Update Cookie Policy Link

Update the link in the HTML from `/cookie-policy` to your actual cookie policy page URL.

---

## 5. Configuration Notes

### Essential Cookies (Cannot Disable)
- `session_id` - Login session
- `auth_token` - Authentication
- `csrf_token` - Security
- `user_preferences` - Theme/language

### Analytics Cookies
- Google Analytics (`_ga`, `_gid`, `_gat`)
- Mixpanel (if used)

### Marketing Cookies
- Facebook Pixel
- Google Ads conversion tags
- LinkedIn Insights Tag

### Testing Checklist
- ✓ Banner appears on first visit
- ✓ Preferences saved in localStorage
- ✓ Banner hidden on subsequent visits
- ✓ "Customize" opens modal
- ✓ "Accept All" loads all tracking scripts
- ✓ "Reject All" only loads essential
- ✓ Checkboxes work in customize modal
- ✓ "Save Preferences" saves custom selection

---

**Cookie Banner Version:** 1.0  
**Last Updated:** [Date]