/**
 * HMRC Making Tax Digital (MTD) API Client
 *
 * Handles VAT submissions and retrievals via HMRC API
 *
 * References:
 * - https://developer.service.hmrc.gov.uk/api-documentation/docs/api/service/vat-api/1.0
 */

import { getValidAccessToken } from './hmrc-oauth';
import type { VATReturn } from './mtd-vat';

const HMRC_BASE_URL = process.env.HMRC_ENV === 'production'
  ? 'https://api.service.hmrc.gov.uk'
  : 'https://test-api.service.hmrc.gov.uk';

export interface HMRCError {
  code: string;
  message: string;
  path?: string;
}

export interface HMRCVATObligation {
  start: string; // YYYY-MM-DD
  end: string;
  due: string;
  status: 'O' | 'F'; // Open or Fulfilled
  periodKey: string;
  received?: string; // Date return was received
}

export interface HMRCVATLiability {
  taxPeriod: {
    from: string;
    to: string;
  };
  type: 'VAT Return Debit Charge' | 'VAT Return Credit Charge' | 'VAT Officer Assessment';
  originalAmount: number;
  outstandingAmount: number;
  due: string;
}

export interface HMRCVATReturnSubmission {
  periodKey: string;
  vatDueSales: number;
  vatDueAcquisitions: number;
  totalVatDue: number;
  vatReclaimedCurrPeriod: number;
  netVatDue: number;
  totalValueSalesExVAT: number;
  totalValuePurchasesExVAT: number;
  totalValueGoodsSuppliedExVAT: number;
  totalAcquisitionsExVAT: number;
  finalised: boolean;
}

export interface HMRCVATReturnResponse {
  processingDate: string;
  paymentIndicator: string;
  formBundleNumber: string;
  chargeRefNumber?: string;
}

/**
 * HMRC MTD API Client
 */
export class HMRCMTDClient {
  private userId: string;
  private vrn: string; // VAT Registration Number

  constructor(userId: string, vrn: string) {
    this.userId = userId;
    this.vrn = vrn;
  }

  /**
   * Make authenticated request to HMRC API
   */
  private async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<T> {
    const accessToken = await getValidAccessToken(this.userId);

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.hmrc.1.0+json',
    };

    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${HMRC_BASE_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new HMRCAPIError(response.status, error);
    }

    return response.json();
  }

  /**
   * Retrieve VAT obligations
   */
  async getVATObligations(from?: string, to?: string): Promise<HMRCVATObligation[]> {
    let endpoint = `/organisations/vat/${this.vrn}/obligations`;

    if (from && to) {
      const params = new URLSearchParams({ from, to });
      endpoint += `?${params.toString()}`;
    }

    const response = await this.makeRequest<{ obligations: HMRCVATObligation[] }>(endpoint);
    return response.obligations;
  }

  /**
   * Retrieve open VAT obligations (returns not yet submitted)
   */
  async getOpenVATObligations(): Promise<HMRCVATObligation[]> {
    const endpoint = `/organisations/vat/${this.vrn}/obligations?status=O`;
    const response = await this.makeRequest<{ obligations: HMRCVATObligation[] }>(endpoint);
    return response.obligations;
  }

  /**
   * Retrieve VAT liabilities
   */
  async getVATLiabilities(from: string, to: string): Promise<HMRCVATLiability[]> {
    const params = new URLSearchParams({ from, to });
    const endpoint = `/organisations/vat/${this.vrn}/liabilities?${params.toString()}`;

    const response = await this.makeRequest<{ liabilities: HMRCVATLiability[] }>(endpoint);
    return response.liabilities;
  }

  /**
   * Retrieve a submitted VAT return
   */
  async getVATReturn(periodKey: string): Promise<HMRCVATReturnSubmission> {
    const endpoint = `/organisations/vat/${this.vrn}/returns/${periodKey}`;
    return this.makeRequest<HMRCVATReturnSubmission>(endpoint);
  }

  /**
   * Submit VAT return to HMRC
   */
  async submitVATReturn(
    vatReturn: VATReturn,
    periodKey: string
  ): Promise<HMRCVATReturnResponse> {
    const submission: HMRCVATReturnSubmission = {
      periodKey,
      vatDueSales: vatReturn.box1_vatDueOnSales,
      vatDueAcquisitions: vatReturn.box2_vatDueOnECAcquisitions,
      totalVatDue: vatReturn.box3_totalVATDue,
      vatReclaimedCurrPeriod: vatReturn.box4_vatReclaimedOnPurchases,
      netVatDue: Math.abs(vatReturn.box5_netVATDue), // HMRC expects positive value
      totalValueSalesExVAT: vatReturn.box6_totalValueSalesExVAT,
      totalValuePurchasesExVAT: vatReturn.box7_totalValuePurchasesExVAT,
      totalValueGoodsSuppliedExVAT: vatReturn.box8_totalValueECSales,
      totalAcquisitionsExVAT: vatReturn.box9_totalValueECPurchases,
      finalised: true,
    };

    const endpoint = `/organisations/vat/${this.vrn}/returns`;
    return this.makeRequest<HMRCVATReturnResponse>(endpoint, 'POST', submission);
  }

  /**
   * Test connection to HMRC (retrieve obligations)
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getVATObligations();
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Custom error class for HMRC API errors
 */
export class HMRCAPIError extends Error {
  public statusCode: number;
  public hmrcErrors: HMRCError[];

  constructor(statusCode: number, errorResponse: any) {
    const errors = errorResponse.errors || [{ code: 'UNKNOWN', message: errorResponse.message || 'Unknown error' }];
    const message = errors.map((e: HMRCError) => `${e.code}: ${e.message}`).join(', ');

    super(`HMRC API Error (${statusCode}): ${message}`);

    this.name = 'HMRCAPIError';
    this.statusCode = statusCode;
    this.hmrcErrors = errors;
  }

  /**
   * Check if error is due to invalid credentials
   */
  isAuthError(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }

  /**
   * Check if error is due to invalid request
   */
  isBadRequest(): boolean {
    return this.statusCode === 400;
  }

  /**
   * Check if error is due to rate limiting
   */
  isRateLimited(): boolean {
    return this.statusCode === 429;
  }

  /**
   * Check if error is server-side
   */
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Convert period key to dates (HMRC format: #001 = Q1, #002 = Q2, etc.)
 */
export function parsePeriodKey(periodKey: string): { year: string; quarter: number } {
  const match = periodKey.match(/^(\d{2})([A-C])(\d)$/);

  if (!match) {
    throw new Error(`Invalid period key format: ${periodKey}`);
  }

  const [, year, , quarter] = match;

  return {
    year: `20${year}`, // Convert 24 to 2024
    quarter: parseInt(quarter),
  };
}

/**
 * Generate period key from year and quarter (HMRC format)
 */
export function generatePeriodKey(year: number, quarter: number): string {
  const yearSuffix = year.toString().slice(-2);
  return `${yearSuffix}A${quarter}`;
}
