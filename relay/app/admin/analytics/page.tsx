/**
 * Admin Analytics Dashboard
 * Business analytics: revenue, user growth, collection rates
 */

'use client';

import { useEffect, useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Target,
  Activity,
} from 'lucide-react';
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
  ResponsiveContainer,
} from 'recharts';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/analytics?timeframe=${timeframe}`);
      const result = await response.json();

      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
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

  if (!data) return null;

  // Prepare chart data
  const userGrowthData = Object.entries(data.userMetrics.userGrowthByDay || {})
    .map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      users: count,
    }))
    .slice(-14);

  const revenueData = Object.entries(data.revenueMetrics.revenueByDay || {})
    .map(([date, amount]) => ({
      date: new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric' }),
      revenue: amount,
    }))
    .slice(-14);

  const tierData = Object.entries(data.subscriptionMetrics.tierDistribution || {}).map(
    ([tier, count]) => ({
      name: tier.charAt(0).toUpperCase() + tier.slice(1),
      value: count as number,
    })
  );

  const COLORS = ['#94a3b8', '#3b82f6', '#10b981', '#8b5cf6', '#6366f1'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Business Analytics</h1>
          <p className="text-gray-600 mt-1">Revenue, user growth, and collection performance</p>
        </div>
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Users className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm opacity-90">Total Users</p>
          <p className="text-3xl font-bold">{data.userMetrics.totalUsers.toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-1">
            {data.userMetrics.newUsers} new this period
          </p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm opacity-90">Monthly Recurring Revenue</p>
          <p className="text-3xl font-bold">£{data.revenueMetrics.mrr.toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-1">
            £{data.revenueMetrics.arr.toLocaleString()} ARR
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Target className="h-8 w-8 opacity-80" />
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm opacity-90">Collection Rate</p>
          <p className="text-3xl font-bold">
            {data.collectionMetrics.collectionRate.toFixed(1)}%
          </p>
          <p className="text-xs opacity-80 mt-1">
            {data.collectionMetrics.paidInvoices} / {data.collectionMetrics.totalInvoices} paid
          </p>
        </div>

        <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <Activity className="h-8 w-8 opacity-80" />
            <div className="text-xs opacity-80">Conversion</div>
          </div>
          <p className="text-sm opacity-90">Paid Users</p>
          <p className="text-3xl font-bold">{data.userMetrics.paidUsers.toLocaleString()}</p>
          <p className="text-xs opacity-80 mt-1">
            {data.subscriptionMetrics.conversionRate.toFixed(1)}% conversion rate
          </p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">User Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userGrowthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="users" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => `£${value}`} />
              <Legend />
              <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Tier Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={tierData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {tierData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Collection Performance</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">
                  {data.collectionMetrics.collectionSuccessRate.toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Overdue Rate</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {data.collectionMetrics.overdueRate.toFixed(1)}%
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-yellow-500" />
            </div>

            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600">Total Attempts</p>
                <p className="text-2xl font-bold text-blue-600">
                  {data.collectionMetrics.collectionAttempts}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Active Users</span>
              <span className="font-medium">{data.userMetrics.activeUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid Users</span>
              <span className="font-medium">{data.userMetrics.paidUsers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Churn Rate</span>
              <span className="font-medium">{data.userMetrics.churnRate.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-medium">£{Math.round(data.revenueMetrics.totalRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MRR</span>
              <span className="font-medium">£{data.revenueMetrics.mrr.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ARR</span>
              <span className="font-medium">£{data.revenueMetrics.arr.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Collection Metrics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Invoices</span>
              <span className="font-medium">{data.collectionMetrics.totalInvoices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Paid</span>
              <span className="font-medium text-green-600">{data.collectionMetrics.paidInvoices}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">In Collections</span>
              <span className="font-medium text-yellow-600">{data.collectionMetrics.collectionsInvoices}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
