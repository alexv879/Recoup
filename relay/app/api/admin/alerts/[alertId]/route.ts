/**
 * ADMIN API: Alert Management
 * PATCH /api/admin/alerts/[alertId] - Update alert status
 */

import { NextRequest, NextResponse } from 'next/server';
import { db, FieldValue } from '@/lib/firebase';
import { SystemAlert } from '@/types/models';
import { requireAdmin, requireAdminPermission, createAdminAuditLog, getRequestMetadata } from '@/middleware/adminAuth';
import { formatErrorResponse, errors } from '@/utils/error';
import { logError } from '@/utils/logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ alertId: string }> }
) {
  try {
    const { alertId } = await params;

    // 1. Verify admin access
    const admin = await requireAdmin();
    await requireAdminPermission(admin.userId, 'alerts:manage');

    // 2. Get request body
    const body = await req.json();
    const { status, resolution } = body;

    if (!status) {
      throw errors.badRequest('Status is required');
    }

    // 3. Get current alert
    const alertDoc = await db.collection('system_alerts').doc(alertId).get();

    if (!alertDoc.exists) {
      throw errors.notFound('Alert not found');
    }

    const currentAlert = alertDoc.data() as SystemAlert;

    // 4. Build update object
    const updates: Partial<SystemAlert> = {
      status,
      updatedAt: FieldValue.serverTimestamp() as any,
    };

    if (status === 'acknowledged') {
      updates.acknowledgedBy = admin.userId;
      updates.acknowledgedAt = FieldValue.serverTimestamp() as any;
    }

    if (status === 'resolved') {
      updates.resolvedBy = admin.userId;
      updates.resolvedAt = FieldValue.serverTimestamp() as any;
      if (resolution) {
        updates.resolution = resolution;
      }
    }

    // 5. Update alert
    await db.collection('system_alerts').doc(alertId).update(updates);

    // 6. Create audit log
    const { ipAddress, userAgent } = getRequestMetadata(req);
    await createAdminAuditLog('alert_updated', {
      adminUserId: admin.userId,
      adminEmail: admin.email,
      targetResource: 'alert',
      targetResourceId: alertId,
      changes: [
        {
          field: 'status',
          oldValue: currentAlert.status,
          newValue: status,
        },
      ],
      ipAddress,
      userAgent,
    });

    // 7. Return updated alert
    const updatedAlert = await db.collection('system_alerts').doc(alertId).get();

    return NextResponse.json({
      success: true,
      data: {
        alert: {
          alertId: updatedAlert.id,
          ...updatedAlert.data(),
        },
      },
    });
  } catch (error) {
    logError('Error updating alert', error as Error);
    const errorResponse = formatErrorResponse(error);
    return NextResponse.json(errorResponse, {
      status: errorResponse.error.statusCode,
    });
  }
}
