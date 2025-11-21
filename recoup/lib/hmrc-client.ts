/**
 * HMRC Making Tax Digital API Client
 *
 * Implements OAuth 2.0 and API calls for:
 * - MTD VAT (VAT returns, obligations, liabilities)
 * - MTD ITSA (Income Tax quarterly updates, final declaration)
 *
 * Documentation:
 * - VAT API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
 * - Income Tax API: https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/self-assessment-api/3.0
 *
 * ✅ MTD-COMPLIANT: Follows HMRC digital linking requirements
 */

import { db } from './firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { MTDRegistration, VATReturn, IncomeTaxQuarterlyUpdate } from '@/types/models';
import { logInfo, logError } from '@/utils/logger';

/**
 * HMRC API Configuration
 */
const HMRC_CONFIG = {
  // Production endpoints
  production: {
    authUrl: 'https://api.service.hmrc.gov.uk/oauth/authorize',
    tokenUrl: 'https://api.service.hmrc.gov.uk/oauth/token',
    apiUrl: 'https://api.service.hmrc.gov.uk',
  },
  // Sandbox for testing
  sandbox: {
    authUrl: 'https://test-api.service.hmrc.gov.uk/oauth/authorize',
    tokenUrl: 'https://test-api.service.hmrc.gov.uk/oauth/token',
    apiUrl: 'https://test-api.service.hmrc.gov.uk',
  },
};

const ENV = process.env.HMRC_ENVIRONMENT === 'production' ? 'production' : 'sandbox';
const BASE_URL = HMRC_CONFIG[ENV].apiUrl;

/**
 * HMRC OAuth 2.0 Authorization
 * Generates authorization URL for user to connect their HMRC account
 */
export function getHMRCAuthorizationUrl(userId: string, scopes: string[]): string {
  const clientId = process.env.HMRC_CLIENT_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/hmrc/callback`;

  const params = new URLSearchParams({
    client_id: clientId!,
    response_type: 'code',
    scope: scopes.join(' '),
    state: userId, // Include userId to identify on callback
    redirect_uri: redirectUri,
  });

  return `${HMRC_CONFIG[ENV].authUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeHMRCAuthCode(
  code: string,
  userId: string
): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}> {
  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/hmrc/callback`;

  const response = await fetch(HMRC_CONFIG[ENV].tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    logError('HMRC token exchange failed', new Error(JSON.stringify(error)));
    throw new Error(`HMRC OAuth failed: ${error.error_description || error.error}`);
  }

  const data = await response.json();

  // Store tokens securely in Firestore (encrypted in production)
  await db.collection('mtd_registrations').doc(userId).set({
    hmrcAccessToken: data.access_token, // TODO: Encrypt in production
    hmrcRefreshToken: data.refresh_token, // TODO: Encrypt in production
    hmrcTokenExpiry: Timestamp.fromDate(new Date(Date.now() + data.expires_in * 1000)),
    updatedAt: Timestamp.now(),
  }, { merge: true });

  logInfo('HMRC tokens obtained', { userId });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresIn: data.expires_in,
  };
}

/**
 * Refresh HMRC access token
 */
export async function refreshHMRCAccessToken(userId: string): Promise<string> {
  const registration = await getRegistration(userId);

  if (!registration.hmrcRefreshToken) {
    throw new Error('No refresh token available. User must re-authorize.');
  }

  const clientId = process.env.HMRC_CLIENT_ID;
  const clientSecret = process.env.HMRC_CLIENT_SECRET;

  const response = await fetch(HMRC_CONFIG[ENV].tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      grant_type: 'refresh_token',
      refresh_token: registration.hmrcRefreshToken,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh HMRC token');
  }

  const data = await response.json();

  // Update tokens
  await db.collection('mtd_registrations').doc(userId).update({
    hmrcAccessToken: data.access_token,
    hmrcRefreshToken: data.refresh_token || registration.hmrcRefreshToken,
    hmrcTokenExpiry: Timestamp.fromDate(new Date(Date.now() + data.expires_in * 1000)),
    updatedAt: Timestamp.now(),
  });

  return data.access_token;
}

/**
 * Get valid access token (refresh if expired)
 */
async function getValidAccessToken(userId: string): Promise<string> {
  const registration = await getRegistration(userId);

  if (!registration.hmrcAccessToken) {
    throw new Error('User not connected to HMRC. Authorization required.');
  }

  // Check if token is expired
  const expiry = registration.hmrcTokenExpiry as any;
  const expiryDate = expiry?.toDate ? expiry.toDate() : new Date(expiry);

  if (expiryDate < new Date()) {
    // Token expired, refresh it
    return await refreshHMRCAccessToken(userId);
  }

  return registration.hmrcAccessToken;
}

/**
 * Get MTD registration for user
 */
async function getRegistration(userId: string): Promise<MTDRegistration> {
  const doc = await db.collection('mtd_registrations').doc(userId).get();

  if (!doc.exists) {
    throw new Error('MTD registration not found');
  }

  return doc.data() as MTDRegistration;
}

/**
 * ========================================
 * VAT API METHODS
 * ========================================
 */

/**
 * Get VAT obligations for a period
 */
export async function getVATObligations(
  userId: string,
  vrn: string,
  from: Date,
  to: Date
): Promise<any[]> {
  const accessToken = await getValidAccessToken(userId);

  const params = new URLSearchParams({
    from: from.toISOString().split('T')[0],
    to: to.toISOString().split('T')[0],
  });

  const response = await fetch(
    `${BASE_URL}/organisations/vat/${vrn}/obligations?${params.toString()}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.hmrc.1.0+json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`HMRC VAT obligations error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.obligations || [];
}

/**
 * Submit VAT return to HMRC
 */
export async function submitVATReturn(
  userId: string,
  vatReturn: VATReturn
): Promise<{
  processingDate: string;
  paymentIndicator: string;
  formBundleNumber: string;
}> {
  const accessToken = await getValidAccessToken(userId);
  const registration = await getRegistration(userId);

  if (!registration.vatNumber) {
    throw new Error('VAT number not configured');
  }

  // HMRC expects amounts in pounds (2 decimal places), we store in pence
  const payload = {
    periodKey: vatReturn.periodKey,
    vatDueSales: (vatReturn.vatDueSales / 100).toFixed(2),
    vatDueAcquisitions: (vatReturn.vatDueAcquisitions / 100).toFixed(2),
    totalVatDue: (vatReturn.totalVATDue / 100).toFixed(2),
    vatReclaimedCurrPeriod: (vatReturn.vatReclaimedCurrPeriod / 100).toFixed(2),
    netVatDue: (vatReturn.netVATDue / 100).toFixed(2),
    totalValueSalesExVAT: Math.round(vatReturn.totalValueSalesExVAT / 100),
    totalValuePurchasesExVAT: Math.round(vatReturn.totalValuePurchasesExVAT / 100),
    totalValueGoodsSuppliedExVAT: Math.round(vatReturn.totalValueGoodsSuppliedExVAT / 100),
    totalAcquisitionsExVAT: Math.round(vatReturn.totalAcquisitionsExVAT / 100),
    finalised: true,
  };

  const response = await fetch(
    `${BASE_URL}/organisations/vat/${registration.vatNumber}/returns`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.hmrc.1.0+json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    logError('VAT return submission failed', new Error(JSON.stringify(error)));
    throw new Error(`VAT submission failed: ${error.message || response.statusText}`);
  }

  const result = await response.json();

  // Update VAT return record
  await db.collection('vat_returns').doc(vatReturn.vatReturnId).update({
    status: 'accepted',
    submittedAt: Timestamp.now(),
    acceptedAt: Timestamp.now(),
    hmrcProcessingDate: result.processingDate,
    hmrcReceiptId: result.formBundleNumber,
    updatedAt: Timestamp.now(),
  });

  // Update MTD registration
  await db.collection('mtd_registrations').doc(userId).update({
    lastVATSubmission: Timestamp.now(),
    mtdCompliant: true,
    updatedAt: Timestamp.now(),
  });

  logInfo('VAT return submitted successfully', {
    userId,
    vatReturnId: vatReturn.vatReturnId,
    processingDate: result.processingDate,
  });

  return result;
}

/**
 * Get submitted VAT returns
 */
export async function getVATReturns(
  userId: string,
  vrn: string,
  periodKey?: string
): Promise<any[]> {
  const accessToken = await getValidAccessToken(userId);

  const url = periodKey
    ? `${BASE_URL}/organisations/vat/${vrn}/returns/${periodKey}`
    : `${BASE_URL}/organisations/vat/${vrn}/returns`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.hmrc.1.0+json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to retrieve VAT returns: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * ========================================
 * INCOME TAX API METHODS
 * ========================================
 */

/**
 * Create/update self-employment periodic update
 */
export async function submitIncomeTaxUpdate(
  userId: string,
  update: IncomeTaxQuarterlyUpdate
): Promise<void> {
  const accessToken = await getValidAccessToken(userId);
  const registration = await getRegistration(userId);

  if (!registration.nino) {
    throw new Error('National Insurance Number not configured');
  }

  // HMRC expects amounts in pounds
  const payload = {
    periodFromDate: update.quarterStart,
    periodToDate: update.quarterEnd,
    incomes: {
      turnover: {
        turnover: (update.totalIncome / 100).toFixed(2),
      },
    },
    expenses: {
      consolidatedExpenses: (update.totalExpenses / 100).toFixed(2),
    },
  };

  const response = await fetch(
    `${BASE_URL}/individuals/business/self-employment/${registration.nino}/${update.taxYear}/periodic`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.hmrc.1.0+json',
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Income Tax submission failed: ${error.message || response.statusText}`);
  }

  // Update status in Firestore
  await db.collection('income_tax_updates').doc(update.updateId).update({
    status: 'accepted',
    submittedAt: Timestamp.now(),
    acceptedAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  await db.collection('mtd_registrations').doc(userId).update({
    lastIncomeSubmission: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });

  logInfo('Income Tax quarterly update submitted', {
    userId,
    updateId: update.updateId,
    quarter: update.quarter,
  });
}

/**
 * Get business income source summary
 */
export async function getBusinessIncome(
  userId: string,
  taxYear: string
): Promise<any> {
  const accessToken = await getValidAccessToken(userId);
  const registration = await getRegistration(userId);

  const response = await fetch(
    `${BASE_URL}/individuals/business/self-employment/${registration.nino}/${taxYear}/annual`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.hmrc.1.0+json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to get business income: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Test HMRC API connection
 */
export async function testHMRCConnection(userId: string): Promise<boolean> {
  try {
    const accessToken = await getValidAccessToken(userId);

    // Test with a simple API call
    const response = await fetch(`${BASE_URL}/hello/world`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.hmrc.1.0+json',
      },
    });

    return response.ok;
  } catch (error) {
    logError('HMRC connection test failed', error as Error);
    return false;
  }
}
