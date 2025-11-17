/**
 * Email Template Preview Component
 * Allows previewing and testing email templates before sending
 * 
 * @see MASTER_IMPLEMENTATION_AUDIT_V1.md §4.3
 */

'use client';

import { useState } from 'react';
import type { ReminderLevel, EmailTemplateVariables } from '@/lib/emailTemplateRenderer';
import { track } from '@/lib/analytics';

interface EmailPreviewProps {
    /** Invoice data to populate template */
    invoiceData: {
        invoiceNumber: string;
        clientName: string;
        amount: number; // in pence
        dueDate: Date;
        daysOverdue: number;
    };
    /** Freelancer data */
    freelancerData: {
        name: string;
        email: string;
        phone?: string;
        company?: string;
    };
    /** Payment link URL */
    paymentLink: string;
    /** Callback when send is confirmed */
    onSendEmail?: (level: ReminderLevel) => Promise<void>;
}

export function EmailPreview({
    invoiceData,
    freelancerData,
    paymentLink,
    onSendEmail,
}: EmailPreviewProps) {
    const [selectedLevel, setSelectedLevel] = useState<ReminderLevel>('day5');
    const [activeTab, setActiveTab] = useState<'html' | 'text'>('html');
    const [sending, setSending] = useState(false);

    // Build template variables
    const templateVariables: EmailTemplateVariables = {
        client_name: invoiceData.clientName,
        invoice_number: invoiceData.invoiceNumber,
        amount: (invoiceData.amount / 100).toFixed(2),
        due_date: invoiceData.dueDate.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        }),
        days_overdue: invoiceData.daysOverdue,
        freelancer_name: freelancerData.name,
        freelancer_email: freelancerData.email,
        freelancer_phone: freelancerData.phone,
        freelancer_company: freelancerData.company,
        payment_link: paymentLink,
    };

    // Get preview from API
    const [preview, setPreview] = useState<{
        html: string;
        text: string;
        subject: string;
    } | null>(null);

    const loadPreview = async (level: ReminderLevel) => {
        try {
            track('email_template_previewed', {
                invoice_id: invoiceData.invoiceNumber,
                reminder_level: level,
                days_overdue: invoiceData.daysOverdue,
            });

            const response = await fetch('/api/email-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    level,
                    variables: templateVariables,
                    invoiceAmountPence: invoiceData.amount,
                }),
            });

            if (!response.ok) throw new Error('Failed to load preview');

            const data = await response.json();
            setPreview(data);
        } catch (error) {
            console.error('Preview error:', error);
            alert('Failed to load email preview. Please try again.');
        }
    };

    // Load preview when level changes
    useState(() => {
        loadPreview(selectedLevel);
    });

    const handleLevelChange = (level: ReminderLevel) => {
        setSelectedLevel(level);
        loadPreview(level);
    };

    const handleSend = async () => {
        if (!onSendEmail) return;

        const confirmed = confirm(
            `Send ${getReminderLevelLabel(selectedLevel)} reminder to ${invoiceData.clientName}?`
        );

        if (!confirmed) return;

        setSending(true);
        try {
            await onSendEmail(selectedLevel);
            alert('Email sent successfully!');
        } catch (error) {
            console.error('Send error:', error);
            alert('Failed to send email. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-4">
            {/* Level selector */}
            <div className="flex gap-2">
                <button
                    onClick={() => handleLevelChange('day5')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedLevel === 'day5'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Day 5 (Friendly)
                </button>
                <button
                    onClick={() => handleLevelChange('day15')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedLevel === 'day15'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Day 15 (Firm)
                </button>
                <button
                    onClick={() => handleLevelChange('day30')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${selectedLevel === 'day30'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                >
                    Day 30 (Legal)
                </button>
            </div>

            {/* Subject line */}
            {preview && (
                <div className="border-l-4 border-blue-500 bg-blue-50 p-4 rounded-r">
                    <div className="text-sm font-medium text-gray-600 mb-1">Subject:</div>
                    <div className="font-semibold text-gray-900">{preview.subject}</div>
                </div>
            )}

            {/* Format tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('html')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'html'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    HTML Preview
                </button>
                <button
                    onClick={() => setActiveTab('text')}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${activeTab === 'text'
                            ? 'border-blue-600 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Plain Text
                </button>
            </div>

            {/* Preview content */}
            {preview && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                    {activeTab === 'html' ? (
                        <iframe
                            srcDoc={preview.html}
                            className="w-full h-[600px] bg-white"
                            title="Email HTML Preview"
                            sandbox="allow-same-origin"
                        />
                    ) : (
                        <pre className="p-4 bg-gray-50 text-sm font-mono overflow-auto h-[600px] whitespace-pre-wrap">
                            {preview.text}
                        </pre>
                    )}
                </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 justify-end">
                <button
                    onClick={() => window.print()}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                >
                    Print Preview
                </button>
                {onSendEmail && (
                    <button
                        onClick={handleSend}
                        disabled={sending}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {sending ? 'Sending...' : 'Send Email'}
                    </button>
                )}
            </div>

            {/* Info notice */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
                <strong>⚠️ Important:</strong> Day 30 template includes late payment interest calculation
                for informational purposes only. You decide whether to claim interest - it is not automatically
                added to the invoice.
            </div>
        </div>
    );
}

function getReminderLevelLabel(level: ReminderLevel): string {
    switch (level) {
        case 'day5':
            return 'Day 5 Friendly';
        case 'day15':
            return 'Day 15 Firm';
        case 'day30':
            return 'Day 30 Final Notice';
    }
}
