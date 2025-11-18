import { NextResponse } from 'next/server'
import { db } from '@/lib/firebase'

/**
 * Health Check Endpoint
 * Used by CI/CD and monitoring systems to verify application status
 */
export async function GET() {
  try {
    const checks = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        api: 'operational',
        database: 'unknown',
        environment: 'configured',
      },
      version: process.env.VERCEL_GIT_COMMIT_SHA || 'development',
      environment: process.env.VERCEL_ENV || 'development',
    }

    // Check Firebase connection
    try {
      // Attempt to read from Firestore (lightweight operation)
      await db.collection('health_check').limit(1).get()
      checks.services.database = 'operational'
    } catch (dbError) {
      console.error('Database health check failed:', dbError)
      checks.services.database = 'degraded'
      checks.status = 'degraded'
    }

    // Check environment variables
    const requiredEnvVars = [
      'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'SENDGRID_API_KEY',
    ]

    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

    if (missingEnvVars.length > 0) {
      checks.services.environment = 'misconfigured'
      checks.status = 'unhealthy'
      return NextResponse.json(
        {
          ...checks,
          error: 'Missing environment variables',
          missing: missingEnvVars,
        },
        { status: 503 }
      )
    }

    // Return appropriate status code
    const statusCode = checks.status === 'healthy' ? 200 : 503

    return NextResponse.json(checks, { status: statusCode })
  } catch (error) {
    console.error('Health check failed:', error)

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        services: {
          api: 'error',
          database: 'unknown',
          environment: 'unknown',
        },
      },
      { status: 503 }
    )
  }
}

/**
 * HEAD request for lightweight health checks
 */
export async function HEAD() {
  return new NextResponse(null, { status: 200 })
}
