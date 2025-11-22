/**
 * Tests for HMRC MTD API Client
 */

// Mock hmrc-oauth module before imports
jest.mock('../../lib/hmrc-oauth', () => ({
  getValidAccessToken: jest.fn().mockResolvedValue('mock-access-token'),
  getHMRCTokens: jest.fn().mockResolvedValue({
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
    expires_at: Date.now() + 7200000, // 2 hours from now
    token_type: 'Bearer',
    scope: 'read:vat write:vat',
  }),
  storeHMRCTokens: jest.fn().mockResolvedValue(undefined),
  revokeHMRCAccess: jest.fn().mockResolvedValue(undefined),
  refreshAccessToken: jest.fn().mockResolvedValue({
    access_token: 'new-mock-access-token',
    refresh_token: 'new-mock-refresh-token',
    expires_at: Date.now() + 7200000,
    token_type: 'Bearer',
    scope: 'read:vat write:vat',
  }),
}));

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  HMRCMTDClient,
  HMRCAPIError,
  parsePeriodKey,
  generatePeriodKey,
} from '@/lib/hmrc-mtd-client';
import type { VATReturn, VATPeriod } from '@/lib/mtd-vat';

// Mock fetch globally
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('HMRCMTDClient', () => {
  let client: HMRCMTDClient;
  const mockUserId = 'user_123';
  const mockVRN = '123456789';

  beforeEach(() => {
    // Clear fetch mock
    (global.fetch as jest.MockedFunction<typeof fetch>).mockClear();

    client = new HMRCMTDClient(mockUserId, mockVRN);
  });

  describe('getVATObligations', () => {
    it('should retrieve VAT obligations', async () => {
      const mockObligations = {
        obligations: [
          {
            start: '2024-01-01',
            end: '2024-03-31',
            due: '2024-05-08',
            status: 'O' as const,
            periodKey: '24A1',
          },
          {
            start: '2024-04-01',
            end: '2024-06-30',
            due: '2024-08-06',
            status: 'F' as const,
            periodKey: '24A2',
            received: '2024-07-15',
          },
        ],
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObligations,
      } as Response);

      const obligations = await client.getVATObligations('2024-01-01', '2024-12-31');

      expect(obligations).toHaveLength(2);
      expect(obligations[0].status).toBe('O');
      expect(obligations[1].status).toBe('F');
      expect(obligations[1].received).toBe('2024-07-15');
    });

    it('should handle API errors', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          errors: [{ code: 'UNAUTHORIZED', message: 'Invalid credentials' }],
        }),
      } as Response);

      await expect(client.getVATObligations()).rejects.toThrow(HMRCAPIError);
    });
  });

  describe('getOpenVATObligations', () => {
    it('should retrieve only open obligations', async () => {
      const mockObligations = {
        obligations: [
          {
            start: '2024-01-01',
            end: '2024-03-31',
            due: '2024-05-08',
            status: 'O' as const,
            periodKey: '24A1',
          },
        ],
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockObligations,
      } as Response);

      const obligations = await client.getOpenVATObligations();

      expect(obligations).toHaveLength(1);
      expect(obligations[0].status).toBe('O');
    });
  });

  describe('getVATLiabilities', () => {
    it('should retrieve VAT liabilities', async () => {
      const mockLiabilities = {
        liabilities: [
          {
            taxPeriod: {
              from: '2024-01-01',
              to: '2024-03-31',
            },
            type: 'VAT Return Debit Charge' as const,
            originalAmount: 500000,
            outstandingAmount: 500000,
            due: '2024-05-08',
          },
        ],
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockLiabilities,
      } as Response);

      const liabilities = await client.getVATLiabilities('2024-01-01', '2024-12-31');

      expect(liabilities).toHaveLength(1);
      expect(liabilities[0].originalAmount).toBe(500000);
      expect(liabilities[0].outstandingAmount).toBe(500000);
    });
  });

  describe('getVATReturn', () => {
    it('should retrieve a submitted VAT return', async () => {
      const mockReturn = {
        periodKey: '24A1',
        vatDueSales: 10000,
        vatDueAcquisitions: 0,
        totalVatDue: 10000,
        vatReclaimedCurrPeriod: 3000,
        netVatDue: 7000,
        totalValueSalesExVAT: 50000,
        totalValuePurchasesExVAT: 15000,
        totalValueGoodsSuppliedExVAT: 0,
        totalAcquisitionsExVAT: 0,
        finalised: true,
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockReturn,
      } as Response);

      const vatReturn = await client.getVATReturn('24A1');

      expect(vatReturn.periodKey).toBe('24A1');
      expect(vatReturn.netVatDue).toBe(7000);
      expect(vatReturn.finalised).toBe(true);
    });
  });

  describe('submitVATReturn', () => {
    it('should submit VAT return successfully', async () => {
      const period: VATPeriod = {
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        deadline: '2024-05-08',
        quarter: '2024-Q1',
      };

      const vatReturn: VATReturn = {
        period,
        box1_vatDueOnSales: 10000,
        box2_vatDueOnECAcquisitions: 0,
        box3_totalVATDue: 10000,
        box4_vatReclaimedOnPurchases: 3000,
        box5_netVATDue: 7000,
        box6_totalValueSalesExVAT: 50000,
        box7_totalValuePurchasesExVAT: 15000,
        box8_totalValueECSales: 0,
        box9_totalValueECPurchases: 0,
        generatedAt: '2024-05-01T10:00:00Z',
        status: 'draft',
      };

      const mockResponse = {
        processingDate: '2024-05-01T10:30:00Z',
        paymentIndicator: 'DD',
        formBundleNumber: 'ABC123456789',
        chargeRefNumber: 'XYZ987654321',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const response = await client.submitVATReturn(vatReturn, '24A1');

      expect(response.formBundleNumber).toBe('ABC123456789');
      expect(response.processingDate).toBe('2024-05-01T10:30:00Z');
    });

    it('should handle submission errors', async () => {
      const period: VATPeriod = {
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        deadline: '2024-05-08',
        quarter: '2024-Q1',
      };

      const vatReturn: VATReturn = {
        period,
        box1_vatDueOnSales: 10000,
        box2_vatDueOnECAcquisitions: 0,
        box3_totalVATDue: 10000,
        box4_vatReclaimedOnPurchases: 3000,
        box5_netVATDue: 7000,
        box6_totalValueSalesExVAT: 50000,
        box7_totalValuePurchasesExVAT: 15000,
        box8_totalValueECSales: 0,
        box9_totalValueECPurchases: 0,
        generatedAt: '2024-05-01T10:00:00Z',
        status: 'draft',
      };

      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          errors: [
            { code: 'INVALID_REQUEST', message: 'Invalid period key' },
          ],
        }),
      } as Response);

      await expect(client.submitVATReturn(vatReturn, 'INVALID')).rejects.toThrow(HMRCAPIError);
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ obligations: [] }),
      } as Response);

      const result = await client.testConnection();
      expect(result).toBe(true);
    });

    it('should return false for failed connection', async () => {
      (global.fetch as jest.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ errors: [{ code: 'UNAUTHORIZED', message: 'Invalid token' }] }),
      } as Response);

      const result = await client.testConnection();
      expect(result).toBe(false);
    });
  });
});

describe('HMRCAPIError', () => {
  it('should parse HMRC error response', () => {
    const errorResponse = {
      errors: [
        { code: 'INVALID_REQUEST', message: 'Invalid VAT return data' },
        { code: 'BUSINESS_ERROR', message: 'Period already submitted' },
      ],
    };

    const error = new HMRCAPIError(400, errorResponse);

    expect(error.statusCode).toBe(400);
    expect(error.hmrcErrors).toHaveLength(2);
    expect(error.message).toContain('INVALID_REQUEST');
    expect(error.message).toContain('BUSINESS_ERROR');
  });

  it('should identify auth errors', () => {
    const error401 = new HMRCAPIError(401, { errors: [{ code: 'UNAUTHORIZED', message: 'Invalid token' }] });
    const error403 = new HMRCAPIError(403, { errors: [{ code: 'FORBIDDEN', message: 'Access denied' }] });

    expect(error401.isAuthError()).toBe(true);
    expect(error403.isAuthError()).toBe(true);
  });

  it('should identify bad request errors', () => {
    const error = new HMRCAPIError(400, { errors: [{ code: 'BAD_REQUEST', message: 'Invalid input' }] });
    expect(error.isBadRequest()).toBe(true);
  });

  it('should identify rate limit errors', () => {
    const error = new HMRCAPIError(429, { errors: [{ code: 'RATE_LIMIT', message: 'Too many requests' }] });
    expect(error.isRateLimited()).toBe(true);
  });

  it('should identify server errors', () => {
    const error500 = new HMRCAPIError(500, { errors: [{ code: 'SERVER_ERROR', message: 'Internal error' }] });
    const error503 = new HMRCAPIError(503, { errors: [{ code: 'UNAVAILABLE', message: 'Service unavailable' }] });

    expect(error500.isServerError()).toBe(true);
    expect(error503.isServerError()).toBe(true);
  });
});

describe('Period Key Helpers', () => {
  describe('parsePeriodKey', () => {
    it('should parse valid period key', () => {
      const result = parsePeriodKey('24A1');

      expect(result.year).toBe('2024');
      expect(result.quarter).toBe(1);
    });

    it('should parse different quarters', () => {
      expect(parsePeriodKey('24A2').quarter).toBe(2);
      expect(parsePeriodKey('24A3').quarter).toBe(3);
      expect(parsePeriodKey('24A4').quarter).toBe(4);
    });

    it('should throw error for invalid format', () => {
      expect(() => parsePeriodKey('INVALID')).toThrow('Invalid period key format');
    });
  });

  describe('generatePeriodKey', () => {
    it('should generate valid period key', () => {
      const periodKey = generatePeriodKey(2024, 1);
      expect(periodKey).toBe('24A1');
    });

    it('should handle different years and quarters', () => {
      expect(generatePeriodKey(2024, 2)).toBe('24A2');
      expect(generatePeriodKey(2025, 3)).toBe('25A3');
      expect(generatePeriodKey(2023, 4)).toBe('23A4');
    });
  });
});
