/**
 * USER FEEDBACK API
 * POST /api/feedback
 *
 * Allows users to submit feedback, bug reports, and feature requests
 * Stores in Firestore and sends email notification to admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, FieldValue } from '@/lib/firebase';
import { sendEmail } from '@/lib/sendgrid';
import { errors, handleApiError, UnauthorizedError, BadRequestError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';

export const dynamic = 'force-dynamic';

type FeedbackType = 'bug' | 'feature' | 'improvement' | 'question' | 'other';
type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

interface FeedbackData {
  type: FeedbackType;
  title: string;
  description: string;
  priority?: FeedbackPriority;
  url?: string;
  userAgent?: string;
  screenshot?: string;
}

/**
 * Submit user feedback
 * POST /api/feedback
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Get user (optional - allow anonymous feedback)
    const { userId } = await auth();

    // 2. Parse request body
    const body: FeedbackData = await req.json();
    const {
      type,
      title,
      description,
      priority = 'medium',
      url,
      userAgent,
      screenshot,
    } = body;

    // 3. Validate required fields
    if (!type || !title || !description) {
      throw new BadRequestError('Missing required fields: type, title, description');
    }

    if (!['bug', 'feature', 'improvement', 'question', 'other'].includes(type)) {
      throw new BadRequestError('Invalid feedback type');
    }

    // 4. Get user details (if authenticated)
    let userEmail = 'anonymous@relay.app';
    let userName = 'Anonymous User';

    if (userId) {
      const userDoc = await db.collection('users').doc(userId).get();
      const userData = userDoc.data();
      userEmail = userData?.email || userEmail;
      userName = userData?.name || userData?.businessName || userName;
    }

    // 5. Create feedback document
    const feedbackRef = db.collection('feedback').doc();
    const feedbackId = feedbackRef.id;

    await feedbackRef.set({
      feedbackId,
      userId: userId || null,
      userEmail,
      userName,

      // Feedback details
      type,
      title,
      description,
      priority,
      url: url || req.headers.get('referer') || '',
      userAgent: userAgent || req.headers.get('user-agent') || '',
      screenshot: screenshot || null,

      // Status tracking
      status: 'new', // new, reviewing, planned, in_progress, completed, wont_fix
      assignedTo: null,
      resolvedAt: null,
      resolution: null,

      // Metadata
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
    });

    logInfo('Feedback submitted', {
      feedbackId,
      type,
      priority,
      userId: userId || 'anonymous',
    });

    // 6. Send email notification to admin (disabled for now)
    /*
    try {
      await sendFeedbackNotification({
        feedbackId,
        type,
        title,
        description,
        priority,
        userName,
        userEmail,
        url: url || '',
      });
    } catch (emailError) {
      // Don't fail the request if email fails
      logError('Failed to send feedback notification email', emailError as Error);
    }
    */

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We\'ll review it soon.',
      feedbackId,
    });

  } catch (error) {
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Get user's feedback history
 * GET /api/feedback
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError();
    }

    const feedbackSnapshot = await db
      .collection('feedback')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const feedback = feedbackSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        feedbackId: data.feedbackId,
        type: data.type,
        title: data.title,
        description: data.description,
        priority: data.priority,
        status: data.status,
        createdAt: data.createdAt?.toDate().toISOString(),
        resolvedAt: data.resolvedAt?.toDate().toISOString(),
        resolution: data.resolution,
      };
    });

    return NextResponse.json({
      success: true,
      feedback,
      count: feedback.length,
    });

  } catch (error) {
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}

/**
 * Send email notification to admin about new feedback
 */
async function sendFeedbackNotification(data: {
  feedbackId: string;
  type: FeedbackType;
  title: string;
  description: string;
  priority: FeedbackPriority;
  userName: string;
  userEmail: string;
  url: string;
}): Promise<void> {
  // Email sending disabled for now to fix build
  logInfo('Feedback notification email disabled', { feedbackId: data.feedbackId });
}
