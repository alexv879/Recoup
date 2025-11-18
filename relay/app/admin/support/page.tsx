/**
 * Admin Support Tools Page
 * User lookup and payment status override tools
 */

'use client';

import { useState } from 'react';
import { Search, User, CreditCard, AlertCircle, CheckCircle } from 'lucide-react';

interface SearchResult {
  userId: string;
  email: string;
  name: string;
  subscriptionTier: string;
  status: string;
  recentActivity?: any;
}

export default function AdminSupportPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);

  // Payment override states
  const [overrideInvoiceId, setOverrideInvoiceId] = useState('');
  const [overrideStatus, setOverrideStatus] = useState('paid');
  const [overrideReason, setOverrideReason] = useState('');
  const [overriding, setOverriding] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleUserSearch = async () => {
    if (!searchTerm.trim()) return;

    try {
      setSearching(true);
      const response = await fetch('/api/admin/support/user-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchTerm }),
      });

      const data = await response.json();

      if (data.success) {
        setSearchResults(data.data.users);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setSearching(false);
    }
  };

  const handlePaymentOverride = async () => {
    if (!overrideInvoiceId || !overrideStatus || !overrideReason) {
      setOverrideMessage({ type: 'error', text: 'All fields are required' });
      return;
    }

    try {
      setOverriding(true);
      const response = await fetch('/api/admin/support/payment-override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: overrideInvoiceId,
          newStatus: overrideStatus,
          reason: overrideReason,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setOverrideMessage({ type: 'success', text: data.data.message });
        setOverrideInvoiceId('');
        setOverrideReason('');
      } else {
        setOverrideMessage({ type: 'error', text: data.error?.message || 'Override failed' });
      }
    } catch (error) {
      console.error('Error overriding payment:', error);
      setOverrideMessage({ type: 'error', text: 'Failed to override payment status' });
    } finally {
      setOverriding(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Support Tools</h1>
        <p className="text-gray-600 mt-1">User lookup and payment management tools</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Lookup Tool */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">User Lookup</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search by email, name, or user ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleUserSearch()}
                  placeholder="Enter email, name, or ID..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleUserSearch}
                  disabled={searching}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Found {searchResults.length} user{searchResults.length !== 1 ? 's' : ''}
                </p>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {searchResults.map((user) => (
                    <div
                      key={user.userId}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedUser(user)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500 mt-1 font-mono">{user.userId}</p>
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.subscriptionTier}
                        </span>
                      </div>
                      {user.recentActivity && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <p className="text-xs text-gray-500">
                            {user.recentActivity.totalInvoices} invoices | £
                            {Math.round(user.recentActivity.totalAmount).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.length === 0 && searchTerm && !searching && (
              <div className="text-center py-8 text-gray-500">
                <User className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                <p>No users found matching "{searchTerm}"</p>
              </div>
            )}
          </div>

          {/* Selected User Details */}
          {selectedUser && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-2">Selected User</h3>
              <div className="space-y-1 text-sm">
                <p><strong>Name:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>ID:</strong> <span className="font-mono">{selectedUser.userId}</span></p>
                <p><strong>Tier:</strong> {selectedUser.subscriptionTier}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/admin/users/${selectedUser.userId}`}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                >
                  View Full Profile
                </a>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Payment Status Override Tool */}
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">Payment Status Override</h2>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-semibold">Caution: Admin Override</p>
                <p className="mt-1">
                  This action will manually change an invoice's payment status. All changes are
                  logged in the audit trail. Always provide a clear reason.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice ID
              </label>
              <input
                type="text"
                value={overrideInvoiceId}
                onChange={(e) => setOverrideInvoiceId(e.target.value)}
                placeholder="Enter invoice ID..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="paid">Paid</option>
                <option value="sent">Sent</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reason for Override (Required)
              </label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Explain why this override is necessary..."
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {overrideMessage && (
              <div
                className={`p-4 rounded-lg border ${
                  overrideMessage.type === 'success'
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  {overrideMessage.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                  <p
                    className={`text-sm font-medium ${
                      overrideMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
                    }`}
                  >
                    {overrideMessage.text}
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={handlePaymentOverride}
              disabled={overriding}
              className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 font-medium"
            >
              {overriding ? 'Processing...' : 'Override Payment Status'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
