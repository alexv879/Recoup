/**
 * Expenses List Component
 * Displays expenses with filtering and actions
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Expense } from '@/types/models';

export function ExpensesList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'billable' | 'unbilled' | 'tax-deductible'>('all');
  const [selectedExpenses, setSelectedExpenses] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExpenses();
  }, [filter]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter === 'billable') params.append('billable', 'true');
      if (filter === 'unbilled') {
        params.append('billable', 'true');
        params.append('status', 'unbilled');
      }

      const response = await fetch(`/api/expenses?${params.toString()}`);
      const data = await response.json();
      setExpenses(data.expenses || []);
    } catch (error) {
      console.error('Failed to fetch expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectExpense = (expenseId: string) => {
    const newSelected = new Set(selectedExpenses);
    if (newSelected.has(expenseId)) {
      newSelected.delete(expenseId);
    } else {
      newSelected.add(expenseId);
    }
    setSelectedExpenses(newSelected);
  };

  const handleConvertToInvoice = async () => {
    if (selectedExpenses.size === 0) {
      alert('Please select at least one expense');
      return;
    }

    // TODO: Show client selection modal
    alert('Conversion UI coming soon! This will create an invoice from selected expenses.');
  };

  if (loading) {
    return (
      <div className="bg-white border rounded-lg p-12 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-600">Loading expenses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium">Filter:</label>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${
              filter === 'all'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('billable')}
            className={`px-4 py-2 rounded ${
              filter === 'billable'
                ? 'bg-amber-100 text-amber-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            💰 Billable
          </button>
          <button
            onClick={() => setFilter('unbilled')}
            className={`px-4 py-2 rounded ${
              filter === 'unbilled'
                ? 'bg-red-100 text-red-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ⚠️ Unbilled
          </button>
          <button
            onClick={() => setFilter('tax-deductible')}
            className={`px-4 py-2 rounded ${
              filter === 'tax-deductible'
                ? 'bg-green-100 text-green-700 font-semibold'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🇬🇧 Tax Deductible
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedExpenses.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              {selectedExpenses.size} expense(s) selected
            </span>
            <div className="flex gap-3">
              <button
                onClick={() => setSelectedExpenses(new Set())}
                className="text-gray-600 hover:text-gray-900"
              >
                Clear
              </button>
              <button
                onClick={handleConvertToInvoice}
                className="bg-green-600 text-white px-6 py-2 rounded font-semibold hover:bg-green-700"
              >
                💰 Convert to Invoice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expenses Table */}
      {expenses.length === 0 ? (
        <div className="bg-white border rounded-lg p-12 text-center">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">No expenses yet</h3>
          <p className="text-gray-600 mb-6">
            Start tracking your business expenses to see what you can recover
          </p>
          <Link
            href="/dashboard/expenses/new"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
          >
            Create Your First Expense
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-4 text-left">
                  <input type="checkbox" className="w-4 h-4" />
                </th>
                <th className="p-4 text-left font-semibold">Date</th>
                <th className="p-4 text-left font-semibold">Merchant</th>
                <th className="p-4 text-left font-semibold">Category</th>
                <th className="p-4 text-left font-semibold">Description</th>
                <th className="p-4 text-right font-semibold">Amount</th>
                <th className="p-4 text-center font-semibold">Status</th>
                <th className="p-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense: any) => (
                <tr key={expense.expenseId} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <input
                      type="checkbox"
                      className="w-4 h-4"
                      checked={selectedExpenses.has(expense.expenseId)}
                      onChange={() => handleSelectExpense(expense.expenseId)}
                    />
                  </td>
                  <td className="p-4">
                    {new Date(expense.date).toLocaleDateString('en-GB')}
                  </td>
                  <td className="p-4 font-medium">{expense.merchant}</td>
                  <td className="p-4">
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {expense.category}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {expense.description.slice(0, 50)}...
                  </td>
                  <td className="p-4 text-right font-semibold">
                    {expense.currency === 'GBP' ? '£' : '$'}
                    {(expense.amount / 100).toFixed(2)}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex gap-2 justify-center">
                      {expense.billable && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">
                          💰 Billable
                        </span>
                      )}
                      {expense.taxDeductible && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                          🇬🇧 Tax
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/expenses/${expense.expenseId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
