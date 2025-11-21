/**
 * MTD Authorization Initialization
 * GET /api/mtd/authorize
 *
 * Generates HMRC authorization URL for user to connect their account
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getHMRCAuthorizationUrl } from '@/lib/hmrc-client';
import { handleError, UnauthorizedError, ValidationError } from '@/utils/error';
import { logInfo } from '@/utils/logger';

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('You must be logged in to authorize HMRC.');
    }

    // 2. Get service type from query params
    const url = new URL(req.url);
    const service = url.searchParams.get('service'); // 'vat' or 'income_tax'

    if (!service || !['vat', 'income_tax', 'both'].includes(service)) {
      throw new ValidationError('Invalid service type. Must be "vat", "income_tax", or "both".');
    }

    // 3. Determine required scopes
    let scopes: string[] = [];

    if (service === 'vat' || service === 'both') {
      scopes.push(
        'read:vat',
        'write:vat'
      );
    }

    if (service === 'income_tax' || service === 'both') {
      scopes.push(
        'read:self-assessment',
        'write:self-assessment'
      );
    }

    // 4. Generate authorization URL
    const authUrl = getHMRCAuthorizationUrl(userId, scopes);

    logInfo('MTD authorization initiated', { userId, service, scopes });

    // 5. Return authorization URL
    return NextResponse.json({
      authorizationUrl: authUrl,
      service,
      scopes,
    });
  } catch (error) {
    const { status, body } = await handleError(error);
    return NextResponse.json(body, { status });
  }
}
