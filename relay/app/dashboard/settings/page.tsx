/**
 * DASHBOARD SETTINGS PAGE
 *
 * User account and business settings including:
 * - Business details (name, type)
 * - Business address (for physical letters)
 * - Notification preferences
 * - Collections consent
 * - Banking details
 */

'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Building2, MapPin, Bell, Shield, CreditCard, Save, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BusinessAddress {
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    postcode: string;
    country: string;
}

export default function SettingsPage() {
    const { user } = useUser();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Business Details
    const [businessName, setBusinessName] = useState('');
    const [businessType, setBusinessType] = useState<'freelancer' | 'agency' | 'consultant'>('freelancer');

    // Business Address
    const [address, setAddress] = useState<BusinessAddress>({
        companyName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        postcode: '',
        country: 'United Kingdom',
    });
    const [postcodeValid, setPostcodeValid] = useState(true);

    // Load user settings
    useEffect(() => {
        async function loadSettings() {
            try {
                const response = await fetch('/api/users/me');
                if (!response.ok) throw new Error('Failed to load settings');

                const data = await response.json();

                setBusinessName(data.businessName || '');
                setBusinessType(data.businessType || 'freelancer');

                if (data.businessAddress) {
                    setAddress({
                        companyName: data.businessAddress.companyName || '',
                        addressLine1: data.businessAddress.addressLine1 || '',
                        addressLine2: data.businessAddress.addressLine2 || '',
                        city: data.businessAddress.city || '',
                        postcode: data.businessAddress.postcode || '',
                        country: data.businessAddress.country || 'United Kingdom',
                    });
                }

                setLoading(false);
            } catch (err) {
                console.error('Error loading settings:', err);
                setError('Failed to load settings');
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    // UK Postcode validation
    const validatePostcode = (postcode: string): boolean => {
        // UK postcode format: SW1A 1AA, EC1A 1BB, W1A 0AX
        const ukPostcodeRegex = /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i;
        return ukPostcodeRegex.test(postcode.trim());
    };

    const handlePostcodeChange = (value: string) => {
        setAddress({ ...address, postcode: value });
        if (value.trim()) {
            setPostcodeValid(validatePostcode(value));
        } else {
            setPostcodeValid(true); // Empty is valid (not required yet)
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(false);

            // Validate address if any field is filled
            const hasAddressData = address.addressLine1 || address.city || address.postcode;

            if (hasAddressData) {
                if (!address.addressLine1 || !address.city || !address.postcode) {
                    setError('Please complete all required address fields (Address, City, Postcode)');
                    setSaving(false);
                    return;
                }

                if (!validatePostcode(address.postcode)) {
                    setError('Please enter a valid UK postcode (e.g., SW1A 1AA)');
                    setSaving(false);
                    return;
                }
            }

            const response = await fetch('/api/users/me', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessName,
                    businessType,
                    businessAddress: hasAddressData ? address : null,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to save settings');
            }

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error saving settings:', err);
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
                <p className="text-gray-600 mt-1">Manage your account and business settings</p>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">Settings saved successfully!</span>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <span className="text-red-800">{error}</span>
                </div>
            )}

            {/* Business Details Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Building2 className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Business Details</h2>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Name
                        </label>
                        <input
                            type="text"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            placeholder="Your business or freelance name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Business Type
                        </label>
                        <select
                            value={businessType}
                            onChange={(e) => setBusinessType(e.target.value as any)}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                        >
                            <option value="freelancer">Freelancer</option>
                            <option value="consultant">Consultant</option>
                            <option value="agency">Agency</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Business Address Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-3 mb-2">
                    <MapPin className="w-6 h-6 text-indigo-600" />
                    <h2 className="text-xl font-semibold text-gray-900">Business Address</h2>
                </div>
                <p className="text-sm text-gray-600 mb-6">
                    Required for sending physical collection letters. Your address will appear on letter headers.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={address.companyName}
                            onChange={(e) => setAddress({ ...address, companyName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            placeholder="Company Ltd"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 1 <span className="text-red-600">*</span>
                        </label>
                        <input
                            type="text"
                            value={address.addressLine1}
                            onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            placeholder="123 High Street"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Address Line 2 <span className="text-gray-400">(Optional)</span>
                        </label>
                        <input
                            type="text"
                            value={address.addressLine2}
                            onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                            placeholder="Suite 4B"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                City <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={address.city}
                                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
                                placeholder="London"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Postcode <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={address.postcode}
                                onChange={(e) => handlePostcodeChange(e.target.value)}
                                className={`w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-indigo-600 focus:border-transparent ${!postcodeValid ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                    }`}
                                placeholder="SW1A 1AA"
                            />
                            {!postcodeValid && (
                                <p className="text-xs text-red-600 mt-1">
                                    Please enter a valid UK postcode
                                </p>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Country
                        </label>
                        <input
                            type="text"
                            value={address.country}
                            readOnly
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-50 text-gray-500"
                        />
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={handleSave}
                    disabled={saving || !postcodeValid}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 transition-colors"
                >
                    {saving ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            Save Settings
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
