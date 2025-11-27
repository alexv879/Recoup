/**
 * Upgrade Page
 * /dashboard/upgrade
 *
 * Handles subscription upgrades via Clerk
 * Query params: ?plan=pro or ?plan=mtd-pro
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UpgradeFlow } from '@/components/Billing/UpgradeFlow';

export const metadata = {
  title: 'Upgrade Your Plan | Recoup',
  description: 'Upgrade to Pro or MTD-Pro to unlock unlimited expenses and revenue recovery features',
};

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: { plan?: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  const plan = searchParams.plan || 'pro';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <UpgradeFlow selectedPlan={plan} />
      </div>
    </div>
  );
}
