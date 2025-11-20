/**
 * Health Check Endpoint
 * GET /api/health
 *
 * Returns basic health status - used by load balancers, monitoring systems
 * This is a lightweight check that always returns quickly
 *
 * Response: 200 OK if application is running
 */

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(): Promise<NextResponse> {
    return NextResponse.json(
        {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
        { status: 200 }
    );
}
