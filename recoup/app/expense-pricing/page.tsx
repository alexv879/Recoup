/**
 * Expense Pricing Page Route
 * /expense-pricing
 *
 * Shows Free/Pro/MTD-Pro pricing for revenue recovery SaaS
 */

import { ExpensePricingPage } from '@/components/Pricing/ExpensePricingPage';

export const metadata = {
  title: 'Pricing - Revenue Recovery for UK Freelancers | Recoup',
  description: 'Track expenses, recover revenue from client recharges, and maximize tax deductions. Free forever, or upgrade to Pro for unlimited.',
};

export default function ExpensePricingRoute() {
  return <ExpensePricingPage />;
}
