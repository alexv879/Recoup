/**
 * Admin Dashboard Home Page
 * Overview of system metrics and health
 */

'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Activity,
  DollarSign,
} from 'lucide-react';

interface DashboardData {
  users: {
    total: number;
    active: number;
    newToday: number;
    paidUsers: number;
  };
  payments: {
    totalValue: number;
    totalPaid: number;
    totalOverdue: number;
    collectionRate: number;
  };
  alerts: {
    active: number;
    critical: number;
  };
  revenue: {
    mrr: number;
    arr: number;
    growth: number;
  };
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch data from multiple endpoints
      const [usersRes, paymentsRes, alertsRes, analyticsRes] = await Promise.all([
        fetch('/api/admin/users?limit=1'),
        fetch('/api/admin/payments?timeframe=30d'),
        fetch('/api/admin/alerts?status=active'),
        fetch('/api/admin/analytics?timeframe=30d'),
      ]);

      if (!usersRes.ok || !paymentsRes.ok || !alertsRes.ok || !analyticsRes.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const usersData = await usersRes.json();
      const paymentsData = await paymentsRes.json();
      const alertsData = await alertsRes.json();
      const analyticsData = await analyticsRes.json();

      setData({
        users: {
          total: usersData.data.stats.total,
          active: usersData.data.stats.active,
          newToday: 0, // Calculate from usersData if needed
          paidUsers: usersData.data.stats.byTier.starter +
            usersData.data.stats.byTier.growth +
            usersData.data.stats.byTier.pro +
            usersData.data.stats.byTier.business,
        },
        payments: {
          totalValue: paymentsData.data.overview.totalValue,
          totalPaid: paymentsData.data.overview.totalPaid,
          totalOverdue: paymentsData.data.overview.totalOverdue,
          collectionRate: paymentsData.data.overview.collectionRate,
        },
        alerts: {
          active: alertsData.data.stats.active,
          critical: alertsData.data.stats.critical,
        },
        revenue: {
          mrr: analyticsData.data.revenueMetrics.mrr,
          arr: analyticsData.data.revenueMetrics.arr,
          growth: 0, // Calculate growth if needed
        },
      });
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const statCards = [
    {
      title: 'Total Users',
      value: data.users.total.toLocaleString(),
      subtitle: `${data.users.active} active`,
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Paid Users',
      value: data.users.paidUsers.toLocaleString(),
      subtitle: `${((data.users.paidUsers / data.users.total) * 100).toFixed(1)}% conversion`,
      icon: TrendingUp,
      color: 'green',
    },
    {
      title: 'Monthly Revenue',
      value: `£${data.revenue.mrr.toLocaleString()}`,
      subtitle: `£${data.revenue.arr.toLocaleString()} ARR`,
      icon: DollarSign,
      color: 'purple',
    },
    {
      title: 'Payment Volume',
      value: `£${Math.round(data.payments.totalValue).toLocaleString()}`,
      subtitle: `${data.payments.collectionRate.toFixed(1)}% collected`,
      icon: CreditCard,
      color: 'indigo',
    },
    {
      title: 'Total Paid',
      value: `£${Math.round(data.payments.totalPaid).toLocaleString()}`,
      subtitle: 'Successful collections',
      icon: Activity,
      color: 'teal',
    },
    {
      title: 'Active Alerts',
      value: data.alerts.active.toLocaleString(),
      subtitle: `${data.alerts.critical} critical`,
      icon: AlertTriangle,
      color: data.alerts.critical > 0 ? 'red' : 'yellow',
    },
  ];

  const colorClasses: Record<string, { bg: string; text: string; iconBg: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100' },
    green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', iconBg: 'bg-indigo-100' },
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', iconBg: 'bg-teal-100' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-600', iconBg: 'bg-yellow-100' },
    red: { bg: 'bg-red-50', text: 'text-red-600', iconBg: 'bg-red-100' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Welcome to the Recoup admin control panel</p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Critical Alerts Banner */}
      {data.alerts.critical > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
            <div>
              <h3 className="text-red-800 font-semibold">Critical Alerts Require Attention</h3>
              <p className="text-red-700 text-sm">
                You have {data.alerts.critical} critical alert{data.alerts.critical !== 1 ? 's' : ''} that need immediate attention.
              </p>
            </div>
            <a
              href="/admin/alerts?severity=critical"
              className="ml-auto px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              View Alerts
            </a>
          </div>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          const colors = colorClasses[card.color];

          return (
            <div
              key={card.title}
              className={`${colors.bg} rounded-lg p-6 border border-gray-200`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className={`text-3xl font-bold ${colors.text} mt-2`}>{card.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{card.subtitle}</p>
                </div>
                <div className={`${colors.iconBg} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${colors.text}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/admin/users"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-5 w-5 text-blue-600 mr-3" />
            <span className="font-medium text-gray-700">Manage Users</span>
          </a>
          <a
            href="/admin/payments"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="h-5 w-5 text-green-600 mr-3" />
            <span className="font-medium text-gray-700">Track Payments</span>
          </a>
          <a
            href="/admin/support"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Activity className="h-5 w-5 text-purple-600 mr-3" />
            <span className="font-medium text-gray-700">Support Tools</span>
          </a>
          <a
            href="/admin/audit-logs"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <AlertTriangle className="h-5 w-5 text-yellow-600 mr-3" />
            <span className="font-medium text-gray-700">View Audit Logs</span>
          </a>
        </div>
      </div>
    </div>
  );
}
