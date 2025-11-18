/**
 * CRON JOB: Send Behavioral Emails
 * GET /api/cron/send-behavioral-emails
 *
 * Scheduled to run daily at 10:00 UTC (optimal send time)
 * Triggers behavioral email sequences based on user activity
 *
 * Sequences:
 * - Day 0: Welcome (immediately after signup via webhook)
 * - Day 1: Tutorial (if no invoice created)
 * - Day 3: Social proof
 * - Day 7: Feature deep-dive
 * - Day 14: Upgrade pitch
 *
 * Re-engagement:
 * - No login for 7+ days
 * - Invoice created but not sent (6+ hours)
 * - At quota limit
 *
 * Security: Requires CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import {
  sendTutorialEmail,
  sendSocialProofEmail,
  sendFeatureDeepDiveEmail,
  sendUpgradePitchEmail,
  sendInactiveUserEmail,
  sendInvoiceNotSentEmail,
  sendQuotaLimitEmail,
} from '@/lib/email-automation';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

/**
 * Send behavioral emails based on triggers
 * GET /api/cron/send-behavioral-emails
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();

  try {
    // 1. Verify cron secret
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedSecret = process.env.CRON_SECRET;

    if (!expectedSecret) {
      logError('CRON_SECRET not configured', new Error('Missing env var'));
      return NextResponse.json(
        { error: 'Cron secret not configured' },
        { status: 500 }
      );
    }

    if (cronSecret !== expectedSecret) {
      logError('Invalid cron secret', new Error('Unauthorized cron access'));
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logInfo('Behavioral email cron job started');

    const results = {
      day1_tutorial: 0,
      day3_social_proof: 0,
      day7_feature_deepdive: 0,
      day14_upgrade_pitch: 0,
      re_engagement_inactive: 0,
      re_engagement_invoice_not_sent: 0,
      quota_limit: 0,
      errors: 0,
    };

    // 2. Day 1: Tutorial (if no invoice created)
    const day1Users = await getUsersForDay1Tutorial();
    for (const user of day1Users) {
      try {
        await sendTutorialEmail((user as any).email, (user as any).name || 'there');
        await markEmailSent(user.id, 'tutorial', 1);
        results.day1_tutorial++;
      } catch (error) {
        logError('Failed to send Day 1 tutorial email', error as Error);
        results.errors++;
      }
    }

    // 3. Day 3: Social Proof
    const day3Users = await getUsersForDay3SocialProof();
    for (const user of day3Users) {
      try {
        await sendSocialProofEmail((user as any).email, (user as any).name || 'there');
        await markEmailSent(user.id, 'social_proof', 3);
        results.day3_social_proof++;
      } catch (error) {
        logError('Failed to send Day 3 social proof email', error as Error);
        results.errors++;
      }
    }

    // 4. Day 7: Feature Deep-Dive
    const day7Users = await getUsersForDay7FeatureDeepDive();
    for (const user of day7Users) {
      try {
        await sendFeatureDeepDiveEmail((user as any).email, (user as any).name || 'there');
        await markEmailSent(user.id, 'feature_deepdive', 7);
        results.day7_feature_deepdive++;
      } catch (error) {
        logError('Failed to send Day 7 feature deep-dive email', error as Error);
        results.errors++;
      }
    }

    // 5. Day 14: Upgrade Pitch
    const day14Users = await getUsersForDay14UpgradePitch();
    for (const user of day14Users) {
      try {
        const totalInvoiced = (user as any).totalAmountInvoiced || 0;
        await sendUpgradePitchEmail((user as any).email, (user as any).name || 'there', totalInvoiced);
        await markEmailSent(user.id, 'upgrade_pitch', 14);
        results.day14_upgrade_pitch++;
      } catch (error) {
        logError('Failed to send Day 14 upgrade pitch email', error as Error);
        results.errors++;
      }
    }

    // 6. Re-engagement: Inactive users (7+ days no login)
    const inactiveUsers = await getInactiveUsers();
    for (const user of inactiveUsers) {
      try {
        await sendInactiveUserEmail((user as any).email, (user as any).name || 'there');
        await markEmailSent(user.id, 're_engagement_inactive', 0);
        results.re_engagement_inactive++;
      } catch (error) {
        logError('Failed to send inactive user email', error as Error);
        results.errors++;
      }
    }

    // 7. Re-engagement: Invoice created but not sent (6+ hours)
    const unsentInvoices = await getUnsentInvoices();
    for (const invoice of unsentInvoices) {
      try {
        const user = invoice.user;
        await sendInvoiceNotSentEmail(user.email, user.name || 'there', invoice.id);
        await markInvoiceReminderSent(invoice.id);
        results.re_engagement_invoice_not_sent++;
      } catch (error) {
        logError('Failed to send invoice not sent email', error as Error);
        results.errors++;
      }
    }

    // 8. Quota limit warnings (users at 80%+ usage)
    const quotaLimitUsers = await getUsersNearQuotaLimit();
    for (const user of quotaLimitUsers) {
      try {
        await sendQuotaLimitEmail(
          (user as any).email,
          (user as any).name || 'there',
          (user as any).subscriptionTier || 'free',
          (user as any).collectionsUsedThisMonth || 0,
          (user as any).collectionsLimitPerMonth || 1
        );
        await markEmailSent(user.id, 'quota_limit', 0);
        results.quota_limit++;
      } catch (error) {
        logError('Failed to send quota limit email', error as Error);
        results.errors++;
      }
    }

    const duration = Date.now() - startTime;

    logInfo('Behavioral email cron job completed', {
      duration,
      results,
    });

    return NextResponse.json({
      success: true,
      message: 'Behavioral emails sent',
      results,
      duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;

    logError('Behavioral email cron job failed', error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to send behavioral emails',
        duration,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Get users for Day 1 tutorial email
 * Criteria: Signed up 1 day ago, no invoice created yet, no tutorial email sent
 */
async function getUsersForDay1Tutorial() {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const snapshot = await db
    .collection('users')
    .where('createdAt', '>=', oneDayAgo)
    .where('createdAt', '<', new Date(oneDayAgo.getTime() + 24 * 60 * 60 * 1000))
    .where('totalInvoicesCreated', '==', 0)
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((user: any) => !user.emailsSent?.includes('tutorial_day1') && user.email);
}

/**
 * Get users for Day 3 social proof email
 */
async function getUsersForDay3SocialProof() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const snapshot = await db
    .collection('users')
    .where('createdAt', '>=', threeDaysAgo)
    .where('createdAt', '<', new Date(threeDaysAgo.getTime() + 24 * 60 * 60 * 1000))
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(
      (user: any) =>
        user.subscriptionTier === 'free' && !user.emailsSent?.includes('social_proof_day3') && user.email
    );
}

/**
 * Get users for Day 7 feature deep-dive email
 */
async function getUsersForDay7FeatureDeepDive() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snapshot = await db
    .collection('users')
    .where('createdAt', '>=', sevenDaysAgo)
    .where('createdAt', '<', new Date(sevenDaysAgo.getTime() + 24 * 60 * 60 * 1000))
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(
      (user: any) =>
        user.subscriptionTier === 'free' &&
        !user.emailsSent?.includes('feature_deepdive_day7') &&
        user.email
    );
}

/**
 * Get users for Day 14 upgrade pitch email
 */
async function getUsersForDay14UpgradePitch() {
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const snapshot = await db
    .collection('users')
    .where('createdAt', '>=', fourteenDaysAgo)
    .where('createdAt', '<', new Date(fourteenDaysAgo.getTime() + 24 * 60 * 60 * 1000))
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter(
      (user: any) =>
        user.subscriptionTier === 'free' &&
        !user.emailsSent?.includes('upgrade_pitch_day14') &&
        user.email
    );
}

/**
 * Get inactive users (no login for 7+ days)
 */
async function getInactiveUsers() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const snapshot = await db
    .collection('users')
    .where('lastLoginAt', '<', sevenDaysAgo)
    .where('subscriptionTier', '==', 'free') // Only free users
    .limit(50) // Batch limit
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((user: any) => !user.emailsSent?.includes('re_engagement_inactive_recent') && user.email);
}

/**
 * Get invoices created but not sent (6+ hours ago)
 */
async function getUnsentInvoices() {
  const sixHoursAgo = new Date();
  sixHoursAgo.setHours(sixHoursAgo.getHours() - 6);

  const snapshot = await db
    .collection('invoices')
    .where('status', '==', 'draft')
    .where('createdAt', '<', sixHoursAgo)
    .limit(50)
    .get();

  const invoicesWithUsers = [];

  for (const doc of snapshot.docs) {
    const invoice = doc.data();

    // Skip if reminder already sent
    if (invoice.unsentReminderSent) continue;

    // Get user details
    const userDoc = await db.collection('users').doc(invoice.freelancerId).get();
    const userData = userDoc.data();

    if (userData?.email) {
      invoicesWithUsers.push({
        id: doc.id,
        ...invoice,
        user: {
          email: userData.email,
          name: userData.name || userData.businessName,
        },
      });
    }
  }

  return invoicesWithUsers;
}

/**
 * Get users near quota limit (80%+ usage)
 */
async function getUsersNearQuotaLimit() {
  const snapshot = await db
    .collection('users')
    .where('subscriptionTier', 'in', ['free', 'starter', 'growth'])
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }))
    .filter((user: any) => {
      const used = user.collectionsUsedThisMonth || 0;
      const limit = user.collectionsLimitPerMonth || 1;
      const percentageUsed = (used / limit) * 100;

      return percentageUsed >= 80 && !user.emailsSent?.includes('quota_limit_recent') && user.email;
    });
}

/**
 * Mark email as sent (prevent duplicates)
 */
async function markEmailSent(userId: string, emailType: string, day: number) {
  const emailKey = day > 0 ? `${emailType}_day${day}` : emailType;

  await db
    .collection('users')
    .doc(userId)
    .update({
      emailsSent: FieldValue.arrayUnion(emailKey),
      lastEmailSentAt: new Date(),
      updatedAt: new Date(),
    });
}

/**
 * Mark invoice reminder sent
 */
async function markInvoiceReminderSent(invoiceId: string) {
  await db
    .collection('invoices')
    .doc(invoiceId)
    .update({
      unsentReminderSent: true,
      updatedAt: new Date(),
    });
}
