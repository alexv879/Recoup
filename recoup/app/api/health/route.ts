/**
 * Health Check API
 *
 * Used by Docker healthcheck and monitoring systems
 */

import { NextRequest, NextResponse } from 'next/server';
import { getFirestore } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    // Check Firebase connection
    const db = getFirestore();
    await db.collection('_health_check').doc('test').set({
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        api: 'ok',
        database: 'ok',
      },
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
        services: {
          api: 'ok',
          database: 'error',
        },
      },
      { status: 503 }
    );
  }
}
