/**
 * New Expense Page
 */

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ExpenseForm } from '@/components/Expenses/ExpenseForm';

export default async function NewExpensePage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">📝 New Expense</h1>
        <p className="text-gray-600">
          Track your business expense and identify if you can recharge it to a client
        </p>
      </div>

      <ExpenseForm />
    </div>
  );
}
