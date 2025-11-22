/**
 * Revenue Recovery Dashboard Component
 * Shows "Total Recouped" and potential recovery
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { RevenueRecoveryMetrics } from '@/types/models';

export function RevenueRecoveryDashboard() {
  const [metrics, setMetrics] = useState<RevenueRecoveryMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/revenue-recovery/metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-12 text-center">
        <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Calculating your revenue recovery...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Failed to load metrics. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Metric - Total Recouped */}
      <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-8 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-sm uppercase tracking-wide mb-2 opacity-90">
              Total Money Recovered
            </div>
            <div className="text-6xl font-bold mb-4">
              £{metrics.totalRecouped.toLocaleString('en-GB', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            <div className="flex gap-8 text-sm">
              <div>
                <div className="opacity-80 mb-1">From Client Recharges</div>
                <div className="text-2xl font-semibold">
                  £{metrics.paidExpenses.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
              <div>
                <div className="opacity-80 mb-1">From Tax Deductions</div>
                <div className="text-2xl font-semibold">
                  £{metrics.estimatedTaxSavings.toLocaleString('en-GB', {
                    minimumFractionDigits: 2,
                  })}
                </div>
              </div>
            </div>
          </div>
          <div className="text-6xl">💰</div>
        </div>
      </div>

      {/* Potential Recovery Alert */}
      {metrics.potentialRecovery > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-amber-900 mb-2">
                ⚠️ £{metrics.potentialRecovery.toLocaleString('en-GB', {
                  minimumFractionDigits: 2,
                })} Waiting to Be Recovered
              </h3>
              <p className="text-amber-800 mb-1">
                You have {metrics.unbilledExpenses.toLocaleString('en-GB', {
                  style: 'currency',
                  currency: 'GBP',
                })} in unbilled expenses
              </p>
              <p className="text-sm text-amber-700">
                💡 Tip: Convert these to invoices to start recovering your money
              </p>
            </div>
            <Link
              href="/dashboard/expenses?filter=unbilled"
              className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg font-semibold whitespace-nowrap"
            >
              Convert to Invoices →
            </Link>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          label="This Month"
          value={metrics.thisMonth}
          trend={
            metrics.thisMonth > metrics.lastMonth
              ? { type: 'up', value: calculateGrowth(metrics.lastMonth, metrics.thisMonth) }
              : undefined
          }
          icon="📊"
        />
        <StatCard label="Last Month" value={metrics.lastMonth} icon="📅" />
        <StatCard label="This Year" value={metrics.thisYear} icon="📈" />
      </div>

      {/* Unbilled by Client */}
      {metrics.byClient.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h3 className="text-xl font-bold mb-4">💼 Unbilled Expenses by Client</h3>
          <p className="text-gray-600 text-sm mb-6">
            Here's how much you can still recover from each client
          </p>
          <div className="space-y-3">
            {metrics.byClient.map((client) => (
              <div
                key={client.clientId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div className="flex-1">
                  <div className="font-semibold text-lg">{client.clientName}</div>
                  <div className="flex gap-4 text-sm mt-1">
                    {client.unbilled > 0 && (
                      <span className="text-amber-600 font-medium">
                        £{client.unbilled.toFixed(2)} unbilled
                      </span>
                    )}
                    {client.invoiced > 0 && (
                      <span className="text-blue-600">
                        £{client.invoiced.toFixed(2)} invoiced
                      </span>
                    )}
                    {client.paid > 0 && (
                      <span className="text-green-600">
                        £{client.paid.toFixed(2)} recovered
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    £{(client.unbilled + client.invoiced).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">potential</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-white border rounded-xl p-6">
        <h3 className="text-xl font-bold mb-4">📊 Expenses by Category</h3>
        <div className="space-y-3">
          {Object.entries(metrics.byCategory)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([category, data]) => (
              <div key={category} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded transition">
                <div className="flex-1">
                  <div className="font-medium capitalize mb-1">
                    {getCategoryIcon(category)} {category.replace('_', ' ')}
                  </div>
                  <div className="flex gap-4 text-xs text-gray-600">
                    {data.billable > 0 && (
                      <span className="text-amber-600">
                        £{data.billable.toFixed(2)} billable
                      </span>
                    )}
                    {data.taxDeductible > 0 && (
                      <span className="text-green-600">
                        £{data.taxDeductible.toFixed(2)} tax deductible
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-lg font-bold">
                  £{data.total.toFixed(2)}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Empty State */}
      {metrics.totalRecouped === 0 && metrics.potentialRecovery === 0 && (
        <div className="bg-white border rounded-xl p-12 text-center">
          <div className="text-6xl mb-4">🚀</div>
          <h3 className="text-2xl font-bold mb-2">Start Recovering Your Money</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Add your first billable expense to see how much you can recover from client recharges
          </p>
          <Link
            href="/dashboard/expenses/new"
            className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 text-lg"
          >
            Add Your First Expense
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  trend,
  icon,
}: {
  label: string;
  value: number;
  trend?: { type: 'up' | 'down'; value: number };
  icon: string;
}) {
  return (
    <div className="bg-white border rounded-xl p-6">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{icon}</span>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="text-3xl font-bold mb-1">
        £{value.toLocaleString('en-GB', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}
      </div>
      {trend && (
        <div
          className={`text-sm font-medium ${
            trend.type === 'up' ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {trend.type === 'up' ? '↗' : '↘'} {trend.value.toFixed(0)}% vs last month
        </div>
      )}
    </div>
  );
}

function calculateGrowth(previous: number, current: number): number {
  if (previous === 0) return 100;
  return ((current - previous) / previous) * 100;
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    travel: '🚆',
    office: '🖥️',
    marketing: '📢',
    professional: '👔',
    training: '📚',
    utilities: '💡',
    vehicle: '🚗',
    mileage: '🛣️',
    subsistence: '🍽️',
    client_entertainment: '🍷',
    premises: '🏢',
    financial: '💰',
    other: '📦',
  };
  return icons[category] || '📋';
}
