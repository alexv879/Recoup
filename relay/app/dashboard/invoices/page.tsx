'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { Tabs } from '@/components/UI/Tabs';

interface Invoice {
    invoiceId: string;
    reference: string;
    clientName: string;
    clientEmail: string;
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
    dueDate: { _seconds: number };
    invoiceDate: { _seconds: number };
    collectionsEnabled: boolean;
    collectionsAttempts: number;
}

/**
 * Invoices List Page
 * Shows all user invoices with filters and search
 */
export default function InvoicesPage() {
    const router = useRouter();
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchInvoices();
    }, [filter]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filter !== 'all') params.append('status', filter);

            const response = await fetch(`/api/invoices?${params.toString()}`);
            if (response.ok) {
                const data = await response.json();
                setInvoices(data.invoices || []);
            }
        } catch (error) {
            console.error('Failed to fetch invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredInvoices = invoices.filter(invoice =>
        invoice.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            paid: 'success',
            sent: 'default',
            overdue: 'destructive',
            draft: 'secondary',
            cancelled: 'secondary',
        };
        return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
    };

    const formatDate = (timestamp: { _seconds: number }) => {
        return new Date(timestamp._seconds * 1000).toLocaleDateString('en-GB');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
                            <p className="text-gray-600 mt-1">Manage all your invoices</p>
                        </div>
                        <Link href="/dashboard/invoices/new">
                            <Button>+ Create Invoice</Button>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Filters and Search */}
                <Card className="p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex gap-2 flex-wrap">
                            <Button
                                variant={filter === 'all' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                variant={filter === 'draft' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('draft')}
                            >
                                Draft
                            </Button>
                            <Button
                                variant={filter === 'sent' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('sent')}
                            >
                                Sent
                            </Button>
                            <Button
                                variant={filter === 'paid' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('paid')}
                            >
                                Paid
                            </Button>
                            <Button
                                variant={filter === 'overdue' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setFilter('overdue')}
                            >
                                Overdue
                            </Button>
                        </div>

                        <input
                            type="text"
                            placeholder="Search invoices..."
                            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </Card>

                {/* Invoice List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Loading invoices...</p>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <Card className="p-12 text-center">
                        <div className="text-6xl mb-4">📄</div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No invoices found</h3>
                        <p className="text-gray-600 mb-6">
                            {searchQuery ? 'Try a different search term' : 'Create your first invoice to get started'}
                        </p>
                        {!searchQuery && (
                            <Link href="/dashboard/invoices/new">
                                <Button>Create First Invoice</Button>
                            </Link>
                        )}
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {filteredInvoices.map((invoice) => (
                            <Card
                                key={invoice.invoiceId}
                                className="p-6 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => router.push(`/dashboard/invoices/${invoice.invoiceId}`)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                {invoice.reference}
                                            </h3>
                                            {getStatusBadge(invoice.status)}
                                            {invoice.collectionsEnabled && (
                                                <Badge variant="default">
                                                    🤖 Collections ({invoice.collectionsAttempts})
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex gap-6 text-sm text-gray-600">
                                            <span>Client: {invoice.clientName}</span>
                                            <span>Due: {formatDate(invoice.dueDate)}</span>
                                            <span>Issued: {formatDate(invoice.invoiceDate)}</span>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">
                                            £{invoice.amount.toLocaleString()}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/dashboard/invoices/${invoice.invoiceId}`);
                                                }}
                                            >
                                                View
                                            </Button>
                                            {invoice.status === 'draft' && (
                                                <Button
                                                    variant="default"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        // TODO: Send invoice
                                                    }}
                                                >
                                                    Send
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
