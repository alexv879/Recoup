/**
 * Invoice Service
 * Stub implementation - TODO: Implement full invoice service logic
 */

import { db, COLLECTIONS } from '@/lib/firebase';
import type { Invoice } from '@/types/models';

export interface ListInvoicesParams {
  userId: string;
  status?: string;
  limit?: number;
}

export interface ListInvoicesResult {
  invoices: Invoice[];
  total: number;
}

/**
 * List invoices for a user
 */
export async function listInvoices(params: ListInvoicesParams): Promise<ListInvoicesResult> {
  try {
    let query = db
      .collection(COLLECTIONS.INVOICES)
      .where('freelancerId', '==', params.userId);

    if (params.status) {
      query = query.where('status', '==', params.status);
    }

    if (params.limit) {
      query = query.limit(params.limit);
    }

    const snapshot = await query.get();
    const invoices = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as unknown as Invoice[];

    return {
      invoices,
      total: invoices.length,
    };
  } catch (error) {
    console.error('Error listing invoices:', error);
    return {
      invoices: [],
      total: 0,
    };
  }
}
