/**
 * Schedule Report API Endpoint
 * POST /api/reports/schedule
 *
 * Schedule recurring report emails (daily/weekly/monthly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase-admin';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

interface ScheduleReportRequest {
  reportType: 'collections' | 'invoices' | 'revenue' | 'performance';
  frequency: 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
  timeOfDay?: string; // HH:MM format
  dayOfWeek?: number; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body: ScheduleReportRequest = await req.json();

    // 3. Validate required fields
    if (!body.reportType || !body.frequency || !body.recipients || body.recipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: reportType, frequency, recipients' },
        { status: 400 }
      );
    }

    // 4. Validate frequency-specific fields
    if (body.frequency === 'weekly' && body.dayOfWeek === undefined) {
      return NextResponse.json(
        { error: 'dayOfWeek required for weekly reports' },
        { status: 400 }
      );
    }

    if (body.frequency === 'monthly' && body.dayOfMonth === undefined) {
      return NextResponse.json(
        { error: 'dayOfMonth required for monthly reports' },
        { status: 400 }
      );
    }

    // 5. Create scheduled report in Firestore
    const scheduledReportRef = db.collection('scheduledReports').doc();
    const scheduledReport = {
      userId,
      reportType: body.reportType,
      frequency: body.frequency,
      recipients: body.recipients,
      format: body.format || 'pdf',
      timeOfDay: body.timeOfDay || '09:00',
      dayOfWeek: body.dayOfWeek,
      dayOfMonth: body.dayOfMonth,
      status: 'active',
      lastSentAt: null,
      nextScheduledAt: calculateNextRun(body),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await scheduledReportRef.set(scheduledReport);

    logInfo('Report schedule created', {
      scheduleId: scheduledReportRef.id,
      userId,
      reportType: body.reportType,
      frequency: body.frequency,
    });

    return NextResponse.json({
      success: true,
      scheduleId: scheduledReportRef.id,
      nextRun: scheduledReport.nextScheduledAt,
    });

  } catch (error: any) {
    logError('Failed to schedule report', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/schedule - List user's scheduled reports
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get user's scheduled reports
    const snapshot = await db
      .collection('scheduledReports')
      .where('userId', '==', userId)
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .get();

    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      reports,
      count: reports.length,
    });

  } catch (error: any) {
    logError('Failed to retrieve scheduled reports', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/reports/schedule - Cancel a scheduled report
 */
export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authentication
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Get schedule ID from query params
    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get('scheduleId');

    if (!scheduleId) {
      return NextResponse.json(
        { error: 'Missing scheduleId parameter' },
        { status: 400 }
      );
    }

    // 3. Get scheduled report
    const reportRef = db.collection('scheduledReports').doc(scheduleId);
    const reportDoc = await reportRef.get();

    if (!reportDoc.exists) {
      return NextResponse.json(
        { error: 'Scheduled report not found' },
        { status: 404 }
      );
    }

    const reportData = reportDoc.data();

    // 4. Verify ownership
    if (reportData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized access to scheduled report' },
        { status: 403 }
      );
    }

    // 5. Mark as cancelled
    await reportRef.update({
      status: 'cancelled',
      cancelledAt: new Date(),
      updatedAt: new Date(),
    });

    logInfo('Report schedule cancelled', { scheduleId, userId });

    return NextResponse.json({
      success: true,
      message: 'Report schedule cancelled',
    });

  } catch (error: any) {
    logError('Failed to cancel scheduled report', error);

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to calculate next run time
function calculateNextRun(config: ScheduleReportRequest): Date {
  const now = new Date();
  const [hours, minutes] = (config.timeOfDay || '09:00').split(':').map(Number);

  let nextRun = new Date(now);
  nextRun.setHours(hours, minutes, 0, 0);

  switch (config.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;

    case 'weekly':
      const targetDay = config.dayOfWeek || 1; // Default to Monday
      const currentDay = nextRun.getDay();
      let daysUntilTarget = (targetDay - currentDay + 7) % 7;

      if (daysUntilTarget === 0 && nextRun <= now) {
        daysUntilTarget = 7;
      }

      nextRun.setDate(nextRun.getDate() + daysUntilTarget);
      break;

    case 'monthly':
      const targetDate = config.dayOfMonth || 1;
      nextRun.setDate(targetDate);

      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }

  return nextRun;
}
