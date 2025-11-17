import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
import { db, COLLECTIONS } from '@/lib/firebase';

/**
 * Invoice Detail Page
 * Shows full invoice details, payment status, and available actions
 */
export default async function InvoiceDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { userId } = await auth();
    const { id } = await params;

    if (!userId) {
        redirect('/sign-in');
    }

    // Fetch invoice
    const invoiceDoc = await db.collection(COLLECTIONS.INVOICES).doc(id).get();

    if (!invoiceDoc.exists) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="p-8 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
                    <p className="text-gray-600 mb-4">The invoice you're looking for doesn't exist</p>
                    <Link href="/dashboard/invoices">
                        <Button>Back to Invoices</Button>
                    </Link>
                </Card>
            </div>
        );
    }

    const invoice = invoiceDoc.data() as any;

    // Verify ownership
    if (invoice.freelancerId !== userId) {
        redirect('/dashboard/invoices');
    }

    // Fetch collection attempts if collections enabled
    let collectionAttempts: any[] = [];
    if (invoice.collectionsEnabled) {
        const attemptsSnapshot = await db
            .collection(COLLECTIONS.COLLECTION_ATTEMPTS)
            .where('invoiceId', '==', id)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

        collectionAttempts = attemptsSnapshot.docs.map(doc => doc.data());
    }

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

    const formatDate = (timestamp: any) => {
        if (!timestamp) return 'N/A';
        const seconds = timestamp._seconds || timestamp.seconds || timestamp;
        return new Date(seconds * 1000).toLocaleDateString('en-GB');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900">{invoice.reference}</h1>
                                {getStatusBadge(invoice.status)}
                            </div>
                            <p className="text-gray-600">Invoice Details</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/dashboard/invoices">
                                <Button variant="outline">← Back</Button>
                            </Link>
                            {invoice.status === 'draft' && (
                                <Button>Send Invoice</Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Invoice Details */}
                        <Card className="p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6">Invoice Information</h2>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Client Name</p>
                                    <p className="font-semibold text-gray-900">{invoice.clientName}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Client Email</p>
                                    <p className="font-semibold text-gray-900">{invoice.clientEmail}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Invoice Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(invoice.invoiceDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Due Date</p>
                                    <p className="font-semibold text-gray-900">{formatDate(invoice.dueDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Amount</p>
                                    <p className="text-2xl font-bold text-gray-900">£{invoice.amount.toLocaleString()}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 mb-1">Status</p>
                                    <div className="mt-1">{getStatusBadge(invoice.status)}</div>
                                </div>
                            </div>

                            {invoice.description && (
                                <div className="mt-6 pt-6 border-t">
                                    <p className="text-sm text-gray-600 mb-2">Description</p>
                                    <p className="text-gray-900">{invoice.description}</p>
                                </div>
                            )}

                            {invoice.lineItems && invoice.lineItems.length > 0 && (
                                <div className="mt-6 pt-6 border-t">
                                    <p className="text-sm text-gray-600 mb-4">Line Items</p>
                                    <div className="space-y-2">
                                        {invoice.lineItems.map((item: any, index: number) => (
                                            <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                                <div>
                                                    <p className="font-medium text-gray-900">{item.description}</p>
                                                    <p className="text-sm text-gray-600">Qty: {item.quantity} × £{item.unitPrice}</p>
                                                </div>
                                                <p className="font-semibold text-gray-900">
                                                    £{(item.quantity * item.unitPrice).toFixed(2)}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </Card>

                        {/* Collections History */}
                        {invoice.collectionsEnabled && (
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                                    Collections History ({invoice.collectionsAttempts} attempts)
                                </h2>

                                {collectionAttempts.length > 0 ? (
                                    <div className="space-y-4">
                                        {collectionAttempts.map((attempt: any, index: number) => (
                                            <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                                <div className="text-2xl">
                                                    {attempt.attemptType === 'email_reminder' && '📧'}
                                                    {attempt.attemptType === 'sms_reminder' && '📱'}
                                                    {attempt.attemptType === 'ai_call' && '📞'}
                                                    {attempt.attemptType === 'physical_letter' && '📬'}
                                                    {!['email_reminder', 'sms_reminder', 'ai_call', 'physical_letter'].includes(attempt.attemptType) && '🔔'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="font-semibold text-gray-900">
                                                            {attempt.attemptType.replace(/_/g, ' ').toUpperCase()}
                                                        </p>
                                                        <Badge variant={attempt.result === 'success' ? 'success' : 'default'}>
                                                            {attempt.result}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-gray-600">{attempt.resultDetails}</p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {formatDate(attempt.attemptDate)}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 text-center py-8">No collection attempts yet</p>
                                )}
                            </Card>
                        )}
                    </div>

                    {/* Sidebar Actions */}
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <Card className="p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                            <div className="space-y-2">
                                {invoice.status === 'draft' && (
                                    <Button className="w-full">📤 Send Invoice</Button>
                                )}
                                {invoice.status === 'sent' && (
                                    <>
                                        <Button className="w-full" variant="outline">📧 Resend Invoice</Button>
                                        <Button className="w-full" variant="outline">💳 Mark as Paid</Button>
                                    </>
                                )}
                                {invoice.status === 'overdue' && !invoice.collectionsEnabled && (
                                    <Button className="w-full">🤖 Enable Collections</Button>
                                )}
                                {invoice.status === 'paid' && (
                                    <Button className="w-full" variant="outline">📥 Download Receipt</Button>
                                )}
                                <Link href={`/dashboard/invoices/${id}/edit`}>
                                    <Button className="w-full" variant="outline">✏️ Edit Invoice</Button>
                                </Link>
                            </div>
                        </Card>

                        {/* Payment Information */}
                        {invoice.status === 'paid' && invoice.paidAt && (
                            <Card className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Payment Details</h3>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-600">Paid On</p>
                                        <p className="font-semibold text-gray-900">{formatDate(invoice.paidAt)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Payment Method</p>
                                        <p className="font-semibold text-gray-900">{invoice.paymentMethod || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600">Amount Received</p>
                                        <p className="text-xl font-bold text-green-600">£{invoice.amount.toLocaleString()}</p>
                                    </div>
                                </div>
                            </Card>
                        )}

                        {/* Collections Info */}
                        {invoice.collectionsEnabled && (
                            <Card className="p-6">
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-xl">🤖</span>
                                    <h3 className="font-semibold text-gray-900">Collections Active</h3>
                                </div>
                                <p className="text-sm text-gray-600 mb-4">
                                    Automated collection reminders are enabled for this invoice
                                </p>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Attempts</span>
                                        <span className="font-semibold">{invoice.collectionsAttempts}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Last Attempt</span>
                                        <span className="font-semibold">
                                            {invoice.lastCollectionAttemptAt
                                                ? formatDate(invoice.lastCollectionAttemptAt)
                                                : 'Never'}
                                        </span>
                                    </div>
                                </div>
                                <Button className="w-full mt-4" variant="outline" size="sm">
                                    Disable Collections
                                </Button>
                            </Card>
                        )}

                        {/* Payment Link */}
                        {invoice.stripePaymentLinkUrl && (
                            <Card className="p-6">
                                <h3 className="font-semibold text-gray-900 mb-4">Payment Link</h3>
                                <p className="text-sm text-gray-600 mb-3">
                                    Share this link with your client for online payment
                                </p>
                                <input
                                    type="text"
                                    readOnly
                                    value={invoice.stripePaymentLinkUrl}
                                    className="w-full px-3 py-2 text-sm border rounded bg-gray-50 mb-2"
                                    onClick={(e) => (e.target as HTMLInputElement).select()}
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full"
                                    onClick={() => {
                                        navigator.clipboard.writeText(invoice.stripePaymentLinkUrl);
                                        alert('Link copied!');
                                    }}
                                >
                                    📋 Copy Link
                                </Button>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
