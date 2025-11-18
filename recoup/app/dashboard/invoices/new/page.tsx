'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { VoiceRecorder } from '@/components/voice/VoiceRecorder';
import { AccessibleFormField } from '@/lib/accessibility';
import { trackEvent } from '@/lib/analytics';
import { useUser } from '@clerk/nextjs';

interface InvoiceForm {
    clientName: string;
    clientEmail: string;
    clientPhone?: string;
    amount: number;
    description: string;
    invoiceDate: string;
    dueDate: string;
    lineItems: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
    }>;
}

/**
 * Invoice Creation Page
 * Create invoices manually or with voice transcription
 */
export default function NewInvoicePage() {
    const router = useRouter();
    const { user } = useUser();
    const [loading, setLoading] = useState(false);
    const [showVoice, setShowVoice] = useState(false);
    const [form, setForm] = useState<InvoiceForm>({
        clientName: '',
        clientEmail: '',
        clientPhone: '',
        amount: 0,
        description: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        lineItems: [{ description: '', quantity: 1, unitPrice: 0 }],
    });

    // Track page view on mount
    useEffect(() => {
        trackEvent('invoice_created', {
            user_id: user?.id,
        });
    }, [user?.id]);

    const handleVoiceData = (data: any) => {
        // Handle voice transcription data
        if (data.clientName) setForm(prev => ({ ...prev, clientName: data.clientName }));
        if (data.clientEmail) setForm(prev => ({ ...prev, clientEmail: data.clientEmail }));
        if (data.amount) setForm(prev => ({ ...prev, amount: data.amount }));
        if (data.description) setForm(prev => ({ ...prev, description: data.description }));
        if (data.lineItems) setForm(prev => ({ ...prev, lineItems: data.lineItems }));

        // Track voice input usage
        trackEvent('voice_invoice_submitted', {
            user_id: user?.id,
            has_client_data: !!(data.clientName || data.clientEmail),
            has_amount: !!data.amount,
            has_line_items: !!data.lineItems,
        });

        setShowVoice(false);
    };

    const addLineItem = () => {
        setForm(prev => ({
            ...prev,
            lineItems: [...prev.lineItems, { description: '', quantity: 1, unitPrice: 0 }],
        }));
    };

    const removeLineItem = (index: number) => {
        setForm(prev => ({
            ...prev,
            lineItems: prev.lineItems.filter((_, i) => i !== index),
        }));
    };

    const updateLineItem = (index: number, field: string, value: any) => {
        setForm(prev => ({
            ...prev,
            lineItems: prev.lineItems.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            ),
        }));
    };

    const calculateTotal = () => {
        return form.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const total = calculateTotal();
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...form,
                    amount: total,
                    status: 'draft',
                }),
            });

            if (response.ok) {
                const data = await response.json();

                // Track successful invoice creation
                const total = calculateTotal();
                const isFirstInvoice = !(user?.publicMetadata as any)?.activationEvents?.firstInvoiceAt;

                trackEvent(isFirstInvoice ? 'first_invoice_created' : 'invoice_created', {
                    user_id: user?.id,
                    invoice_id: data.invoiceId,
                    amount: total,
                    line_items: form.lineItems.length,
                    has_voice_meta: showVoice,
                    client_name: form.clientName,
                    time_to_first_invoice_minutes: isFirstInvoice ?
                        Math.floor((Date.now() - (user?.createdAt?.getTime() || Date.now())) / (1000 * 60)) :
                        undefined,
                });

                router.push(`/dashboard/invoices/${data.invoiceId}`);
            } else {
                const error = await response.json();
                alert(error.error || 'Failed to create invoice');
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('Failed to create invoice');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Create Invoice</h1>
                            <p className="text-gray-600 mt-1">Fill in the details or use voice input</p>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/invoices')}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto">
                    {/* Voice Input Option */}
                    <Card className="p-6 mb-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-gray-900">Voice Input</h3>
                                <p className="text-sm text-gray-600">Create invoice by speaking</p>
                            </div>
                            <Button
                                variant="outline"
                                onClick={() => setShowVoice(!showVoice)}
                            >
                                🎤 {showVoice ? 'Hide' : 'Show'} Voice Recorder
                            </Button>
                        </div>
                        {showVoice && (
                            <div className="mt-4">
                                <VoiceRecorder onTranscriptionComplete={handleVoiceData} />
                            </div>
                        )}
                    </Card>

                    {/* Invoice Form */}
                    <Card className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Client Information */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AccessibleFormField
                                        id="clientName"
                                        label="Client Name"
                                        type="text"
                                        required
                                        value={form.clientName}
                                        onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <AccessibleFormField
                                        id="clientEmail"
                                        label="Client Email"
                                        type="email"
                                        required
                                        value={form.clientEmail}
                                        onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <AccessibleFormField
                                        id="clientPhone"
                                        label="Client Phone"
                                        type="tel"
                                        helpText="Optional"
                                        value={form.clientPhone || ''}
                                        onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Invoice Dates */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Dates</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <AccessibleFormField
                                        id="invoiceDate"
                                        label="Invoice Date"
                                        type="date"
                                        required
                                        value={form.invoiceDate}
                                        onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <AccessibleFormField
                                        id="dueDate"
                                        label="Due Date"
                                        type="date"
                                        required
                                        value={form.dueDate}
                                        onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Line Items */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">Line Items</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                        + Add Item
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {form.lineItems.map((item, index) => (
                                        <div key={index} className="flex gap-4 items-start">
                                            <div className="flex-1">
                                                <input
                                                    type="text"
                                                    placeholder="Description"
                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={item.description}
                                                    onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    placeholder="Qty"
                                                    min="1"
                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={item.quantity}
                                                    onChange={(e) => updateLineItem(index, 'quantity', parseFloat(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            <div className="w-32">
                                                <input
                                                    type="number"
                                                    placeholder="Price"
                                                    min="0"
                                                    step="0.01"
                                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={item.unitPrice}
                                                    onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value))}
                                                    required
                                                />
                                            </div>
                                            <div className="w-32 text-right pt-2">
                                                <p className="font-semibold">£{(item.quantity * item.unitPrice).toFixed(2)}</p>
                                            </div>
                                            {form.lineItems.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeLineItem(index)}
                                                >
                                                    ✕
                                                </Button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 pt-4 border-t">
                                    <div className="flex justify-between items-center text-xl font-bold">
                                        <span>Total:</span>
                                        <span>£{calculateTotal().toFixed(2)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Additional Notes (optional)
                                </label>
                                <textarea
                                    rows={4}
                                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={form.description}
                                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    placeholder="Add any additional notes or payment terms..."
                                />
                            </div>

                            {/* Submit Buttons */}
                            <div className="flex gap-4">
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? 'Creating...' : 'Create Invoice'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push('/dashboard/invoices')}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </Card>
                </div>
            </div>
        </div>
    );
}
