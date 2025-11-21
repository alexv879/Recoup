/**
 * Expense Form Component
 * Create and edit expenses with receipt upload and OCR
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { ExpenseCategory } from '@/types/models';

const expenseSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  currency: z.enum(['GBP', 'USD', 'EUR']),
  date: z.string(),
  merchant: z.string().min(1, 'Merchant is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.string(),
  billable: z.boolean(),
  clientId: z.string().optional(),
  clientName: z.string().optional(),
  taxDeductible: z.boolean(),
  capitalAllowance: z.boolean().optional(),
  simplifiedExpense: z.boolean().optional(),
});

type ExpenseFormData = z.infer<typeof expenseSchema>;

interface ExpenseFormProps {
  initialData?: Partial<ExpenseFormData>;
  expenseId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ExpenseForm({
  initialData,
  expenseId,
  onSuccess,
  onCancel,
}: ExpenseFormProps) {
  const router = useRouter();
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      currency: 'GBP',
      date: new Date().toISOString().split('T')[0],
      billable: false,
      taxDeductible: true,
      capitalAllowance: false,
      simplifiedExpense: false,
      ...initialData,
    },
  });

  const billable = watch('billable');
  const category = watch('category');

  // Handle receipt file selection
  const handleReceiptChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptFile(file);

    // Generate preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setReceiptPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: ExpenseFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Convert amount to pence
      formData.append('amount', String(Math.round(data.amount * 100)));
      formData.append('currency', data.currency);
      formData.append('date', data.date);
      formData.append('merchant', data.merchant);
      formData.append('description', data.description);
      formData.append('category', data.category);
      formData.append('billable', String(data.billable));
      formData.append('taxDeductible', String(data.taxDeductible));

      if (data.capitalAllowance) {
        formData.append('capitalAllowance', 'true');
      }
      if (data.simplifiedExpense) {
        formData.append('simplifiedExpense', 'true');
      }

      if (data.clientId) {
        formData.append('clientId', data.clientId);
      }
      if (data.clientName) {
        formData.append('clientName', data.clientName);
      }

      if (receiptFile) {
        formData.append('receipt', receiptFile);
        setOcrProcessing(true);
      }

      const url = expenseId ? `/api/expenses/${expenseId}` : '/api/expenses';
      const method = expenseId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        body: expenseId ? JSON.stringify(data) : formData,
        ...(expenseId && { headers: { 'Content-Type': 'application/json' } }),
      });

      if (!response.ok) {
        throw new Error('Failed to save expense');
      }

      const result = await response.json();

      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/expenses');
      }
    } catch (error) {
      console.error('Failed to save expense:', error);
      alert('Failed to save expense. Please try again.');
    } finally {
      setIsSubmitting(false);
      setOcrProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Receipt Upload */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📸 Receipt (Optional)</h3>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="receipt"
              className="block w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition"
            >
              {receiptPreview ? (
                <img
                  src={receiptPreview}
                  alt="Receipt preview"
                  className="max-w-xs mx-auto rounded"
                />
              ) : (
                <div>
                  <div className="text-4xl mb-2">📄</div>
                  <p className="text-gray-600">Click to upload receipt</p>
                  <p className="text-sm text-gray-500 mt-1">
                    JPG, PNG, or PDF (max 10MB)
                  </p>
                </div>
              )}
              <input
                type="file"
                id="receipt"
                accept="image/*,application/pdf"
                onChange={handleReceiptChange}
                className="hidden"
              />
            </label>
            {receiptFile && (
              <p className="text-sm text-gray-600 mt-2">
                {receiptFile.name} ({(receiptFile.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          {ocrProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="text-sm text-blue-800">
                🤖 AI is processing your receipt... This may take a few seconds.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

        {/* Amount & Currency */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-2">
              Amount * <span className="text-gray-500">(in pounds)</span>
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
              placeholder="23.45"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select
              {...register('currency')}
              className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="GBP">£ GBP</option>
              <option value="USD">$ USD</option>
              <option value="EUR">€ EUR</option>
            </select>
          </div>
        </div>

        {/* Merchant */}
        <div>
          <label className="block text-sm font-medium mb-2">Merchant/Vendor *</label>
          <input
            type="text"
            {...register('merchant')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Amazon, Tesco, Trainline"
          />
          {errors.merchant && (
            <p className="text-red-500 text-sm mt-1">{errors.merchant.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">Description *</label>
          <textarea
            {...register('description')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
            placeholder="What was this expense for?"
            rows={3}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Date */}
        <div>
          <label className="block text-sm font-medium mb-2">Date *</label>
          <input
            type="date"
            {...register('date')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">UK Tax Category</h3>
        <div>
          <label className="block text-sm font-medium mb-2">Category *</label>
          <select
            {...register('category')}
            className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a category...</option>
            <option value="travel">🚆 Travel (trains, taxis, hotels)</option>
            <option value="office">🖥️ Office Supplies (software, equipment)</option>
            <option value="marketing">📢 Marketing (ads, website)</option>
            <option value="professional">👔 Professional Services (accountant, legal)</option>
            <option value="training">📚 Training (courses, books)</option>
            <option value="utilities">💡 Utilities (phone, internet)</option>
            <option value="vehicle">🚗 Vehicle (fuel, repairs)</option>
            <option value="mileage">🛣️ Mileage (45p/25p per mile)</option>
            <option value="subsistence">🍽️ Meals & Subsistence</option>
            <option value="client_entertainment">🍷 Client Entertainment</option>
            <option value="premises">🏢 Premises (rent, business use of home)</option>
            <option value="financial">💰 Financial (bank charges, interest)</option>
            <option value="other">📦 Other Business Expense</option>
          </select>
        </div>
      </div>

      {/* Client Recharging */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">💰 Revenue Recovery</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('billable')}
              id="billable"
              className="w-5 h-5 mt-0.5"
            />
            <div>
              <label htmlFor="billable" className="font-medium cursor-pointer">
                This expense is billable to a client
              </label>
              <p className="text-sm text-gray-600">
                Mark this if you can recharge this expense to a client
              </p>
            </div>
          </div>

          {billable && (
            <div className="bg-white rounded p-4 space-y-3">
              <p className="text-sm font-medium text-amber-800">
                Which client will you bill this to?
              </p>
              {/* TODO: Replace with dynamic client selector */}
              <input
                type="text"
                {...register('clientName')}
                placeholder="Enter client name"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-xs text-gray-500">
                💡 Tip: You'll be able to convert this to an invoice with one click
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Tax Deductions */}
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <h3 className="text-lg font-semibold mb-4">🇬🇧 Tax Deductions</h3>
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            {...register('taxDeductible')}
            id="taxDeductible"
            className="w-5 h-5 mt-0.5"
          />
          <div>
            <label htmlFor="taxDeductible" className="font-medium cursor-pointer">
              This expense is tax deductible
            </label>
            <p className="text-sm text-gray-600">
              Most business expenses are tax deductible (20-45% savings)
            </p>
          </div>
        </div>

        {category === 'office' && (
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              {...register('capitalAllowance')}
              id="capitalAllowance"
              className="w-5 h-5 mt-0.5"
            />
            <div>
              <label htmlFor="capitalAllowance" className="font-medium cursor-pointer">
                Claim capital allowance
              </label>
              <p className="text-sm text-gray-600">
                For equipment/assets over £1,000 (Annual Investment Allowance)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting
            ? 'Saving...'
            : expenseId
            ? 'Update Expense'
            : 'Create Expense'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 border rounded-lg font-semibold hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>

      {ocrProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            ℹ️ Your receipt is being processed. Expense fields will auto-populate when ready.
          </p>
        </div>
      )}
    </form>
  );
}
