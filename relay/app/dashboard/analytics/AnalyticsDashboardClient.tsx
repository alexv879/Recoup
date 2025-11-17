'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

interface MetricCardProps {
    title: string;
    subtitle: string;
    value: number;
    change: number;
    format?: 'currency' | 'number';
    colorScheme?: 'green' | 'blue' | 'yellow' | 'red';
}

interface AnalyticsMetrics {
    totalInvoiced: number;
    totalCollected: number;
    outstanding: number;
    overdue: number;
    dueNext7Days: number;
    invoicedChange: number;
    collectedChange: number;
    outstandingChange: number;
    overdueChange: number;
    invoicesByStatus: {
        paid: number;
        pending: number;
        overdue: number;
        draft: number;
    };
}

interface ChartDataPoint {
    month: string;
    invoiced: number;
    collected: number;
    outstanding: number;
}

interface OverdueInvoice {
    amount: number;
    status: string;
    createdAt: Date;
    dueDate: Date;
    clientName: string;
}

interface Props {
    metrics: AnalyticsMetrics;
    chartData: ChartDataPoint[];
    overdueInvoices: OverdueInvoice[];
    dateRange: string;
}

function MetricCard({ title, subtitle, value, change, format = 'currency', colorScheme = 'blue' }: MetricCardProps) {
    const formattedValue = format === 'currency'
        ? new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(value)
        : value.toLocaleString();

    const changeColor = change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-500';
    const changeIcon = change > 0 ? '↑' : change < 0 ? '↓' : '→';

    const borderColors = {
        green: 'border-l-green-500',
        blue: 'border-l-blue-500',
        yellow: 'border-l-yellow-500',
        red: 'border-l-red-500'
    };

    return (
        <div className={`bg-white rounded-lg border border-gray-200 ${borderColors[colorScheme]} border-l-4 p-6 shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex flex-col">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
                <p className="text-3xl font-bold text-gray-900 mt-3">{formattedValue}</p>
                {change !== 0 && (
                    <p className={`text-sm mt-2 flex items-center gap-1 ${changeColor}`}>
                        <span className="font-semibold">{changeIcon} {Math.abs(change).toFixed(1)}%</span>
                        <span className="text-gray-500">vs last period</span>
                    </p>
                )}
            </div>
        </div>
    );
}

export default function AnalyticsDashboardClient({ metrics, chartData, overdueInvoices, dateRange }: Props) {
    const router = useRouter();
    const [selectedDateRange, setSelectedDateRange] = useState(dateRange);

    const handleDateRangeChange = (newRange: string) => {
        setSelectedDateRange(newRange);
        router.push(`/dashboard/analytics?dateRange=${newRange}`);
    };

    // Prepare data for charts
    const statusBarData = [
        { status: 'Paid', count: metrics.invoicesByStatus.paid, amount: metrics.totalCollected },
        { status: 'Pending', count: metrics.invoicesByStatus.pending, amount: metrics.outstanding },
        { status: 'Overdue', count: metrics.invoicesByStatus.overdue, amount: metrics.overdue },
        { status: 'Draft', count: metrics.invoicesByStatus.draft, amount: 0 }
    ];

    const statusPieData = [
        { name: 'Paid', value: metrics.totalCollected, color: '#10b981' },
        { name: 'Outstanding', value: metrics.outstanding, color: '#3b82f6' },
        { name: 'Overdue', value: metrics.overdue, color: '#ef4444' }
    ].filter(item => item.value > 0);

    const handleExportPDF = () => {
        alert('PDF export coming soon! This will generate a formatted report.');
    };

    const handleExportCSV = () => {
        alert('CSV export coming soon! This will download invoice data for accounting software.');
    };

    return (
        <div className="space-y-8">
            {/* Date Range Filter */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <label htmlFor="dateRange" className="text-sm font-medium text-gray-700">
                        Date Range:
                    </label>
                    <select
                        id="dateRange"
                        value={selectedDateRange}
                        onChange={(e) => handleDateRangeChange(e.target.value)}
                        className="rounded-md border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="today">Today</option>
                        <option value="last7days">Last 7 Days</option>
                        <option value="last30days">Last 30 Days</option>
                        <option value="last90days">Last 90 Days</option>
                        <option value="ytd">Year to Date</option>
                        <option value="last12months">Last 12 Months</option>
                    </select>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportPDF}
                        className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        📄 Export PDF
                    </button>
                    <button
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-2 rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        📥 Export CSV
                    </button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                <MetricCard
                    title="TOTAL INVOICED"
                    subtitle="This Period"
                    value={metrics.totalInvoiced}
                    change={metrics.invoicedChange}
                    colorScheme="blue"
                />
                <MetricCard
                    title="TOTAL COLLECTED"
                    subtitle="Paid Invoices"
                    value={metrics.totalCollected}
                    change={metrics.collectedChange}
                    colorScheme="green"
                />
                <MetricCard
                    title="OUTSTANDING"
                    subtitle="Not Yet Due"
                    value={metrics.outstanding}
                    change={metrics.outstandingChange}
                    colorScheme="blue"
                />
                <MetricCard
                    title="OVERDUE"
                    subtitle="Past Due Date"
                    value={metrics.overdue}
                    change={metrics.overdueChange}
                    colorScheme="red"
                />
                <MetricCard
                    title="DUE NEXT 7 DAYS"
                    subtitle="Cash Flow Alert"
                    value={metrics.dueNext7Days}
                    change={0}
                    colorScheme="yellow"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Line Chart: Revenue Trend */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend Over Time</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="month" />
                            <YAxis />
                            <Tooltip formatter={(value) => `£${Number(value).toLocaleString()}`} />
                            <Legend />
                            <Line type="monotone" dataKey="invoiced" stroke="#3b82f6" strokeWidth={2} name="Invoiced" />
                            <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} name="Collected" />
                            <Line type="monotone" dataKey="outstanding" stroke="#f59e0b" strokeWidth={2} name="Outstanding" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* Bar Chart: Invoices by Status */}
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoices by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={statusBarData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="status" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" fill="#3b82f6" name="Count" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart: Status Breakdown */}
            {statusPieData.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Breakdown by Status</h3>
                    <div className="flex items-center justify-center">
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={statusPieData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, value, percent }) => `${name}: £${value.toLocaleString()} (${((percent || 0) * 100).toFixed(0)}%)`}
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {statusPieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `£${Number(value).toLocaleString()}`} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Overdue Invoices Table */}
            {overdueInvoices.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Overdue Invoices</h3>
                        <p className="text-sm text-gray-600 mt-1">{overdueInvoices.length} invoices require immediate attention</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Client
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Due Date
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Days Overdue
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {overdueInvoices.slice(0, 10).map((invoice, idx) => {
                                    const daysOverdue = Math.floor((Date.now() - new Date(invoice.dueDate).getTime()) / (1000 * 60 * 60 * 24));
                                    const urgency = daysOverdue > 30 ? 'text-red-600' : daysOverdue > 10 ? 'text-orange-600' : 'text-yellow-600';

                                    return (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {invoice.clientName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(invoice.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(invoice.dueDate).toLocaleDateString('en-GB')}
                                            </td>
                                            <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${urgency}`}>
                                                {daysOverdue} days
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${daysOverdue > 30 ? 'bg-red-100 text-red-800' : daysOverdue > 10 ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {daysOverdue > 30 ? '🔴 Urgent' : daysOverdue > 10 ? '🟠 Action Required' : '🟡 Overdue'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <Link
                            href="/dashboard/invoices?filter=overdue"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            View all overdue invoices →
                        </Link>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {overdueInvoices.length === 0 && (
                <div className="bg-white rounded-lg border border-gray-200 p-12 text-center shadow-sm">
                    <div className="text-6xl mb-4">✅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No Overdue Invoices</h3>
                    <p className="text-gray-600">All invoices are paid or within due date. Great job!</p>
                </div>
            )}
        </div>
    );
}
