import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Custom/Card';
import { Badge } from '@/components/Custom/Badge';
import { Button } from '@/components/Custom/Button';
import { DashboardClient } from './DashboardClient';
import { EmptyState } from '@/components/Dashboard/EmptyState';

/**
 * Main Dashboard Page
 * Shows overview of financial metrics, recent invoices, and quick actions
 */
export default async function DashboardPage() {
    const { userId } = await auth();

    if (!userId) {
        redirect('/sign-in');
    }

    // Fetch dashboard summary data
    const summaryRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/summary`,
        {
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
            },
            cache: 'no-store',
        }
    );

    const summary = summaryRes.ok ? await summaryRes.json() : null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Pass userId and summary to client component for interactivity */}
            <DashboardClient userId={userId} summary={summary} />

            {/* Header */}
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                            <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
                        </div>
                        <div className="flex gap-3">
                            <Link href="/dashboard/invoices/new">
                                <Button>+ Create Invoice</Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Financial Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    {/* Total Revenue */}
                    <Card className="p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Total Owed</p>
                                <p className="text-3xl font-bold text-gray-900">
                                    £{summary?.financial?.totalInvoiced?.toLocaleString() || '0'}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                    <p className="text-xs text-green-600 font-medium">
                                        ↑ {summary?.financial?.monthlyGrowth || '0'}% from last month
                                    </p>
                                </div>
                                {summary?.invoices?.overdue > 0 && (
                                    <Link href="/dashboard/invoices?status=overdue" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
                                        View overdue →
                                    </Link>
                                )}
                            </div>
                            <div className="text-4xl">💰</div>
                        </div>
                    </Card>

                    {/* Outstanding */}
                    <Card className="p-6 border-l-4 border-orange-500 bg-orange-50/50 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Overdue</p>
                                <p className="text-3xl font-bold text-orange-600">
                                    £{summary?.financial?.totalOutstanding?.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-gray-600 mt-2">
                                    <strong>{summary?.invoices?.overdue || 0}</strong> invoices past due
                                </p>
                                {summary?.invoices?.overdue > 0 && (
                                    <button className="mt-2 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600 transition-colors">
                                        Send Reminders
                                    </button>
                                )}
                            </div>
                            <div className="text-4xl">⚠</div>
                        </div>
                    </Card>

                    {/* Collected */}
                    <Card className="p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Collected</p>
                                <p className="text-3xl font-bold text-green-600">
                                    £{summary?.financial?.totalCollected?.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-gray-600 mt-2">
                                    {summary?.invoices?.paid || 0} paid invoices
                                </p>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>
                    </Card>

                    {/* XP Level */}
                    <Card className="p-6 border-l-4 border-purple-500 hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">XP Level</p>
                                <p className="text-3xl font-bold text-purple-600">
                                    {summary?.gamification?.level || 1}
                                </p>
                                <p className="text-xs text-gray-600 mt-2">
                                    {summary?.gamification?.xp || 0} XP
                                </p>
                            </div>
                            <div className="text-4xl">⭐</div>
                        </div>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent Invoices */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Recent Invoices</h2>
                            <Link href="/dashboard/invoices">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {summary?.recentActivity?.recentInvoices?.length ? (
                                summary.recentActivity.recentInvoices.map((invoice: any) => (
                                    <div key={invoice.invoiceId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <p className="font-semibold text-gray-900">{invoice.reference}</p>
                                                <Badge variant={
                                                    invoice.status === 'paid' ? 'default' :
                                                        invoice.status === 'overdue' ? 'destructive' :
                                                            invoice.status === 'sent' ? 'default' : 'secondary'
                                                }
                                                    className={invoice.status === 'paid' ? 'bg-green-100 text-green-800 border-green-200' : ''}
                                                >
                                                    {invoice.status}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {invoice.clientName} • Due: {new Date(invoice.dueDate._seconds * 1000).toLocaleDateString('en-GB')}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-gray-900">£{invoice.amount.toLocaleString()}</p>
                                            <Link href={`/dashboard/invoices/${invoice.invoiceId}`}>
                                                <Button variant="ghost" size="sm">View</Button>
                                            </Link>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon="📄"
                                    headline="No invoices yet"
                                    description="Start sending invoices to your clients and track payments easily. It only takes a few minutes to create your first invoice."
                                    primaryCTA={{
                                        label: "Create First Invoice",
                                        href: "/dashboard/invoices/new"
                                    }}
                                    secondaryCTAs={[
                                        { label: "Learn more", href: "/help/invoices" },
                                        { label: "Watch demo", href: "/demo" }
                                    ]}
                                />
                            )}
                        </div>
                    </Card>

                    {/* Recent Payments */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Recent Payments</h2>
                            <Link href="/dashboard/payments">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            {summary?.recentActivity?.recentPayments?.length ? (
                                summary.recentActivity.recentPayments.map((payment: any) => (
                                    <div key={payment.transactionId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <p className="font-semibold text-gray-900">{payment.invoiceReference}</p>
                                                <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Paid</Badge>
                                            </div>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {new Date(payment.createdAt._seconds * 1000).toLocaleDateString('en-GB')} • {payment.paymentMethod}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-green-600">+£{payment.freelancerNet.toLocaleString()}</p>
                                            <p className="text-xs text-gray-500">£{payment.relayCommission.toFixed(2)} fee</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <EmptyState
                                    icon="💳"
                                    headline="No payments received yet"
                                    description="When your clients pay their invoices, you'll see all payment activity here. Payments are processed securely and arrive in your account within 2-3 business days."
                                    primaryCTA={{
                                        label: "Send Your First Invoice",
                                        href: "/dashboard/invoices/new"
                                    }}
                                    secondaryCTAs={[
                                        { label: "Payment FAQ", href: "/help/payments" }
                                    ]}
                                />
                            )}
                        </div>
                    </Card>

                    {/* Collections Activity */}
                    {summary?.collections?.collectionsEnabled > 0 && (
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-900">Collections</h2>
                                <Badge variant="default">{summary.collections.collectionsEnabled} active</Badge>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Success Rate</span>
                                    <span className="font-semibold">
                                        {summary.collections.collectionsEnabled > 0
                                            ? Math.round((summary.collections.successfulCollections / summary.collections.collectionsEnabled) * 100)
                                            : 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Revenue Recovered</span>
                                    <span className="font-semibold text-green-600">
                                        £{summary.collections.collectionsRevenue.toLocaleString()}
                                    </span>
                                </div>

                                {summary.recentActivity?.recentCollections?.length > 0 && (
                                    <div className="mt-4 pt-4 border-t">
                                        <p className="text-sm font-medium text-gray-700 mb-2">Recent Attempts</p>
                                        {summary.recentActivity.recentCollections.map((attempt: any) => (
                                            <div key={attempt.attemptId} className="text-sm text-gray-600 py-1">
                                                {attempt.invoiceReference} • {attempt.attemptType}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Card>
                    )}

                    {/* Gamification */}
                    <Card className="p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Your Progress</h2>
                            <Link href="/dashboard/gamification">
                                <Button variant="outline" size="sm">View All</Button>
                            </Link>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Level {summary?.gamification?.level || 1}</span>
                                    <span className="text-sm text-gray-600">
                                        {summary?.gamification?.xp || 0} / {summary?.gamification?.nextLevelXP || 100} XP
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-purple-600 h-2 rounded-full transition-all"
                                        style={{
                                            width: `${((summary?.gamification?.xp || 0) / (summary?.gamification?.nextLevelXP || 100)) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>

                            {summary?.gamification?.badges?.length > 0 && (
                                <div>
                                    <p className="text-sm font-medium text-gray-700 mb-2">Latest Badges</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {summary.gamification.badges.slice(0, 5).map((badge: any) => (
                                            <div key={badge.badgeId} className="text-2xl" title={badge.badgeName}>
                                                {badge.badgeIcon || '🏆'}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {summary?.gamification?.streak > 0 && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">🔥</span>
                                        <div>
                                            <p className="font-semibold text-gray-900">{summary.gamification.streak} Day Streak</p>
                                            <p className="text-sm text-gray-600">Keep it going!</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Quick Actions */}
                <Card className="p-6 mt-8">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <Link href="/dashboard/invoices/new">
                            <Button variant="outline" className="w-full">
                                📄 New Invoice
                            </Button>
                        </Link>
                        <Link href="/dashboard/invoices">
                            <Button variant="outline" className="w-full">
                                📋 View Invoices
                            </Button>
                        </Link>
                        <Link href="/dashboard/analytics">
                            <Button variant="outline" className="w-full">
                                📊 Analytics
                            </Button>
                        </Link>
                        <Link href="/dashboard/settings">
                            <Button variant="outline" className="w-full">
                                ⚙️ Settings
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        </div>
    );
}
