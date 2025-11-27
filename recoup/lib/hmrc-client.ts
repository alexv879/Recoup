/**
 * HMRC API Client (MTD - Making Tax Digital)
 * IMPORTANT: This is STUBBED and ready for activation when HMRC approves the app
 *
 * Status: ⏳ Awaiting HMRC Production Approval
 * Sandbox testing: Ready
 * Production: Inactive (feature flagged)
 *
 * HMRC Developer Hub: https://developer.service.hmrc.gov.uk/
 */

const HMRC_SANDBOX_URL = 'https://test-api.service.hmrc.gov.uk';
const HMRC_PRODUCTION_URL = 'https://api.service.hmrc.gov.uk';

const HMRC_CLIENT_ID = process.env.HMRC_CLIENT_ID || '';
const HMRC_CLIENT_SECRET = process.env.HMRC_CLIENT_SECRET || '';
const HMRC_REDIRECT_URI =
  process.env.HMRC_REDIRECT_URI || 'http://localhost:3000/api/mtd/callback';

export class HMRCClient {
  private baseUrl: string;
  private useSandbox: boolean;

  constructor(useSandbox: boolean = true) {
    this.useSandbox = useSandbox;
    this.baseUrl = useSandbox ? HMRC_SANDBOX_URL : HMRC_PRODUCTION_URL;
  }

  /**
   * Generate OAuth authorization URL for user to authorize access
   * @param state - CSRF protection token (store this to validate callback)
   * @param scopes - Requested scopes
   */
  getAuthorizationUrl(state: string, scopes: string[]): string {
    const params = new URLSearchParams({
      client_id: HMRC_CLIENT_ID,
      response_type: 'code',
      scope: scopes.join(' '),
      redirect_uri: HMRC_REDIRECT_URI,
      state,
    });

    return `${this.baseUrl}/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    scope: string;
  }> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: HMRC_CLIENT_ID,
        client_secret: HMRC_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: HMRC_REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HMRC token exchange failed:', error);
      throw new Error('Failed to exchange authorization code');
    }

    return response.json();
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
  }> {
    const response = await fetch(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: HMRC_CLIENT_ID,
        client_secret: HMRC_CLIENT_SECRET,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HMRC token refresh failed:', error);
      throw new Error('Failed to refresh token');
    }

    return response.json();
  }

  /**
   * Get VAT obligations for a VRN (VAT Registration Number)
   */
  async getVATObligations(
    vrn: string,
    accessToken: string,
    params?: {
      from?: string; // YYYY-MM-DD
      to?: string; // YYYY-MM-DD
      status?: 'O' | 'F'; // O=Open, F=Fulfilled
    }
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.status) queryParams.append('status', params.status);

    return this.makeAuthenticatedRequest(
      `/organisations/vat/${vrn}/obligations?${queryParams.toString()}`,
      accessToken
    );
  }

  /**
   * Submit VAT return
   */
  async submitVATReturn(
    vrn: string,
    periodKey: string,
    vatReturn: {
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
    },
    accessToken: string,
    fraudHeaders: Record<string, string>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(
      `/organisations/vat/${vrn}/returns`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify({
          periodKey,
          ...vatReturn,
        }),
        headers: {
          ...fraudHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Get Self Assessment obligations (Income Tax)
   */
  async getSelfAssessmentObligations(
    nino: string,
    accessToken: string,
    params?: {
      from?: string;
      to?: string;
    }
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);

    return this.makeAuthenticatedRequest(
      `/individuals/self-assessment/obligations/${nino}?${queryParams.toString()}`,
      accessToken
    );
  }

  /**
   * Submit Self Assessment quarterly update
   */
  async submitQuarterlyUpdate(
    nino: string,
    taxYear: string,
    businessId: string,
    update: {
      incomes: {
        turnover: number;
        other: number;
      };
      expenses: {
        costOfGoods: number;
        constructionIndustryScheme: number;
        staffCosts: number;
        travelCosts: number;
        premisesRunningCosts: number;
        maintenanceCosts: number;
        adminCosts: number;
        advertisingCosts: number;
        interest: number;
        financialCharges: number;
        badDebt: number;
        professionalFees: number;
        depreciation: number;
        other: number;
      };
    },
    accessToken: string,
    fraudHeaders: Record<string, string>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(
      `/individuals/business/details/${nino}/income-source/${businessId}/${taxYear}`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(update),
        headers: {
          ...fraudHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Submit annual declaration (End of period statement)
   */
  async submitAnnualDeclaration(
    nino: string,
    taxYear: string,
    declaration: {
      start: string; // YYYY-MM-DD
      end: string; // YYYY-MM-DD
      finalised: boolean;
    },
    accessToken: string,
    fraudHeaders: Record<string, string>
  ): Promise<any> {
    return this.makeAuthenticatedRequest(
      `/individuals/self-assessment/annual-declaration/${nino}/${taxYear}`,
      accessToken,
      {
        method: 'POST',
        body: JSON.stringify(declaration),
        headers: {
          ...fraudHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }

  /**
   * Make authenticated API request to HMRC
   */
  private async makeAuthenticatedRequest(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.hmrc.1.0+json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('HMRC API request failed:', {
        endpoint,
        status: response.status,
        error,
      });
      throw new Error(`HMRC API error: ${response.status}`);
    }

    return response.json();
  }
}

/**
 * Generate fraud prevention headers (REQUIRED by HMRC)
 * See: https://developer.service.hmrc.gov.uk/guides/fraud-prevention/
 *
 * These headers must be sent with every MTD API request
 */
export function generateFraudPreventionHeaders(
  req: Request
): Record<string, string> {
  const headers: Record<string, string> = {};

  // Connection method (always WEB_APP_VIA_SERVER for our architecture)
  headers['Gov-Client-Connection-Method'] = 'WEB_APP_VIA_SERVER';

  // Public IP (from request headers)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || '127.0.0.1';
  headers['Gov-Client-Public-IP'] = ip;

  // User agent
  const userAgent = req.headers.get('user-agent') || 'Unknown';
  headers['Gov-Client-User-Agent'] = userAgent;

  // Timezone (should come from user profile, default to UK)
  headers['Gov-Client-Timezone'] = 'UTC+00:00';

  // Local IPs (server IPs - get actual server IPs in production)
  headers['Gov-Client-Local-IPs'] = '10.0.0.1';

  // Device ID (persistent identifier per user)
  headers['Gov-Client-Device-ID'] = 'recoup-web-app';

  // Screens (for web apps, report as 1 screen)
  headers['Gov-Client-Screens'] = '1';

  // Window size (from user agent or default)
  headers['Gov-Client-Window-Size'] = '1920x1080';

  // Timestamp
  headers['Gov-Client-Request-Timestamp'] = new Date().toISOString();

  // Vendor version (Recoup version)
  headers['Gov-Vendor-Version'] = 'Recoup=1.0.0';

  // Vendor product name
  headers['Gov-Vendor-Product-Name'] = 'Recoup';

  return headers;
}

/**
 * Check if MTD features are enabled for user
 * @param userId - User ID
 * @returns Boolean indicating if MTD is enabled
 */
export async function isMTDEnabled(userId: string): Promise<boolean> {
  // TODO: Check user.mtdEnabled flag in database
  // For now, return false (feature flagged off)
  return false;
}
