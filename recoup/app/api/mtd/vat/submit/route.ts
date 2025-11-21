/**
 * MTD VAT Return Submission
 * POST /api/mtd/vat/submit
 *
 * Submits VAT return to HMRC via MTD API
 * ✅ MTD-COMPLIANT: Digital linking, audit trail, HMRC submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { submitVATReturn, getVATObligations } from '@/lib/hmrc-client';
import { calculateVATReturn } from '@/lib/mtd-calculations';
import { VATReturn, Invoice, Expense, MTDRegistration } from '@/types/models';
import { handleError, UnauthorizedError, ValidationError, NotFoundError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';
import { nanoid } from 'nanoid';

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to submit VAT returns.');
    }

    logInfo('VAT return submission initiated', { userId });

    // 2. Parse request body
    const body = await req.json();
    const { periodStart, periodEnd, periodKey } = body;

    if (!periodStart || !periodEnd || !periodKey) {
      throw new ValidationError('Missing required fields: periodStart, periodEnd, periodKey');
    }

    // 3. Get MTD registration
    const mtdDoc = await db.collection('mtd_registrations').doc(userId).get();

    if (!mtdDoc.exists) {
      throw new NotFoundError('MTD registration not found. Please connect your HMRC account first.');
    }

    const registration = mtdDoc.data() as MTDRegistration;

    if (!registration.vatRegistered || !registration.vatNumber) {
      throw new ValidationError('VAT registration required. Please complete VAT setup first.');
    }

    // 4. Verify VAT obligation exists for this period
    const obligations = await getVATObligations(
      userId,
      registration.vatNumber,
      new Date(periodStart),
      new Date(periodEnd)
    );

    const obligation = obligations.find((ob) => ob.periodKey === periodKey);

    if (!obligation) {
      throw new ValidationError(`No VAT obligation found for period ${periodKey}`);
    }

    if (obligation.status === 'F') {
      throw new ValidationError(`VAT return for period ${periodKey} has already been submitted.`);
    }

    // 5. Get invoices and expenses for the period
    const start = new Date(periodStart);
    const end = new Date(periodEnd);

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
      .get();

    const invoices = invoicesSnapshot.docs.map((doc) => ({
      invoiceId: doc.id,
      ...doc.data(),
    })) as Invoice[];

    const expenses = expensesSnapshot.docs.map((doc) => ({
      expenseId: doc.id,
      ...doc.data(),
    })) as Expense[];

    // 6. Calculate VAT return
    const calculation = calculateVATReturn(start, end, invoices, expenses);

    // 7. Create VAT return record
    const vatReturnId = nanoid();
    const vatReturn: VATReturn = {
      vatReturnId,
      userId,
      mtdRegistrationId: registration.registrationId,
      periodKey,
      ...calculation,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    // Save to Firestore
    await db.collection('vat_returns').doc(vatReturnId).set(vatReturn);

    // 8. Submit to HMRC
    const hmrcResult = await submitVATReturn(userId, vatReturn);

    // 9. Create digital links
    const digitalLinks = [];

    // Link expenses
    for (const expense of expenses) {
      digitalLinks.push({
        linkId: nanoid(),
        userId,
        sourceType: 'expense',
        sourceId: expense.expenseId,
        destinationType: 'vat_return',
        destinationId: vatReturnId,
        linkType: 'vat_claim',
        amount: expense.vatAmount || 0,
        description: `VAT reclaimed on ${expense.description}`,
        createdAt: Timestamp.now(),
        createdByMethod: 'automatic',
        verifiedDigital: true,
      });

      // Mark expense as submitted to HMRC
      await db.collection('expenses').doc(expense.expenseId).update({
        submittedToHMRC: true,
        submittedAt: Timestamp.now(),
        linkedVATReturnId: vatReturnId,
      });
    }

    // Link invoices
    for (const invoice of invoices) {
      digitalLinks.push({
        linkId: nanoid(),
        userId,
        sourceType: 'invoice',
        sourceId: invoice.invoiceId,
        destinationType: 'vat_return',
        destinationId: vatReturnId,
        linkType: 'vat_claim',
        amount: Math.round(invoice.amount * 0.20 / 1.20), // Extracted VAT
        description: `VAT due on invoice ${invoice.reference}`,
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

    logInfo('VAT return submitted successfully', {
      userId,
      vatReturnId,
      periodKey,
      netVATDue: vatReturn.netVATDue,
      hmrcProcessingDate: hmrcResult.processingDate,
      linkedExpenses: expenses.length,
      linkedInvoices: invoices.length,
    });

    // 10. Return success response
    return NextResponse.json({
      success: true,
      vatReturnId,
      periodKey,
      netVATDue: vatReturn.netVATDue,
      paymentDue: vatReturn.paymentDue,
      hmrcReceiptId: hmrcResult.formBundleNumber,
      processingDate: hmrcResult.processingDate,
      linkedExpenses: expenses.length,
      linkedInvoices: invoices.length,
      digitalLinksCreated: digitalLinks.length,
    });
  } catch (error) {
    logError('VAT return submission failed', error as Error);
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}
