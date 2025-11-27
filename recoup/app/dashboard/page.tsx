import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/UI/Card';
import { Badge } from '@/components/UI/Badge';
import { Button } from '@/components/UI/Button';
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
        <div className="min-h-screen bg-[#FAFBF9]">
            {/* Pass userId and summary to client component for interactivity */}
            <DashboardClient userId={userId} summary={summary} />

            {/* Hero Card - Above the Fold */}
            <div className="bg-gradient-to-br from-[#0078D4] to-[#208094] text-white">
                <div className="container mx-auto px-4 py-12">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-bold mb-2">Welcome back! 👋</h1>
                            <p className="text-blue-100 text-lg">Here's what needs your attention today</p>
                        </div>
                        <Link href="/dashboard/invoices/new">
                            <Button variant="cta" size="xl" className="bg-white text-[#0078D4] hover:bg-gray-100 min-w-[200px]">
                                + Create Invoice
                            </Button>
                        </Link>
                    </div>

                    {/* Outstanding Amount - Hero Metric */}
                    <div className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                        <p className="text-blue-100 text-sm font-medium mb-2">OUTSTANDING</p>
                        <p className="text-5xl font-bold mb-2">
                            £{summary?.financial?.totalInvoiced?.toLocaleString() || '0'}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="text-green-300">
                                ↑ {summary?.financial?.monthlyGrowth || '0'}% from last month
                            </span>
                            {summary?.invoices?.overdue > 0 && (
                                <Link href="/dashboard/invoices?status=overdue" className="text-yellow-300 hover:underline">
                                    {summary.invoices.overdue} overdue →
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8">
                {/* Today's Actions - Quick Access */}
                {(summary?.invoices?.overdue > 0 || summary?.recentActivity?.recentInvoices?.length > 0) && (
                    <Card className="mb-8 p-6 bg-gradient-to-r from-[#FFFBEB] to-white border-l-4 border-[#F59E0B]">
                        <h2 className="text-xl font-bold text-[#1F2937] mb-4 flex items-center gap-2">
                            <span className="text-2xl">⚡</span>
                            Today's Actions
                        </h2>
                        <div className="space-y-3">
                            {summary?.invoices?.overdue > 0 && (
                                <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-[#F59E0B]/20">
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#F59E0B] animate-pulse"></div>
                                        <div>
                                            <p className="font-semibold text-[#1F2937]">
                                                Send payment reminders
                                            </p>
                                            <p className="text-sm text-[#6B7280]">
                                                {summary.invoices.overdue} invoice{summary.invoices.overdue > 1 ? 's' : ''} overdue
                                            </p>
                                        </div>
                                    </div>
                                    <Link href="/dashboard/invoices?status=overdue">
                                        <Button variant="warning" size="sm">Take Action</Button>
                                    </Link>
                                </div>
                            )}
                            {!summary?.invoices?.overdue && (
                                <div className="flex items-center gap-3 p-4 bg-[#F0FDF4] rounded-lg border border-[#22C55E]/20">
                                    <span className="text-2xl">✅</span>
                                    <div>
                                        <p className="font-semibold text-[#166534]">All caught up!</p>
                                        <p className="text-sm text-[#22C55E]">No overdue invoices. Keep up the great work.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </Card>
                )}

                {/* Financial Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Overdue - Priority */}
                    <Card className="p-6 border-l-4 border-[#F59E0B] hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#92400E] uppercase tracking-wider mb-2">Overdue</p>
                                <p className="text-3xl font-bold text-[#F59E0B]">
                                    £{summary?.financial?.totalOutstanding?.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-[#6B7280] mt-2">
                                    <strong>{summary?.invoices?.overdue || 0}</strong> invoice{summary?.invoices?.overdue !== 1 ? 's' : ''} past due
                                </p>
                                {summary?.invoices?.overdue > 0 && (
                                    <Link href="/dashboard/invoices?status=overdue">
                                        <Button variant="warning" size="sm" className="mt-3">
                                            Send Reminders
                                        </Button>
                                    </Link>
                                )}
                            </div>
                            <div className="text-4xl">⚠️</div>
                        </div>
                    </Card>

                    {/* Collected */}
                    <Card className="p-6 border-l-4 border-[#22C55E] hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#166534] uppercase tracking-wider mb-2">Collected</p>
                                <p className="text-3xl font-bold text-[#22C55E]">
                                    £{summary?.financial?.totalCollected?.toLocaleString() || '0'}
                                </p>
                                <p className="text-xs text-[#6B7280] mt-2">
                                    {summary?.invoices?.paid || 0} paid invoice{summary?.invoices?.paid !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <div className="text-4xl">✅</div>
                        </div>
                    </Card>

                    {/* XP Level */}
                    <Card className="p-6 border-l-4 border-[#0078D4] hover:shadow-lg transition-shadow duration-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold text-[#0078D4] uppercase tracking-wider mb-2">XP Level</p>
                                <p className="text-3xl font-bold text-[#0078D4]">
                                    {summary?.gamification?.level || 1}
                                </p>
                                <p className="text-xs text-[#6B7280] mt-2">
                                    {summary?.gamification?.xp || 0} XP
                                </p>
                                <Link href="/dashboard/gamification">
                                    <Button variant="ghost" size="sm" className="mt-3 text-[#0078D4]">
                                        View Progress
                                    </Button>
                                </Link>
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
                                                <p className="font-semibold text-[#1F2937]">{invoice.reference}</p>
                                                <Badge variant={
                                                    invoice.status === 'paid' ? 'success' :
                                                        invoice.status === 'overdue' ? 'danger' :
                                                            invoice.status === 'sent' ? 'info' : 'neutral'
                                                }>
                                                    {invoice.status === 'paid' ? '✓ Paid' :
                                                     invoice.status === 'overdue' ? '⚠ Overdue' :
                                                     invoice.status === 'sent' ? '📧 Sent' : invoice.status}
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
                                                <p className="font-semibold text-[#1F2937]">{payment.invoiceReference}</p>
                                                <Badge variant="success">✓ Paid</Badge>
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
