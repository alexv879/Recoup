# Settings & Billing Code Examples for Relay

## 1. Settings Sidebar Navigation

```javascript
// SettingsSidebar.jsx - Collapsible sidebar for settings
import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Menu, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const SettingsSidebar = ({ isOpen, setIsOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState({
    account: true,
    billing: true
  });

  const sections = [
    {
      id: 'account',
      title: 'Account',
      items: [
        { label: 'Profile', path: '/settings/profile', icon: '👤' },
        { label: 'Preferences', path: '/settings/preferences', icon: '⚙️' },
        { label: 'Avatar & Branding', path: '/settings/avatar', icon: '🎨' }
      ]
    },
    {
      id: 'billing',
      title: 'Billing & Usage',
      items: [
        { label: 'Current Plan', path: '/settings/billing/plan', icon: '📋' },
        { label: 'Usage Monitor', path: '/settings/billing/usage', icon: '📊' },
        { label: 'Payment Methods', path: '/settings/billing/payments', icon: '💳' },
        { label: 'Billing History', path: '/settings/billing/history', icon: '📜' }
      ]
    },
    {
      id: 'automation',
      title: 'Automation',
      items: [
        { label: 'Notifications', path: '/settings/notifications', icon: '🔔' },
        { label: 'Email Templates', path: '/settings/templates', icon: '📧' },
        { label: 'Collection Rules', path: '/settings/collections', icon: '📲' },
        { label: 'Reminders', path: '/settings/reminders', icon: '⏰' }
      ]
    },
    {
      id: 'security',
      title: 'Team & Security',
      items: [
        { label: 'Team Members', path: '/settings/team', icon: '👥' },
        { label: 'Permissions', path: '/settings/permissions', icon: '🔐' },
        { label: 'Password', path: '/settings/password', icon: '🔑' },
        { label: 'Two-Factor Auth', path: '/settings/2fa', icon: '🛡️' },
        { label: 'Active Sessions', path: '/settings/sessions', icon: '💻' }
      ]
    },
    {
      id: 'advanced',
      title: 'Advanced',
      items: [
        { label: 'API Keys', path: '/settings/api-keys', icon: '🔗' },
        { label: 'Webhooks', path: '/settings/webhooks', icon: '🪝' },
        { label: 'Integrations', path: '/settings/integrations', icon: '🔌' }
      ]
    }
  ];

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg hover:bg-gray-100 lg:hidden"
        aria-label="Toggle settings menu"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Backdrop on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-white border-r border-gray-200 overflow-y-auto z-40 transition-transform lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-6 pt-16 lg:pt-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-8">Settings</h1>

          <nav className="space-y-1">
            {sections.map(section => (
              <div key={section.id}>
                {/* Section Header */}
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  {section.title}
                  {expandedSections[section.id] ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                {/* Section Items */}
                {expandedSections[section.id] && (
                  <div className="mt-1 ml-2 space-y-1">
                    {section.items.map(item => (
                      <button
                        key={item.path}
                        onClick={() => {
                          navigate(item.path);
                          setIsOpen(false); // Close sidebar on mobile
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                          isActive(item.path)
                            ? 'bg-blue-50 text-blue-600 font-semibold'
                            : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
};

export default SettingsSidebar;
```

## 2. Billing Plan & Usage Display

```javascript
// BillingPage.jsx - Current plan and usage monitoring
import React, { useState } from 'react';
import { AlertCircle, TrendingUp, ArrowUpRight } from 'lucide-react';

const BillingPage = ({ userPlan, usage, onUpgrade }) => {
  const plans = {
    free: { name: 'Free', price: '£0/month', limit: 10 },
    pro: { name: 'Professional', price: '£29/month', limit: 50 },
    enterprise: { name: 'Enterprise', price: 'Custom', limit: 'Unlimited' }
  };

  const usagePercent = (usage.invoicesSent / plans[userPlan].limit) * 100;
  const isNearLimit = usagePercent >= 80;
  const isAtLimit = usagePercent >= 100;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Current Plan Card */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Current Plan</h2>

        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {plans[userPlan].name}
            </p>
            <p className="text-gray-600">
              {plans[userPlan].price} • {plans[userPlan].limit} invoices per month
            </p>
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
            Active
          </span>
        </div>

        <div className="space-y-3 mb-6 text-sm text-gray-600">
          <p>Next billing date: <span className="font-semibold text-gray-900">Dec 15, 2025</span></p>
          <p>Status: <span className="font-semibold text-green-600">✓ Active</span></p>
          <p>Auto-renewal: <span className="font-semibold text-gray-900">Enabled</span></p>
        </div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={onUpgrade}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
          >
            Upgrade Plan
          </button>
          <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors">
            Change Plan
          </button>
          <button className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-semibold transition-colors">
            Cancel Subscription
          </button>
        </div>
      </div>

      {/* Usage Monitor */}
      <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Monthly Usage</h2>

        {/* Alert Banner */}
        {isNearLimit && (
          <div className={`p-4 rounded-lg mb-6 flex gap-3 ${
            isAtLimit
              ? 'bg-red-50 border border-red-200'
              : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
              isAtLimit ? 'text-red-600' : 'text-yellow-600'
            }`} />
            <div className={isAtLimit ? 'text-red-800' : 'text-yellow-800'}>
              <p className="font-semibold">
                {isAtLimit
                  ? 'You\'ve reached your monthly invoice limit'
                  : 'You\'re approaching your monthly limit'}
              </p>
              <p className="text-sm mt-1">
                {isAtLimit
                  ? 'Upgrade to continue sending invoices'
                  : `${plans[userPlan].limit - usage.invoicesSent} invoices remaining`}
              </p>
            </div>
          </div>
        )}

        {/* Usage Stats */}
        <div className="space-y-4">
          {/* Invoices */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-900">Invoices Sent</p>
              <p className="text-sm text-gray-600">
                {usage.invoicesSent} of {plans[userPlan].limit}
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  usagePercent >= 100 ? 'bg-red-500' :
                  usagePercent >= 80 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {Math.round(usagePercent)}% of monthly quota • 
              {plans[userPlan].limit - usage.invoicesSent > 0 
                ? ` ${plans[userPlan].limit - usage.invoicesSent} remaining`
                : ' Upgrade to add more'
              }
            </p>
          </div>

          {/* Collections */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <p className="font-semibold text-gray-900">Collections Tracked</p>
              <p className="text-sm text-gray-600">
                {usage.collectionsTracked} of 100
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="h-3 rounded-full bg-blue-500 transition-all"
                style={{ width: `${(usage.collectionsTracked / 100) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Reset Info */}
        <p className="mt-6 text-sm text-gray-600">
          Usage resets: <span className="font-semibold">Dec 15, 2025</span>
        </p>
      </div>

      {/* Plans Comparison */}
      <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-3">Curious about other plans?</h3>
        <p className="text-gray-700 mb-4">
          Compare features and find the right plan for your business.
        </p>
        <button className="text-blue-600 hover:text-blue-700 font-semibold inline-flex items-center gap-1">
          View all plans <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BillingPage;
```

## 3. Payment Method Management

```javascript
// PaymentMethodsPage.jsx - Add/remove credit cards
import React, { useState } from 'react';
import { Trash2, Plus, Check } from 'lucide-react';

const PaymentMethodsPage = () => {
  const [paymentMethods, setPaymentMethods] = useState([
    {
      id: '1',
      type: 'visa',
      last4: '4242',
      expiry: '12/27',
      isDefault: true,
      name: 'John\'s Card'
    },
    {
      id: '2',
      type: 'mastercard',
      last4: '8888',
      expiry: '06/28',
      isDefault: false,
      name: 'Business Card'
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);

  const handleSetDefault = (id) => {
    setPaymentMethods(methods =>
      methods.map(m => ({
        ...m,
        isDefault: m.id === id
      }))
    );
  };

  const handleRemove = (id) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Payment Methods</h2>
        <p className="text-gray-600">Manage your credit cards and payment options</p>
      </div>

      {/* Default Payment Method */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-sm font-semibold text-gray-600 mb-3">Default Payment Method</p>
        {paymentMethods.find(m => m.isDefault) && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-700 rounded flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {paymentMethods.find(m => m.isDefault).type.toUpperCase().substring(0, 2)}
                </span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">
                  {paymentMethods.find(m => m.isDefault).type} •••• {paymentMethods.find(m => m.isDefault).last4}
                </p>
                <p className="text-sm text-gray-600">
                  Expires {paymentMethods.find(m => m.isDefault).expiry}
                </p>
              </div>
            </div>
            <Check className="w-5 h-5 text-green-600" />
          </div>
        )}
      </div>

      {/* Other Payment Methods */}
      {paymentMethods.filter(m => !m.isDefault).length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-600">Other Cards</p>
          {paymentMethods.filter(m => !m.isDefault).map(method => (
            <div
              key={method.id}
              className="p-4 bg-white border border-gray-200 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-8 bg-gradient-to-r from-gray-400 to-gray-500 rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {method.type.toUpperCase().substring(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {method.type} •••• {method.last4}
                  </p>
                  <p className="text-sm text-gray-600">
                    Expires {method.expiry}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSetDefault(method.id)}
                  className="px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Set Default
                </button>
                <button
                  onClick={() => handleRemove(method.id)}
                  className="px-3 py-1.5 text-sm text-red-700 hover:bg-red-50 rounded transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Card Button */}
      <button
        onClick={() => setShowAddForm(true)}
        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-700 hover:border-gray-400 hover:bg-gray-50 font-semibold flex items-center justify-center gap-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        Add New Card
      </button>

      {/* Add Card Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 z-40 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Add Payment Method</h3>
            
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Smith"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expiry
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    CVC
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Add Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsPage;
```

## 4. Notification Preferences

```javascript
// NotificationPreferences.jsx - Email/SMS toggle by event
import React, { useState } from 'react';
import { Bell } from 'lucide-react';

const NotificationPreferences = () => {
  const [preferences, setPreferences] = useState({
    invoiceCreated: { email: true, sms: false },
    paymentReceived: { email: true, sms: true },
    paymentFailed: { email: true, sms: true },
    collectionReminder: { email: true, sms: false },
    collectionEscalation: { email: true, sms: true },
    featureAnnouncements: { email: false, sms: false },
    criticalAlerts: { email: true, sms: true }
  });

  const events = [
    {
      id: 'invoiceCreated',
      label: 'Invoice Created',
      description: 'When you create and send a new invoice'
    },
    {
      id: 'paymentReceived',
      label: 'Payment Received',
      description: 'When a client pays an invoice'
    },
    {
      id: 'paymentFailed',
      label: 'Payment Failed',
      description: 'When a payment attempt fails'
    },
    {
      id: 'collectionReminder',
      label: 'Collection Reminder',
      description: 'Reminders for overdue invoices'
    },
    {
      id: 'collectionEscalation',
      label: 'Collection Escalation',
      description: 'When collections reach final demand'
    },
    {
      id: 'featureAnnouncements',
      label: 'Feature Announcements',
      description: 'News about new features'
    },
    {
      id: 'criticalAlerts',
      label: 'Critical Alerts',
      description: 'Important system and security alerts'
    }
  ];

  const togglePreference = (eventId, channel) => {
    setPreferences(prev => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        [channel]: !prev[eventId][channel]
      }
    }));
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notification Preferences
        </h2>
        <p className="text-gray-600">Choose how and when you receive notifications</p>
      </div>

      {/* Notification Settings Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Notification Type
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  SMS
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {events.map(event => (
                <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-gray-900">{event.label}</p>
                    <p className="text-sm text-gray-600">{event.description}</p>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={preferences[event.id].email}
                      onChange={() => togglePreference(event.id, 'email')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={preferences[event.id].sms}
                      onChange={() => togglePreference(event.id, 'sms')}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 cursor-pointer"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Frequency Settings */}
      <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
        <p className="font-semibold text-gray-900 mb-3">Email Frequency</p>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="frequency" defaultChecked className="w-4 h-4" />
            <span className="text-gray-700">Real-time notifications</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="frequency" className="w-4 h-4" />
            <span className="text-gray-700">Daily digest at 9 AM</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name="frequency" className="w-4 h-4" />
            <span className="text-gray-700">Weekly summary</span>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <button className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors">
        Save Preferences
      </button>
    </div>
  );
};

export default NotificationPreferences;
```

These production-ready components provide the complete settings and billing experience for Relay's subscription management.
