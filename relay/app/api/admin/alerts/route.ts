/**
 * ADMIN API: System Alerts
 * GET /api/admin/alerts - Get system alerts
 * POST /api/admin/alerts - Create manual alert
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { SystemAlert } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse, errors } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();

    // 2. Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const severity = searchParams.get('severity') || '';
    const status = searchParams.get('status') || '';
    const type = searchParams.get('type') || '';
    const limit = parseInt(searchParams.get('limit') || '50');

    // 3. Build query
    let query = db.collection('system_alerts').orderBy('createdAt', 'desc');

    // Apply filters
    if (severity) {
      query = query.where('severity', '==', severity);
    }
    if (status) {
      query = query.where('status', '==', status);
    }
    if (type) {
      query = query.where('type', '==', type);
    }

    // 4. Execute query
    const snapshot = await query.limit(limit).get();

    const alerts = snapshot.docs.map((doc) => ({
      alertId: doc.id,
      ...doc.data(),
    })) as SystemAlert[];

    // 5. Calculate stats
    const stats = {
      total: alerts.length,
      active: alerts.filter((a) => a.status === 'active').length,
      critical: alerts.filter((a) => a.severity === 'critical').length,
      high: alerts.filter((a) => a.severity === 'high').length,
      bySeverity: {
        critical: alerts.filter((a) => a.severity === 'critical').length,
        high: alerts.filter((a) => a.severity === 'high').length,
        medium: alerts.filter((a) => a.severity === 'medium').length,
        low: alerts.filter((a) => a.severity === 'low').length,
        info: alerts.filter((a) => a.severity === 'info').length,
      },
      byStatus: {
        active: alerts.filter((a) => a.status === 'active').length,
        acknowledged: alerts.filter((a) => a.status === 'acknowledged').length,
        investigating: alerts.filter((a) => a.status === 'investigating').length,
        resolved: alerts.filter((a) => a.status === 'resolved').length,
        ignored: alerts.filter((a) => a.status === 'ignored').length,
      },
    };

    // 6. Return alerts
    return NextResponse.json({
      success: true,
      data: {
        alerts,
        stats,
      },
    });
  } catch (error) {
    logError('Error fetching alerts', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'alerts:manage');

    // 2. Get request body
    const body = await req.json();
    const {
      severity,
      type,
      title,
      message,
      affectedUsers,
      affectedInvoices,
      affectedPayments,
    } = body;

    // 3. Validate required fields
    if (!severity || !type || !title || !message) {
      throw errors.badRequest('Missing required fields: severity, type, title, message');
    }

    // 4. Create alert
    const alert: Partial<SystemAlert> = {
      severity,
      type,
      title,
      message,
      source: 'manual',
      affectedUsers,
      affectedInvoices,
      affectedPayments,
      status: 'active',
      notificationSent: false,
      createdAt: FieldValue.serverTimestamp() as any,
    };

    const alertRef = await db.collection('system_alerts').add(alert);

    // 5. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('alert_created', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetResource: 'alert',
      targetResourceId: alertRef.id,
      ipAddress,
      userAgent,
    });

    // 6. Return created alert
    const createdAlert = await alertRef.get();

    return NextResponse.json({
      success: true,
      data: {
        alert: {
          alertId: createdAlert.id,
          ...createdAlert.data(),
        },
      },
    });
  } catch (error) {
    logError('Error creating alert', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
