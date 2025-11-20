/**
 * Readiness Check Endpoint
 * GET /api/readiness
 *
 * Comprehensive readiness check - verifies all critical dependencies are available
 * Used by Kubernetes/orchestrators to determine if app can receive traffic
 *
 * Checks:
 * - Firebase/Firestore connectivity
 * - Environment variables configured
 * - Critical services accessible
 *
 * Response:
 * - 200 OK if all systems ready
 * - 503 Service Unavailable if any critical system is down
 */

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { logError, logInfo } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface HealthCheck {
    name: string;
    status: 'pass' | 'fail';
    message?: string;
    responseTime?: number;
}

export async function GET(): Promise<NextResponse> {
    const startTime = Date.now();
    const checks: HealthCheck[] = [];
    let allHealthy = true;

    // 1. Check Firebase/Firestore connection
    try {
        const checkStart = Date.now();
        // Simple read operation to verify database connectivity
        await db.collection('_health_check').limit(1).get();
        checks.push({
            name: 'firestore',
            status: 'pass',
            responseTime: Date.now() - checkStart,
        });
    } catch (error) {
        allHealthy = false;
        checks.push({
            name: 'firestore',
            status: 'fail',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
        logError('Readiness check: Firestore failed', { error });
    }

    // 2. Check critical environment variables
    const requiredEnvVars = [
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'CLERK_SECRET_KEY',
        'FIREBASE_PROJECT_ID',
        'FIREBASE_CLIENT_EMAIL',
        'STRIPE_SECRET_KEY',
    ];

    const missingEnvVars = requiredEnvVars.filter(
        (envVar) => !process.env[envVar]
    );

    if (missingEnvVars.length > 0) {
        allHealthy = false;
        checks.push({
            name: 'environment',
            status: 'fail',
            message: `Missing: ${missingEnvVars.join(', ')}`,
        });
    } else {
        checks.push({
            name: 'environment',
            status: 'pass',
        });
    }

    // 3. Check Node.js version
    const nodeVersion = process.version;
    const minNodeVersion = 'v18.0.0';
    const isNodeVersionValid = nodeVersion >= minNodeVersion;

    checks.push({
        name: 'runtime',
        status: isNodeVersionValid ? 'pass' : 'fail',
        message: `Node ${nodeVersion} (min: ${minNodeVersion})`,
    });

    if (!isNodeVersionValid) {
        allHealthy = false;
    }

    const totalResponseTime = Date.now() - startTime;

    if (!allHealthy) {
        logError('Readiness check failed', { checks });
        return NextResponse.json(
            {
                status: 'not_ready',
                checks,
                timestamp: new Date().toISOString(),
                responseTime: totalResponseTime,
            },
            { status: 503 }
        );
    }

    logInfo('Readiness check passed', { responseTime: totalResponseTime });

    return NextResponse.json(
        {
            status: 'ready',
            checks,
            timestamp: new Date().toISOString(),
            responseTime: totalResponseTime,
            uptime: process.uptime(),
        },
        { status: 200 }
    );
}
