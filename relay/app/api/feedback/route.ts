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
import { errors, handleApiError } from '@/utils/error';
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
      throw errors.badRequest('Missing required fields: type, title, description');
    }

    if (!['bug', 'feature', 'improvement', 'question', 'other'].includes(type)) {
      throw errors.badRequest('Invalid feedback type');
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

    // 6. Send email notification to admin
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

    return NextResponse.json({
      success: true,
      message: 'Thank you for your feedback! We\'ll review it soon.',
      feedbackId,
    });

  } catch (error) {
    return handleApiError(error, 'POST', '/api/feedback');
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
      throw errors.unauthorized();
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
    return handleApiError(error, 'GET', '/api/feedback');
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
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'admin@relay.app';

  const priorityEmoji = {
    low: '🔵',
    medium: '🟡',
    high: '🟠',
    critical: '🔴',
  };

  const typeEmoji = {
    bug: '🐛',
    feature: '💡',
    improvement: '✨',
    question: '❓',
    other: '📝',
  };

  await sendEmail({
    to: adminEmail,
    subject: `${priorityEmoji[data.priority]} ${typeEmoji[data.type]} New ${data.type} report: ${data.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4f46e5;">New Feedback Received</h2>

        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Type:</strong> ${typeEmoji[data.type]} ${data.type.toUpperCase()}</p>
          <p><strong>Priority:</strong> ${priorityEmoji[data.priority]} ${data.priority.toUpperCase()}</p>
          <p><strong>From:</strong> ${data.userName} (${data.userEmail})</p>
          <p><strong>Page:</strong> <a href="${data.url}">${data.url}</a></p>
        </div>

        <div style="margin: 24px 0;">
          <h3 style="color: #111827;">${data.title}</h3>
          <p style="color: #374151; white-space: pre-wrap;">${data.description}</p>
        </div>

        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p style="margin: 0;">
            <a href="https://console.firebase.google.com"
               style="color: #4f46e5; text-decoration: none; font-weight: 600;">
              View in Firestore →
            </a>
          </p>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #6b7280;">
            Feedback ID: ${data.feedbackId}
          </p>
        </div>

        <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
          <p style="font-size: 12px; color: #9ca3af;">
            This is an automated notification from Relay Feedback System
          </p>
        </div>
      </div>
    `,
    text: `
NEW FEEDBACK RECEIVED

Type: ${data.type.toUpperCase()}
Priority: ${data.priority.toUpperCase()}
From: ${data.userName} (${data.userEmail})
Page: ${data.url}

Title: ${data.title}

Description:
${data.description}

Feedback ID: ${data.feedbackId}
View in Firestore: https://console.firebase.google.com
    `,
  });
}
