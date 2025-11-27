/**
 * Revenue Recovery Dashboard
 * THE MOAT - Shows freelancers exactly how much money they're recovering
 * Position: "Find the money you're leaving on the table"
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { RevenueRecoveryDashboard } from '@/components/RevenueRecovery/RevenueRecoveryDashboard';

export const metadata = {
  title: 'Revenue Recovery | Recoup',
  description: "Track the money you're recovering from client recharges and tax deductions",
};

export default async function RevenueRecoveryPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-3">💰 Revenue Recovery</h1>
        <p className="text-xl text-gray-600 mb-2">
          Track the money you're recovering from client recharges and tax deductions
        </p>
        <p className="text-gray-500">
          This dashboard shows exactly how much you've recouped—and what you're still leaving on the table.
        </p>
      </div>

      {/* Dashboard Component */}
      <RevenueRecoveryDashboard />
    </div>
  );
}
