/**
 * Verification Deadline Checker (Cron Job)
 * 
 * Runs hourly to check payment claim verification deadlines.
 * 
 * Based on Research:
 * - payment_verification_guide.md §4.1 (Pause/Resume Behavior)
 * - payment_verification_guide.md §4.2 (Pause/Resume Configuration)
 * - payment_verification_guide.md §7.1 (Multi-Channel Notifications)
 * 
 * Actions:
 * - Send reminder at 24 hours before deadline
 * - Send urgent reminder at 6 hours before deadline
 * - Auto-resume collections if deadline expires without verification
 * - Update invoice status
 * - Emit analytics events
 * 
 * Schedule: Every 1 hour (0 * * * *)
 * 
 * @module app/api/cron/check-verification-deadlines
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, Timestamp } from '@/lib/firebase';
import { resumeEscalation } from '@/jobs/collectionsEscalator';
import { sendNotificationEmail } from '@/lib/sendgrid';
import { trackEvent } from '@/lib/analytics';
import { logApiRequest, logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

interface VerificationCheckResult {
    scannedCount: number;
    reminders24h: number;
    reminders6h: number;
    autoResumedCount: number;
    errors: string[];
}

/**
 * Check verification deadlines and take appropriate actions
 */
async function checkVerificationDeadlines(): Promise<VerificationCheckResult> {
    const result: VerificationCheckResult = {
        scannedCount: 0,
        reminders24h: 0,
        reminders6h: 0,
        autoResumedCount: 0,
        errors: [],
    };

    const now = new Date();

    try {
        // Query all pending payment claims
        const claimsRef = db.collection('payment_claims');
        const claimsQuery = claimsRef.where('status', '==', 'pending_verification');

        const snapshot = await claimsQuery.get();
        result.scannedCount = snapshot.size;

        console.log(`[Verification Cron] Scanning ${snapshot.size} pending payment claims`);

        for (const claimDoc of snapshot.docs) {
            const claim = claimDoc.data();
            const claimId = claimDoc.id;

            try {
                // Calculate deadline (48 hours from creation)
                const createdAt = claim.createdAt.toDate();
                const deadline = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);
                const timeUntilDeadline = deadline.getTime() - now.getTime();

                // Check if deadline has expired
                if (timeUntilDeadline <= 0) {
                    console.log(`[Verification Cron] Deadline expired for claim ${claimId}, auto-resuming collections`);

                    // Auto-resume collections
                    await resumeEscalation(
                        claim.invoiceId,
                        'Verification deadline expired (48 hours)'
                    );

                    // Update payment claim status to rejected
                    await db.collection('payment_claims').doc(claimId).update({
                        status: 'rejected',
                        rejectedAt: Timestamp.now(),
                        rejectionReason: 'Verification deadline expired',
                        autoRejected: true,
                        updatedAt: Timestamp.now(),
                    });

                    // Update invoice status
                    await db.collection('invoices').doc(claim.invoiceId).update({
                        paymentClaimStatus: 'rejected',
                        updatedAt: Timestamp.now(),
                    });

                    // Track analytics
                    await trackEvent('payment_claim_auto_rejected', {
                        user_id: claim.freelancerId,
                        claim_id: claimId,
                        invoice_id: claim.invoiceId,
                        reason: 'deadline_expired',
                    });

                    result.autoResumedCount++;
                    continue;
                }

                // Send 24-hour reminder
                const twentyFourHourMark = new Date(deadline.getTime() - TWENTY_FOUR_HOURS_MS);
                const sixHourMark = new Date(deadline.getTime() - SIX_HOURS_MS);

                const reminderSent24h = claim.reminder24hSent || false;
                const reminderSent6h = claim.reminder6hSent || false;

                // Check if we should send 24h reminder
                if (!reminderSent24h && now >= twentyFourHourMark && timeUntilDeadline <= TWENTY_FOUR_HOURS_MS) {
                    console.log(`[Verification Cron] Sending 24h reminder for claim ${claimId}`);

                    try {
                        await sendVerificationReminder(claim, 24);

                        // Mark reminder as sent
                        await db.collection('payment_claims').doc(claimId).update({
                            reminder24hSent: true,
                            reminder24hSentAt: Timestamp.now(),
                            updatedAt: Timestamp.now(),
                        });

                        result.reminders24h++;
                    } catch (emailError) {
                        console.error(`[Verification Cron] Failed to send 24h reminder for ${claimId}:`, emailError);
                        result.errors.push(`24h reminder failed for ${claimId}`);
                    }
                }

                // Check if we should send 6h reminder (urgent)
                if (!reminderSent6h && now >= sixHourMark && timeUntilDeadline <= SIX_HOURS_MS) {
                    console.log(`[Verification Cron] Sending 6h urgent reminder for claim ${claimId}`);

                    try {
                        await sendVerificationReminder(claim, 6);

                        // Mark reminder as sent
                        await db.collection('payment_claims').doc(claimId).update({
                            reminder6hSent: true,
                            reminder6hSentAt: Timestamp.now(),
                            updatedAt: Timestamp.now(),
                        });

                        result.reminders6h++;
                    } catch (emailError) {
                        console.error(`[Verification Cron] Failed to send 6h reminder for ${claimId}:`, emailError);
                        result.errors.push(`6h reminder failed for ${claimId}`);
                    }
                }
            } catch (claimError) {
                console.error(`[Verification Cron] Error processing claim ${claimId}:`, claimError);
                result.errors.push(`Failed to process claim ${claimId}`);
            }
        }

        console.log(`[Verification Cron] Complete:`, result);
        return result;
    } catch (error) {
        console.error('[Verification Cron] Fatal error:', error);
        result.errors.push(error instanceof Error ? error.message : 'Unknown error');
        return result;
    }
}

/**
 * Send verification reminder email to freelancer
 */
async function sendVerificationReminder(claim: any, hoursRemaining: 24 | 6): Promise<void> {
    const isUrgent = hoursRemaining === 6;

    // Get freelancer user document to get email
    const userSnapshot = await db.collection('users').where('userId', '==', claim.freelancerId).get();

    if (userSnapshot.empty) {
        throw new Error(`Freelancer user not found: ${claim.freelancerId}`);
    }

    const freelancer = userSnapshot.docs[0].data();
    const freelancerEmail = freelancer.email;

    // Prepare email content
    const subject = isUrgent
        ? `URGENT: Verify payment claim in ${hoursRemaining} hours - Invoice ${claim.invoiceReference}`
        : `Reminder: Verify payment claim - Invoice ${claim.invoiceReference}`;

    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: ${isUrgent ? '#DC2626' : '#F59E0B'}; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #F9FAFB; padding: 30px; border-radius: 0 0 8px 8px; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .button { display: inline-block; background: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .warning { background: ${isUrgent ? '#FEE2E2' : '#FEF3C7'}; border-left: 4px solid ${isUrgent ? '#DC2626' : '#F59E0B'}; padding: 15px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>${isUrgent ? '⚠️ URGENT' : '⏰ Reminder'}: Payment Verification Needed</h1>
        </div>
        <div class="content">
          <p>Hi ${freelancer.name || 'there'},</p>
          
          <div class="warning">
            <strong>${isUrgent ? 'Action required within 6 hours!' : 'Action required within 24 hours!'}</strong><br>
            A payment claim is pending verification and will expire if not reviewed.
          </div>
          
          <div class="details">
            <h3>Payment Claim Details</h3>
            <p><strong>Invoice:</strong> ${claim.invoiceReference}</p>
            <p><strong>Client:</strong> ${claim.clientName}</p>
            <p><strong>Amount:</strong> £${claim.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })}</p>
            <p><strong>Payment Method:</strong> ${claim.paymentMethod}</p>
            <p><strong>Deadline:</strong> ${hoursRemaining} hours from now</p>
          </div>
          
          <p>If you don't verify this claim within ${hoursRemaining} hours:</p>
          <ul>
            <li>The payment claim will be automatically rejected</li>
            <li>Collections reminders will resume immediately</li>
            <li>The client will be notified</li>
          </ul>
          
          <p style="text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${claim.invoiceId}" class="button">
              Review Payment Claim Now
            </a>
          </p>
          
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            This is an automated reminder from Relay. For questions, contact support@relay.app
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

    await sendNotificationEmail({
        toEmail: freelancerEmail,
        subject,
        message: isUrgent ? 'URGENT: Payment verification required within 6 hours' : 'Payment verification reminder - 24 hours remaining',
        actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices/${claim.invoiceId}`,
    });

    // Track analytics
    await trackEvent('verification_reminder_sent', {
        user_id: claim.freelancerId,
        claim_id: claim.claimId || claim.id,
        invoice_id: claim.invoiceId,
        hours_remaining: hoursRemaining,
        is_urgent: isUrgent,
    });
}

/**
 * Cron endpoint handler
 * GET /api/cron/check-verification-deadlines
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        logApiRequest('GET', '/api/cron/check-verification-deadlines');

        // Verify cron secret
        const authHeader = req.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Invalid authorization' },
                { status: 401 }
            );
        }

        // Run deadline checks
        const result = await checkVerificationDeadlines();

        // Log response
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/cron/check-verification-deadlines', 200, duration);

        return NextResponse.json({
            success: true,
            ...result,
            duration: `${duration}ms`,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        logApiResponse('GET', '/api/cron/check-verification-deadlines', 500, duration);

        console.error('[Verification Cron] Fatal error:', error);

        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: `${duration}ms`,
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
