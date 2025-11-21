/**
 * Expenses List Page
 * View and manage all expenses with filters
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ExpensesList } from '@/components/Expenses/ExpensesList';

export default async function ExpensesPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Expenses</h1>
          <p className="text-gray-600">
            Track expenses and identify what you can recharge to clients
          </p>
        </div>
        <Link
          href="/dashboard/expenses/new"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
        >
          + New Expense
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="This Month"
          value="Loading..."
          icon="📊"
          color="blue"
        />
        <StatCard
          label="Billable (Unbilled)"
          value="Loading..."
          icon="💰"
          color="amber"
        />
        <StatCard
          label="Tax Deductible"
          value="Loading..."
          icon="🇬🇧"
          color="green"
        />
        <StatCard
          label="Total Expenses"
          value="Loading..."
          icon="📈"
          color="purple"
        />
      </div>

      {/* Expenses List Component */}
      <ExpensesList />
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple: 'bg-purple-50 border-purple-200 text-purple-700',
  }[color];

  return (
    <div className={`border rounded-lg p-4 ${colorClasses}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
