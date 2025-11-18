import { Suspense } from 'react';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase/firestore';
import AnalyticsDashboardClient from './AnalyticsDashboardClient';

export const metadata = {
    title: 'Analytics - Relay',
    description: 'Financial metrics, revenue trends, and collection analytics'
};

interface InvoiceData {
    amount: number;
    status: 'draft' | 'sent' | 'paid' | 'overdue' | 'pending';
    createdAt: Date;
    dueDate: Date;
    paidAt?: Date;
    clientName: string;
}

async function getAnalyticsData(userId: string, dateRange: { start: Date; end: Date }) {
    const invoicesRef = db.collection('invoices');
    const snapshot = await invoicesRef
        .where('userId', '==', userId)
        .where('createdAt', '>=', Timestamp.fromDate(dateRange.start))
        .where('createdAt', '<=', Timestamp.fromDate(dateRange.end))
        .get();

    const invoices: InvoiceData[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
            amount: data.amount || 0,
            status: data.status || 'draft',
            createdAt: data.createdAt?.toDate() || new Date(),
            dueDate: data.dueDate?.toDate() || new Date(),
            paidAt: data.paidAt?.toDate(),
            clientName: data.clientName || 'Unknown'
        };
    });

    return invoices;
}

function calculateMetrics(invoices: InvoiceData[], previousInvoices: InvoiceData[]) {
    // Current period metrics
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCollected = invoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
    const outstanding = invoices
        .filter((inv) => inv.status === 'sent' || inv.status === 'pending')
        .filter((inv) => new Date(inv.dueDate) > new Date())
        .reduce((sum, inv) => sum + inv.amount, 0);
    const overdue = invoices
        .filter((inv) => (inv.status === 'sent' || inv.status === 'overdue') && new Date(inv.dueDate) <= new Date())
        .reduce((sum, inv) => sum + inv.amount, 0);

    // Cash flow forecast (next 7 days)
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const dueNext7Days = invoices
        .filter((inv) => inv.status !== 'paid')
        .filter((inv) => {
            const due = new Date(inv.dueDate);
            return due >= now && due <= next7Days;
        })
        .reduce((sum, inv) => sum + inv.amount, 0);

    // Previous period metrics for comparison
    const prevTotalInvoiced = previousInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const prevTotalCollected = previousInvoices
        .filter((inv) => inv.status === 'paid')
        .reduce((sum, inv) => sum + inv.amount, 0);
    const prevOutstanding = previousInvoices
        .filter((inv) => inv.status === 'sent' || inv.status === 'pending')
        .reduce((sum, inv) => sum + inv.amount, 0);
    const prevOverdue = previousInvoices
        .filter((inv) => (inv.status === 'sent' || inv.status === 'overdue'))
        .reduce((sum, inv) => sum + inv.amount, 0);

    // Calculate percentage changes
    const invoicedChange = prevTotalInvoiced > 0
        ? ((totalInvoiced - prevTotalInvoiced) / prevTotalInvoiced) * 100
        : 0;
    const collectedChange = prevTotalCollected > 0
        ? ((totalCollected - prevTotalCollected) / prevTotalCollected) * 100
        : 0;
    const outstandingChange = prevOutstanding > 0
        ? ((outstanding - prevOutstanding) / prevOutstanding) * 100
        : 0;
    const overdueChange = prevOverdue > 0
        ? ((overdue - prevOverdue) / prevOverdue) * 100
        : 0;

    return {
        totalInvoiced,
        totalCollected,
        outstanding,
        overdue,
        dueNext7Days,
        invoicedChange,
        collectedChange,
        outstandingChange,
        overdueChange,
        invoicesByStatus: {
            paid: invoices.filter((inv) => inv.status === 'paid').length,
            pending: invoices.filter((inv) => inv.status === 'sent' || inv.status === 'pending').length,
            overdue: invoices.filter((inv) => inv.status === 'overdue').length,
            draft: invoices.filter((inv) => inv.status === 'draft').length
        }
    };
}

function generateChartData(invoices: InvoiceData[]) {
    // Group invoices by month for line chart
    const monthlyData: { [key: string]: { invoiced: number; collected: number; outstanding: number } } = {};

    invoices.forEach((invoice) => {
        const monthKey = invoice.createdAt.toLocaleString('en-US', { month: 'short', year: 'numeric' });

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { invoiced: 0, collected: 0, outstanding: 0 };
        }

        monthlyData[monthKey].invoiced += invoice.amount;

        if (invoice.status === 'paid') {
            monthlyData[monthKey].collected += invoice.amount;
        } else if (invoice.status === 'sent' || invoice.status === 'pending' || invoice.status === 'overdue') {
            monthlyData[monthKey].outstanding += invoice.amount;
        }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data
    }));
}

export default async function AnalyticsPage({
    searchParams
}: {
    searchParams: { dateRange?: string };
}) {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Date range calculation (default: last 30 days)
    const dateRangeParam = searchParams.dateRange || 'last30days';
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (dateRangeParam) {
        case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case 'last7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case 'last30days':
        default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case 'last90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case 'ytd':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
        case 'last12months':
            startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
    }

    // Fetch current period data
    const currentInvoices = await getAnalyticsData(userId, { start: startDate, end: endDate });

    // Fetch previous period data for comparison
    const periodDuration = endDate.getTime() - startDate.getTime();
    const prevStartDate = new Date(startDate.getTime() - periodDuration);
    const prevEndDate = new Date(startDate.getTime() - 1);
    const previousInvoices = await getAnalyticsData(userId, { start: prevStartDate, end: prevEndDate });

    // Calculate metrics
    const metrics = calculateMetrics(currentInvoices, previousInvoices);

    // Generate chart data
    const chartData = generateChartData(currentInvoices);

    // Overdue invoices list
    const overdueInvoices = currentInvoices
        .filter((inv) => (inv.status === 'sent' || inv.status === 'overdue') && new Date(inv.dueDate) <= new Date())
        .sort((a, b) => {
            const daysOverdueA = Math.floor((Date.now() - new Date(a.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            const daysOverdueB = Math.floor((Date.now() - new Date(b.dueDate).getTime()) / (1000 * 60 * 60 * 24));
            return daysOverdueB - daysOverdueA;
        });

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Financial Analytics</h1>
                <p className="mt-2 text-gray-600">Revenue trends, collection metrics, and cash flow insights</p>
            </div>

            <Suspense fallback={<div className="text-center py-12">Loading analytics...</div>}>
                <AnalyticsDashboardClient
                    metrics={metrics}
                    chartData={chartData}
                    overdueInvoices={overdueInvoices}
                    dateRange={dateRangeParam}
                />
            </Suspense>
        </div>
    );
}
