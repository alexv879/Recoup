/**
 * PREMIUM FEATURE: Agency Hand-off Service
 *
 * Manages escalation of difficult collections to third-party agencies.
 * When internal collection attempts fail, freelancers can escalate to
 * professional collection agencies with established agreements.
 *
 * Flow:
 * 1. Freelancer decides to escalate after X failed attempts
 * 2. System packages all evidence (invoices, communications, proofs)
 * 3. Creates handoff record with agency
 * 4. Agency receives case and begins their process
 * 5. System tracks agency progress and outcomes
 * 6. If recovered, commission is calculated and paid
 *
 * UK Collection Agency Regulations:
 * - Agencies must be licensed by FCA (Financial Conduct Authority)
 * - Must comply with Consumer Credit Act
 * - Must follow FCA debt collection rules
 * - Cannot harass or threaten debtors
 * - Must verify debt before collection
 * - Typical commission: 10-40% depending on age and amount
 * 
 * STANDARD AGENCY PROCESS (UK):
 * 1. Initial Demand Letter (14-day notice):
 *    - Formal Letter Before Action sent by agency
 *    - Must comply with FCA CONC 7 (Arrears and Default rules)
 *    - States debt amount, interest accrued, agency commission
 *    - References original creditor and debt transfer date
 *    - Gives debtor 14 days to pay in full or dispute
 *    - Must include debtor rights (payment plans, dispute process)
 * 2. Intensive Collection Period (60-90 days):
 *    - Multi-channel contact: phone (max 3 calls/day), email, SMS, postal
 *    - Office hours only: 8am-9pm Mon-Sat, no Sundays (FCA requirement)
 *    - Payment arrangement negotiations (income/expenditure assessment)
 *    - Settlement offers (often 70-90% to close quickly)
 *    - Debtor vulnerability checks (mental health, financial hardship)
 * 3. Escalation Decision (if unsuccessful after 90 days):
 *    - Recommend County Court claim to original creditor
 *    - Recommend write-off if debtor insolvent/untraceable
 *    - Continue collection if partial payments being made
 * 4. Commission Payment:
 *    - Typically 15-25% of recovered amount (some charge 10-40%)
 *    - Deducted from collected funds (not upfront payment)
 *    - Higher percentage for older/disputed debts
 *    - Some agencies charge upfront admin fee (£50-£150)
 * 
 * ADDITIONAL UK AGENCIES (Integration pending):
 * 
 * Moorcroft Debt Recovery:
 * - Website: https://www.moorcroft.co.uk
 * - Phone: 0845 300 2000
 * - Email: commercial@moorcroft.co.uk
 * - Specializes: Professional services, trade debt
 * - Minimum: £500 | Commission: 15-20%
 * 
 * ARC Europe:
 * - Website: https://www.arceurope.com
 * - Phone: 01932 251 000
 * - Email: info@arceurope.com
 * - Specializes: Multi-sector commercial collections
 * - Minimum: £1,000 | Commission: 20-25%
 * 
 * Intrum (large claims specialist):
 * - Website: https://www.intrum.co.uk
 * - Phone: 0203 633 5500
 * - Email: uk@intrum.com
 * - Specializes: Large commercial claims (>£10k)
 * - Minimum: £5,000 | Commission: 15-22% (negotiable)
 * 
 * REGULATORY RESOURCES:
 * - FCA CONC Rules: https://www.fca.org.uk/firms/consumer-credit
 * - Credit Services Association: https://www.csa-uk.com
 * - Debt Collection Guidance: See docs/late-payment-legal-resources.md
 */

import { db, FieldValue, Timestamp } from '@/lib/firebase';
import { AgencyHandoff, Invoice, CollectionAttempt } from '@/types/models';
import { logError, logInfo } from '@/utils/logger';
import { sendNotificationEmail } from '@/lib/sendgrid';
import { nanoid } from 'nanoid';
import { uploadCommunicationHistory } from '@/lib/firebase-storage';
import { createAgencyRecoveryTransaction } from './transactionService';

/**
 * Helper function to convert Date | Timestamp to milliseconds
 */
function toMillis(date: Date | Timestamp | any): number {
  if (date instanceof Date) {
    return date.getTime();
  }
  // It's a Timestamp
  return (date as any).toMillis ? (date as any).toMillis() : (date as any).seconds * 1000;
}

/**
 * Helper function to convert Date | Timestamp to Date
 */
function toDate(date: Date | Timestamp | any): Date {
  if (date instanceof Date) {
    return date;
  }
  // It's a Timestamp
  return (date as any).toDate ? (date as any).toDate() : new Date((date as any).seconds * 1000);
}

/**
 * Registered collection agencies
 * In production, maintain database of vetted agencies
 */
const REGISTERED_AGENCIES = [
  {
    agencyId: 'agency_lowell_uk',
    agencyName: 'Lowell Financial Ltd',
    agencyContactEmail: 'handoffs@lowellfinancial.co.uk',
    agencyContactPhone: '+44 113 281 8820',
    commissionPercentage: 25, // 25%
    minimumDebtAmount: 100, // £100 minimum
    specialties: ['consumer', 'small_business'],
  },
  {
    agencyId: 'agency_cabot_uk',
    agencyName: 'Cabot Credit Management',
    agencyContactEmail: 'newcases@cabotcm.co.uk',
    agencyContactPhone: '+44 113 234 5678',
    commissionPercentage: 30, // 30%
    minimumDebtAmount: 250,
    specialties: ['consumer', 'high_value'],
  },
  {
    agencyId: 'agency_intrum_uk',
    agencyName: 'Intrum UK',
    agencyContactEmail: 'uk.handoffs@intrum.com',
    agencyContactPhone: '+44 161 923 4000',
    commissionPercentage: 20, // 20% (lower but high volume)
    minimumDebtAmount: 50,
    specialties: ['consumer', 'small_business', 'international'],
  },
];

/**
 * Check if invoice is eligible for agency escalation
 */
export async function checkEscalationEligibility(invoiceId: string): Promise<{
  eligible: boolean;
  reason?: string;
  recommendedAgency?: string;
}> {
  try {
    // 1. Get invoice
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();
    if (!invoiceDoc.exists) {
      return { eligible: false, reason: 'Invoice not found' };
    }

    const invoice = invoiceDoc.data() as Invoice;

    // 2. Check status
    if (invoice.status === 'paid') {
      return { eligible: false, reason: 'Invoice already paid' };
    }

    if (invoice.status === 'in_collections') {
      // Check if already escalated
      const existingHandoff = await db
        .collection('agency_handoffs')
        .where('invoiceId', '==', invoiceId)
        .where('handoffStatus', 'in', ['pending', 'in_progress'])
        .get();

      if (!existingHandoff.empty) {
        return { eligible: false, reason: 'Already escalated to agency' };
      }
    }

    // 3. Check minimum amount
    if (invoice.amount < 50) {
      return { eligible: false, reason: 'Amount too low for agency escalation (minimum £50)' };
    }

    // 4. Check collection attempts
    const attempts = await db
      .collection('collection_attempts')
      .where('invoiceId', '==', invoiceId)
      .orderBy('createdAt', 'desc')
      .get();

    if (attempts.size < 3) {
      return { eligible: false, reason: 'Insufficient collection attempts (minimum 3 required)' };
    }

    // 5. Check days past due
    const daysPastDue = Math.floor(
      (Date.now() - toMillis(invoice.dueDate)) / (1000 * 60 * 60 * 24)
    );

    if (daysPastDue < 60) {
      return { eligible: false, reason: 'Not enough time passed (minimum 60 days overdue)' };
    }

    // 6. Recommend agency based on amount
    let recommendedAgency = 'agency_intrum_uk'; // Default

    if (invoice.amount >= 250) {
      recommendedAgency = 'agency_cabot_uk'; // Higher value
    } else if (invoice.amount >= 100) {
      recommendedAgency = 'agency_lowell_uk'; // Medium value
    }

    return {
      eligible: true,
      recommendedAgency,
    };

  } catch (error) {
    logError('Failed to check escalation eligibility', error);
    return { eligible: false, reason: 'System error' };
  }
}

/**
 * Create agency handoff
 */
export async function createAgencyHandoff(params: {
  invoiceId: string;
  freelancerId: string;
  agencyId: string;
  notes?: string;
}): Promise<{
  success: boolean;
  handoffId?: string;
  error?: string;
}> {
  try {
    // 1. Validate eligibility
    const eligibility = await checkEscalationEligibility(params.invoiceId);
    if (!eligibility.eligible) {
      return {
        success: false,
        error: eligibility.reason || 'Not eligible for escalation',
      };
    }

    // 2. Get invoice and collection history
    const invoiceDoc = await db.collection('invoices').doc(params.invoiceId).get();
    const invoice = invoiceDoc.data() as Invoice;

    const attemptsSnapshot = await db
      .collection('collection_attempts')
      .where('invoiceId', '==', params.invoiceId)
      .orderBy('createdAt', 'desc')
      .get();

    const attempts = attemptsSnapshot.docs.map(doc => doc.data() as CollectionAttempt);

    // 3. Get agency details
    const agency = REGISTERED_AGENCIES.find(a => a.agencyId === params.agencyId);
    if (!agency) {
      return { success: false, error: 'Agency not found' };
    }

    // 4. Check minimum amount
    if (invoice.amount < agency.minimumDebtAmount) {
      return {
        success: false,
        error: `Amount below agency minimum (£${agency.minimumDebtAmount})`,
      };
    }

    // 5. Calculate days past due
    const daysPastDue = Math.floor(
      (Date.now() - toMillis(invoice.dueDate)) / (1000 * 60 * 60 * 24)
    );

    // 6. Build communication history for agency
    // Map attemptType to simplified communication type
    const communicationHistory = attempts.map(attempt => {
      let commType: 'email' | 'sms' | 'call' | 'letter' = 'email';

      if (attempt.attemptType === 'sms_reminder') commType = 'sms';
      else if (attempt.attemptType === 'physical_letter') commType = 'letter';
      else if (attempt.attemptType === 'ai_call' || attempt.attemptType === 'phone_call') commType = 'call';
      else commType = 'email'; // email_reminder defaults to email

      return {
        date: attempt.createdAt,
        type: commType,
        summary: `${attempt.attemptType}: ${attempt.result}${attempt.resultDetails ? ' - ' + attempt.resultDetails : ''}`,
      };
    });

    // 7. Create handoff document
    const handoffRef = db.collection('agency_handoffs').doc();
    const handoff: AgencyHandoff = {
      handoffId: handoffRef.id,
      invoiceId: params.invoiceId,
      freelancerId: params.freelancerId,
      agencyId: params.agencyId,
      handoffDate: FieldValue.serverTimestamp() as any,
      handoffStatus: 'pending',

      // Agency info
      agencyName: agency.agencyName,
      agencyContactEmail: agency.agencyContactEmail,
      agencyContactPhone: agency.agencyContactPhone,

      // Invoice details
      originalAmount: invoice.amount,
      outstandingAmount: invoice.amount, // Assuming no partial payments yet
      daysPastDue,

      // Documents & Evidence
      documents: [], // TODO: Upload invoice PDFs, comms to cloud storage
      communicationHistory,

      // Financial terms
      commissionPercentage: agency.commissionPercentage,

      // Notes
      notes: params.notes,

      // Status updates
      agencyUpdates: [],

      // Timestamps
      createdAt: FieldValue.serverTimestamp() as any,
    };

    await handoffRef.set(handoff);

    // 8. Update invoice status
    await db.collection('invoices').doc(params.invoiceId).update({
      status: 'in_collections',
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 9. Create collection attempt record
    const attemptRef = db.collection('collection_attempts').doc();
    await attemptRef.set({
      attemptId: attemptRef.id,
      invoiceId: params.invoiceId,
      freelancerId: params.freelancerId,
      attemptType: 'manual_contact',
      attemptDate: FieldValue.serverTimestamp(),
      attemptNumber: attempts.length + 1,
      result: 'pending',
      resultDetails: `Escalated to ${agency.agencyName}`,
      escalatedToAgency: true,
      agencyHandoffId: handoffRef.id,
      escalationDate: FieldValue.serverTimestamp(),
      isPremiumFeature: true,
      createdAt: FieldValue.serverTimestamp(),
    });

    // AUDIT TASK #4: Send notifications for agency handoff
    try {
      // 1. Notify agency via email
      await sendNotificationEmail({
        toEmail: agency.agencyContactEmail,
        subject: `New Collection Case: ${invoice.reference} - £${invoice.amount.toFixed(2)}`,
        message: `A new collection case has been assigned to ${agency.agencyName}.

**Invoice Details:**
- Invoice Number: ${invoice.reference}
- Client: ${invoice.clientName}
- Amount: £${invoice.amount.toFixed(2)}
- Days Past Due: ${daysPastDue}
- Original Invoice Date: ${toDate(invoice.invoiceDate).toLocaleDateString()}

**Case Summary:**
${communicationHistory.length} collection attempts have been made:
${communicationHistory.slice(0, 5).map((comm: any) => `- ${comm.type}: ${comm.summary}`).join('\n')}

**Next Steps:**
1. Review the case details in your agency portal
2. Download supporting documents (invoice PDFs, communication history)
3. Begin collection process per your standard procedures

Commission: ${agency.commissionPercentage}% of recovered amount

Case ID: ${handoffRef.id}`,
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/agency/cases/${handoffRef.id}`,
      });

      logInfo('Agency notification email sent', {
        handoffId: handoffRef.id,
        agencyEmail: agency.agencyContactEmail,
      });

    } catch (emailError) {
      logError('Failed to send agency notification email', emailError);
      // Continue - don't fail the handoff if email fails
    }

    try {
      // 2. Notify freelancer with in-app notification and email
      const freelancerDoc = await db.collection('users').doc(params.freelancerId).get();
      const freelancer = freelancerDoc.data();

      if (freelancer) {
        // Create in-app notification
        const notification = {
          notificationId: nanoid(),
          userId: params.freelancerId,
          type: 'agency_handoff',
          title: 'Invoice escalated to collection agency',
          message: `Invoice ${invoice.reference} (${invoice.clientName}) has been escalated to ${agency.agencyName} for professional collection. You'll be notified of any updates.`,
          read: false,
          actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/collections/agency/${handoffRef.id}`,
          metadata: {
            handoffId: handoffRef.id,
            invoiceId: params.invoiceId,
            agencyName: agency.agencyName,
          },
          createdAt: Timestamp.now(),
        };

        await db.collection('notifications').add(notification);

        // Send email if enabled
        if (freelancer.notificationPreferences?.emailNotifications && freelancer.email) {
          await sendNotificationEmail({
            toEmail: freelancer.email,
            subject: 'Invoice Escalated to Collection Agency',
            message: `Your invoice ${invoice.reference} for ${invoice.clientName} (£${invoice.amount.toFixed(2)}) has been escalated to ${agency.agencyName}.

**What happens next:**
1. ${agency.agencyName} will take over the collection process
2. You'll receive updates on their progress
3. If payment is recovered, the commission (${agency.commissionPercentage}%) will be automatically deducted

**You don't need to do anything** - the agency will handle all communication with the client.

We'll notify you of any developments.`,
            actionUrl: notification.actionUrl,
          });
        }

        logInfo('Freelancer notification sent', {
          handoffId: handoffRef.id,
          freelancerId: params.freelancerId,
        });
      }

    } catch (notificationError) {
      logError('Failed to send freelancer notification', notificationError);
      // Continue - don't fail the handoff if notification fails
    }

    // AUDIT TASK #5: Upload supporting documents to Firebase Storage
    try {
      const uploadedDocuments: string[] = [];

      // 1. Create communication history document as JSON
      const communicationHistoryJson = {
        handoffId: handoffRef.id,
        invoiceId: params.invoiceId,
        generatedAt: new Date().toISOString(),
        attempts: communicationHistory,
        summary: {
          totalAttempts: communicationHistory.length,
          attemptTypes: {
            email: communicationHistory.filter((c: any) => c.type === 'email').length,
            sms: communicationHistory.filter((c: any) => c.type === 'sms').length,
            call: communicationHistory.filter((c: any) => c.type === 'call').length,
            letter: communicationHistory.filter((c: any) => c.type === 'letter').length,
          },
          daysPastDue,
          originalAmount: invoice.amount,
        },
      };

      const historyBuffer = Buffer.from(JSON.stringify(communicationHistoryJson, null, 2), 'utf-8');

      const uploadResult = await uploadCommunicationHistory({
        contentBuffer: historyBuffer,
        fileName: `communication-history-${Date.now()}.json`,
        contentType: 'application/json',
        handoffId: handoffRef.id,
        freelancerId: params.freelancerId,
      });

      if (uploadResult.success && uploadResult.storagePath) {
        uploadedDocuments.push(uploadResult.storagePath);

        // Update handoff with document references
        await handoffRef.update({
          documents: uploadedDocuments,
          documentUrls: uploadedDocuments.map(path => ({
            storagePath: path,
            uploadedAt: Timestamp.now(),
            documentType: 'communication_history',
          })),
        });

        logInfo('Communication history uploaded to storage', {
          handoffId: handoffRef.id,
          storagePath: uploadResult.storagePath,
        });
      }

      // Note: Invoice PDF upload would require the actual PDF file
      // This can be added when invoice generation is implemented
      // For now, we store the communication history which is the most critical

    } catch (uploadError) {
      logError('Failed to upload documents to storage', uploadError);
      // Continue - document upload failure shouldn't block handoff creation
      // Documents can be uploaded manually later if needed
    }

    logInfo('Agency handoff created', {
      handoffId: handoffRef.id,
      invoiceId: params.invoiceId,
      agencyId: params.agencyId,
    });

    return {
      success: true,
      handoffId: handoffRef.id,
    };

  } catch (error) {
    logError('Failed to create agency handoff', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update handoff status from agency
 */
export async function updateHandoffStatus(
  handoffId: string,
  update: {
    status?: AgencyHandoff['handoffStatus'];
    notes?: string;
    actionTaken?: string;
    recoveryAmount?: number;
    recoveryOutcome?: AgencyHandoff['recoveryOutcome'];
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const handoffRef = db.collection('agency_handoffs').doc(handoffId);
    const handoffDoc = await handoffRef.get();

    if (!handoffDoc.exists) {
      return { success: false, error: 'Handoff not found' };
    }

    const updateData: any = {
      lastUpdate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    // Update status if provided
    if (update.status) {
      updateData.handoffStatus = update.status;

      if (update.status === 'closed') {
        updateData.closedAt = FieldValue.serverTimestamp();
      }
    }

    // Add recovery details if provided
    if (update.recoveryAmount !== undefined) {
      updateData.recoveryAmount = update.recoveryAmount;
      updateData.recoveryDate = FieldValue.serverTimestamp();

      // Calculate commission
      const handoff = handoffDoc.data() as AgencyHandoff;
      updateData.commissionAmount = (update.recoveryAmount * handoff.commissionPercentage) / 100;
    }

    if (update.recoveryOutcome) {
      updateData.recoveryOutcome = update.recoveryOutcome;
    }

    // Add to agency updates log
    if (update.notes || update.actionTaken) {
      updateData.agencyUpdates = FieldValue.arrayUnion({
        date: FieldValue.serverTimestamp(),
        status: update.status || 'in_progress',
        notes: update.notes || '',
        actionTaken: update.actionTaken,
      });
    }

    await handoffRef.update(updateData);

    // If paid, update invoice
    if (update.status === 'collected' && update.recoveryAmount) {
      const handoff = handoffDoc.data() as AgencyHandoff;
      await db.collection('invoices').doc(handoff.invoiceId).update({
        status: 'paid',
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // AUDIT TASK #4 & #6: Notify freelancer of successful recovery
      try {
        const freelancerDoc = await db.collection('users').doc(handoff.freelancerId).get();
        const freelancer = freelancerDoc.data();

        if (freelancer) {
          // Calculate net amount after commission
          const commissionAmount = update.recoveryAmount * (handoff.commissionPercentage / 100);
          const netAmount = update.recoveryAmount - commissionAmount;

          // Create in-app notification
          const notification = {
            notificationId: nanoid(),
            userId: handoff.freelancerId,
            type: 'payment_recovered',
            title: `Payment recovered by ${handoff.agencyName}!`,
            message: `Great news! ${handoff.agencyName} has successfully collected £${update.recoveryAmount.toFixed(2)} for invoice ${handoff.invoiceId}. After ${handoff.commissionPercentage}% commission, you'll receive £${netAmount.toFixed(2)}.`,
            read: false,
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/collections/agency/${handoffId}`,
            metadata: {
              handoffId,
              invoiceId: handoff.invoiceId,
              recoveryAmount: update.recoveryAmount,
              commissionAmount,
              netAmount,
            },
            createdAt: Timestamp.now(),
          };

          await db.collection('notifications').add(notification);

          // Send email if enabled
          if (freelancer.notificationPreferences?.emailNotifications && freelancer.email) {
            await sendNotificationEmail({
              toEmail: freelancer.email,
              subject: 'Payment Successfully Recovered!',
              message: `Excellent news! ${handoff.agencyName} has successfully recovered payment for your invoice.

**Recovery Details:**
- Invoice: ${handoff.invoiceId}
- Amount Recovered: £${update.recoveryAmount.toFixed(2)}
- Agency Commission (${handoff.commissionPercentage}%): £${commissionAmount.toFixed(2)}
- Net Amount to You: £${netAmount.toFixed(2)}

The net amount will be transferred to your account within 5-7 business days.

Thank you for using Recoup's collection services!`,
              actionUrl: notification.actionUrl,
            });
          }

          logInfo('Recovery notification sent to freelancer', {
            handoffId,
            freelancerId: handoff.freelancerId,
            recoveryAmount: update.recoveryAmount,
          });
        }

      } catch (notificationError) {
        logError('Failed to send recovery notification', notificationError);
        // Continue - notification failure shouldn't block the update
      }

      // AUDIT TASK #6: Create transaction record for payment tracking
      try {
        const transactionResult = await createAgencyRecoveryTransaction({
          invoiceId: handoff.invoiceId,
          freelancerId: handoff.freelancerId,
          agencyHandoffId: handoffId,
          agencyId: handoff.agencyId,
          grossAmount: update.recoveryAmount,
          agencyCommissionRate: handoff.commissionPercentage / 100,
          notes: `Recovery by ${handoff.agencyName}. ${update.recoveryOutcome || 'full_recovery'}`,
        });

        if (transactionResult.success) {
          // Link transaction to handoff
          await handoffRef.update({
            transactionId: transactionResult.transactionId,
            transactionCreatedAt: Timestamp.now(),
          });

          logInfo('Agency recovery transaction created', {
            handoffId,
            transactionId: transactionResult.transactionId,
            grossAmount: update.recoveryAmount,
          });
        } else {
          logError('Failed to create recovery transaction', new Error(transactionResult.error));
        }

      } catch (transactionError) {
        logError('Failed to create recovery transaction', transactionError);
        // Continue - transaction creation failure shouldn't block the update
        // Transactions can be created manually later if needed
      }
    }

    return { success: true };

  } catch (error) {
    logError('Failed to update handoff status', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get handoff details
 */
export async function getHandoffDetails(handoffId: string): Promise<AgencyHandoff | null> {
  try {
    const doc = await db.collection('agency_handoffs').doc(handoffId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as AgencyHandoff;

  } catch (error) {
    logError('Failed to get handoff details', error);
    return null;
  }
}

/**
 * List handoffs for freelancer
 */
export async function listFreelancerHandoffs(
  freelancerId: string,
  options?: {
    status?: AgencyHandoff['handoffStatus'];
    limit?: number;
  }
): Promise<AgencyHandoff[]> {
  try {
    let query = db
      .collection('agency_handoffs')
      .where('freelancerId', '==', freelancerId)
      .orderBy('createdAt', 'desc');

    if (options?.status) {
      query = query.where('handoffStatus', '==', options.status) as any;
    }

    if (options?.limit) {
      query = query.limit(options.limit) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data() as AgencyHandoff);

  } catch (error) {
    logError('Failed to list handoffs', error);
    return [];
  }
}

/**
 * Calculate potential commission for agency escalation
 */
export function calculateAgencyCommission(params: {
  amount: number;
  agencyId: string;
}): {
  commissionPercentage: number;
  commissionAmount: number;
  freelancerReceives: number;
  agencyReceives: number;
} | null {
  const agency = REGISTERED_AGENCIES.find(a => a.agencyId === params.agencyId);

  if (!agency) {
    return null;
  }

  const commissionAmount = (params.amount * agency.commissionPercentage) / 100;
  const freelancerReceives = params.amount - commissionAmount;

  return {
    commissionPercentage: agency.commissionPercentage,
    commissionAmount,
    freelancerReceives,
    agencyReceives: commissionAmount,
  };
}

/**
 * Get list of available agencies for freelancer
 */
export function getAvailableAgencies(params: {
  amount: number;
}): Array<{
  agencyId: string;
  agencyName: string;
  commissionPercentage: number;
  commissionAmount: number;
  freelancerReceives: number;
  minimumDebtAmount: number;
  eligible: boolean;
}> {
  return REGISTERED_AGENCIES.map(agency => {
    const eligible = params.amount >= agency.minimumDebtAmount;
    const commissionAmount = (params.amount * agency.commissionPercentage) / 100;
    const freelancerReceives = params.amount - commissionAmount;

    return {
      agencyId: agency.agencyId,
      agencyName: agency.agencyName,
      commissionPercentage: agency.commissionPercentage,
      commissionAmount,
      freelancerReceives,
      minimumDebtAmount: agency.minimumDebtAmount,
      eligible,
    };
  }).sort((a, b) => a.commissionPercentage - b.commissionPercentage); // Lowest commission first
}
