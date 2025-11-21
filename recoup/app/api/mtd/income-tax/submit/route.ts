/**
 * MTD Income Tax Quarterly Update Submission
 * POST /api/mtd/income-tax/submit
 *
 * Submits quarterly update to HMRC via MTD ITSA API
 * ✅ MTD-COMPLIANT: Digital linking, quarterly submissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { submitIncomeTaxUpdate } from '@/lib/hmrc-client';
import { calculateIncomeTaxUpdate, getTaxYear, getQuarter, getQuarterDates } from '@/lib/mtd-calculations';
import { IncomeTaxQuarterlyUpdate, Invoice, Expense, MTDRegistration } from '@/types/models';
import { handleError, UnauthorizedError, ValidationError, NotFoundError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to submit income tax updates.');
    }

    logInfo('Income Tax quarterly update initiated', { userId });

    // 2. Parse request body
    const body = await req.json();
    const { taxYear, quarter } = body;

    if (!taxYear || !quarter) {
      throw new ValidationError('Missing required fields: taxYear, quarter');
    }

    if (![1, 2, 3, 4].includes(quarter)) {
      throw new ValidationError('Quarter must be 1, 2, 3, or 4');
    }

    // 3. Get MTD registration
    const mtdDoc = await db.collection('mtd_registrations').doc(userId).get();

    if (!mtdDoc.exists) {
      throw new NotFoundError('MTD registration not found. Please connect your HMRC account first.');
    }

    const registration = mtdDoc.data() as MTDRegistration;

    if (!registration.incomeTaxMTDEnabled) {
      throw new ValidationError('MTD for Income Tax not enabled. Please complete setup first.');
    }

    // 4. Get quarter dates
    const { start, end } = getQuarterDates(taxYear, quarter);

    // 5. Get invoices and expenses for the quarter
    const invoicesSnapshot = await db
      .collection('invoices')
      .where('freelancerId', '==', userId)
      .where('invoiceDate', '>=', Timestamp.fromDate(start))
      .where('invoiceDate', '<=', Timestamp.fromDate(end))
      .get();

    const expensesSnapshot = await db
      .collection('expenses')
      .where('userId', '==', userId)
      .where('expenseDate', '>=', Timestamp.fromDate(start))
      .where('expenseDate', '<=', Timestamp.fromDate(end))
      .where('submittedToHMRC', '==', false) // Only include unclaimed expenses
      .get();

    const invoices = invoicesSnapshot.docs.map((doc) => ({
      invoiceId: doc.id,
      ...doc.data(),
    })) as Invoice[];

    const expenses = expensesSnapshot.docs.map((doc) => ({
      expenseId: doc.id,
      ...doc.data(),
    })) as Expense[];

    // 6. Calculate income tax update
    const calculation = calculateIncomeTaxUpdate(taxYear, quarter, start, end, invoices, expenses);

    // 7. Create income tax update record
    const updateId = nanoid();
    const update: IncomeTaxQuarterlyUpdate = {
      updateId,
      userId,
      mtdRegistrationId: registration.registrationId,
      ...calculation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to Firestore
    await db.collection('income_tax_updates').doc(updateId).set(update);

    // 8. Submit to HMRC
    await submitIncomeTaxUpdate(userId, update);

    // 9. Create digital links
    const digitalLinks = [];

    // Link expenses
    for (const expense of expenses) {
      digitalLinks.push({
        linkId: nanoid(),
        userId,
        sourceType: 'expense',
        sourceId: expense.expenseId,
        destinationType: 'income_submission',
        destinationId: updateId,
        linkType: 'income_claim',
        amount: expense.amount,
        description: `Expense claimed in Q${quarter} ${taxYear}`,
        createdAt: Timestamp.now(),
        createdByMethod: 'automatic',
        verifiedDigital: true,
      });

      // Mark expense as submitted
      await db.collection('expenses').doc(expense.expenseId).update({
        submittedToHMRC: true,
        submittedAt: Timestamp.now(),
        linkedIncomeSubmissionId: updateId,
        claimedInTaxYear: taxYear,
        claimedInQuarter: `${taxYear}-Q${quarter}`,
      });
    }

    // Link invoices
    for (const invoice of invoices) {
      digitalLinks.push({
        linkId: nanoid(),
        userId,
        sourceType: 'invoice',
        sourceId: invoice.invoiceId,
        destinationType: 'income_submission',
        destinationId: updateId,
        linkType: 'income_claim',
        amount: invoice.amount,
        description: `Income reported in Q${quarter} ${taxYear}`,
        createdAt: Timestamp.now(),
        createdByMethod: 'automatic',
        verifiedDigital: true,
      });
    }

    // Save all digital links
    const batch = db.batch();
    digitalLinks.forEach((link) => {
      const ref = db.collection('digital_links').doc(link.linkId);
      batch.set(ref, link);
    });
    await batch.commit();

    logInfo('Income Tax quarterly update submitted', {
      userId,
      updateId,
      taxYear,
      quarter,
      totalIncome: update.totalIncome,
      totalExpenses: update.totalExpenses,
      netProfit: update.netProfit,
    });

    // 10. Return success response
    return NextResponse.json({
      success: true,
      updateId,
      taxYear,
      quarter,
      totalIncome: update.totalIncome,
      totalExpenses: update.totalExpenses,
      netProfit: update.netProfit,
      linkedExpenses: expenses.length,
      linkedInvoices: invoices.length,
      digitalLinksCreated: digitalLinks.length,
    });
  } catch (error) {
    logError('Income Tax update submission failed', error as Error);
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}
