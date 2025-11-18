/**
 * Multi-Currency Support Service
 * Real-time exchange rates and currency conversion
 */

import { logger } from '@/utils/logger';

export interface CurrencyRate {
  from: string;
  to: string;
  rate: number;
  timestamp: Date;
  source: 'cache' | 'api';
}

export interface ConversionResult {
  fromAmount: number;
  toAmount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  timestamp: Date;
}

export interface SupportedCurrency {
  code: string;
  name: string;
  symbol: string;
  decimalPlaces: number;
  popular: boolean;
}

// Popular currencies for self-employed/freelancers
export const SUPPORTED_CURRENCIES: SupportedCurrency[] = [
  { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, popular: true },
  { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, popular: true },
  { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, popular: true },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2, popular: true },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, popular: true },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$', decimalPlaces: 2, popular: false },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, popular: false },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, popular: false },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, popular: false },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr', decimalPlaces: 2, popular: false },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, popular: false },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, popular: false },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2, popular: false },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2, popular: false },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', decimalPlaces: 2, popular: false },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', decimalPlaces: 2, popular: false },
];

// In-memory cache for exchange rates (5-minute TTL)
const rateCache = new Map<string, { rate: number; timestamp: Date }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get exchange rate between two currencies
 * Uses free exchangerate-api.com API (1,500 requests/month on free tier)
 */
export async function getExchangeRate(params: {
  from: string;
  to: string;
  forceRefresh?: boolean;
}): Promise<CurrencyRate> {
  const { from, to, forceRefresh = false } = params;

  // Same currency
  if (from === to) {
    return {
      from,
      to,
      rate: 1.0,
      timestamp: new Date(),
      source: 'cache',
    };
  }

  const cacheKey = `${from}-${to}`;

  // Check cache
  if (!forceRefresh) {
    const cached = rateCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp.getTime() < CACHE_TTL_MS) {
      return {
        from,
        to,
        rate: cached.rate,
        timestamp: cached.timestamp,
        source: 'cache',
      };
    }
  }

  try {
    // Fetch from API
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    const baseUrl = apiKey
      ? `https://v6.exchangerate-api.com/v6/${apiKey}/latest/${from}`
      : `https://open.er-api.com/v6/latest/${from}`; // Free tier fallback

    const response = await fetch(baseUrl, {
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error(`Exchange rate API error: ${data['error-type']}`);
    }

    const rate = data.conversion_rates[to];
    if (!rate) {
      throw new Error(`Currency ${to} not found in exchange rates`);
    }

    // Update cache
    const timestamp = new Date(data.time_last_update_unix * 1000);
    rateCache.set(cacheKey, { rate, timestamp });

    logger.info('Fetched exchange rate', { from, to, rate, source: 'api' });

    return {
      from,
      to,
      rate,
      timestamp,
      source: 'api',
    };
  } catch (error) {
    logger.error('Failed to fetch exchange rate', {
      from,
      to,
      error: error instanceof Error ? error.message : String(error),
    });

    // Try to use stale cache as fallback
    const cached = rateCache.get(cacheKey);
    if (cached) {
      logger.warn('Using stale exchange rate from cache', { from, to });
      return {
        from,
        to,
        rate: cached.rate,
        timestamp: cached.timestamp,
        source: 'cache',
      };
    }

    throw new Error(
      `Failed to get exchange rate for ${from} to ${to}: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Convert amount between currencies
 */
export async function convertCurrency(params: {
  amount: number;
  from: string;
  to: string;
  forceRefresh?: boolean;
}): Promise<ConversionResult> {
  const { amount, from, to, forceRefresh = false } = params;

  const rateData = await getExchangeRate({ from, to, forceRefresh });
  const toAmount = amount * rateData.rate;

  return {
    fromAmount: amount,
    toAmount: Math.round(toAmount * 100) / 100, // Round to 2 decimals
    fromCurrency: from,
    toCurrency: to,
    rate: rateData.rate,
    timestamp: rateData.timestamp,
  };
}

/**
 * Get multiple exchange rates in one call
 */
export async function getBatchExchangeRates(params: {
  base: string;
  targets: string[];
  forceRefresh?: boolean;
}): Promise<CurrencyRate[]> {
  const { base, targets, forceRefresh = false } = params;

  const rates = await Promise.all(
    targets.map((target) =>
      getExchangeRate({ from: base, to: target, forceRefresh })
    )
  );

  return rates;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(params: {
  amount: number;
  currency: string;
  locale?: string;
}): string {
  const { amount, currency, locale = 'en-GB' } = params;

  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);

  if (!currencyInfo) {
    // Fallback formatting
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(amount);
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: currencyInfo.decimalPlaces,
    maximumFractionDigits: currencyInfo.decimalPlaces,
  }).format(amount);
}

/**
 * Get currency symbol
 */
export function getCurrencySymbol(currency: string): string {
  const currencyInfo = SUPPORTED_CURRENCIES.find((c) => c.code === currency);
  return currencyInfo?.symbol || currency;
}

/**
 * Calculate invoice amounts in multiple currencies
 */
export async function calculateMultiCurrencyInvoice(params: {
  baseAmount: number;
  baseCurrency: string;
  targetCurrencies: string[];
}): Promise<{
  base: { amount: number; currency: string; formatted: string };
  conversions: Array<{
    amount: number;
    currency: string;
    formatted: string;
    rate: number;
  }>;
}> {
  const { baseAmount, baseCurrency, targetCurrencies } = params;

  const conversions = await Promise.all(
    targetCurrencies.map(async (targetCurrency) => {
      const result = await convertCurrency({
        amount: baseAmount,
        from: baseCurrency,
        to: targetCurrency,
      });

      return {
        amount: result.toAmount,
        currency: targetCurrency,
        formatted: formatCurrency({
          amount: result.toAmount,
          currency: targetCurrency,
        }),
        rate: result.rate,
      };
    })
  );

  return {
    base: {
      amount: baseAmount,
      currency: baseCurrency,
      formatted: formatCurrency({ amount: baseAmount, currency: baseCurrency }),
    },
    conversions,
  };
}

/**
 * Get historical exchange rates (for reports)
 */
export async function getHistoricalRate(params: {
  from: string;
  to: string;
  date: Date;
}): Promise<CurrencyRate> {
  const { from, to, date } = params;

  try {
    const apiKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!apiKey) {
      throw new Error('Historical rates require API key');
    }

    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const url = `https://v6.exchangerate-api.com/v6/${apiKey}/history/${from}/${dateStr}`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Historical rate API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.result !== 'success') {
      throw new Error(`Historical rate API error: ${data['error-type']}`);
    }

    const rate = data.conversion_rates[to];
    if (!rate) {
      throw new Error(`Currency ${to} not found in historical rates`);
    }

    return {
      from,
      to,
      rate,
      timestamp: new Date(data.time_last_update_unix * 1000),
      source: 'api',
    };
  } catch (error) {
    logger.error('Failed to fetch historical rate', {
      from,
      to,
      date: date.toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

/**
 * Calculate foreign exchange gain/loss for accounting
 */
export async function calculateFXGainLoss(params: {
  invoiceAmount: number;
  invoiceCurrency: string;
  invoiceDate: Date;
  paymentAmount: number;
  paymentCurrency: string;
  paymentDate: Date;
  baseCurrency: string; // User's reporting currency (e.g., GBP)
}): Promise<{
  invoiceValueInBase: number;
  paymentValueInBase: number;
  fxGainLoss: number;
  isGain: boolean;
}> {
  const {
    invoiceAmount,
    invoiceCurrency,
    invoiceDate,
    paymentAmount,
    paymentCurrency,
    paymentDate,
    baseCurrency,
  } = params;

  // Get historical rate at invoice date
  const invoiceRate = await getHistoricalRate({
    from: invoiceCurrency,
    to: baseCurrency,
    date: invoiceDate,
  });

  // Get historical rate at payment date
  const paymentRate = await getHistoricalRate({
    from: paymentCurrency,
    to: baseCurrency,
    date: paymentDate,
  });

  const invoiceValueInBase = invoiceAmount * invoiceRate.rate;
  const paymentValueInBase = paymentAmount * paymentRate.rate;
  const fxGainLoss = paymentValueInBase - invoiceValueInBase;

  return {
    invoiceValueInBase: Math.round(invoiceValueInBase * 100) / 100,
    paymentValueInBase: Math.round(paymentValueInBase * 100) / 100,
    fxGainLoss: Math.round(fxGainLoss * 100) / 100,
    isGain: fxGainLoss > 0,
  };
}

/**
 * Check tier limits for multi-currency
 */
export function checkMultiCurrencyLimit(params: {
  tier: 'free' | 'starter' | 'professional' | 'business';
  currencies: string[];
}): {
  allowed: boolean;
  reason?: string;
  maxCurrencies: number | 'unlimited';
} {
  const limits: Record<string, number | 'unlimited'> = {
    free: 1, // GBP only
    starter: 3,
    professional: 'unlimited',
    business: 'unlimited',
  };

  const maxCurrencies = limits[params.tier];

  if (maxCurrencies === 'unlimited') {
    return { allowed: true, maxCurrencies };
  }

  // Count unique currencies (excluding GBP as base)
  const uniqueCurrencies = new Set(params.currencies.filter((c) => c !== 'GBP'));

  if (uniqueCurrencies.size > maxCurrencies) {
    return {
      allowed: false,
      reason: `Currency limit reached (${maxCurrencies}). Upgrade for more currencies.`,
      maxCurrencies,
    };
  }

  return { allowed: true, maxCurrencies };
}

/**
 * Clear rate cache (useful for testing)
 */
export function clearRateCache(): void {
  rateCache.clear();
  logger.info('Exchange rate cache cleared');
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const entries = Array.from(rateCache.entries()).map(([key, value]) => ({
    key,
    age: Date.now() - value.timestamp.getTime(),
  }));

  return {
    size: rateCache.size,
    entries,
  };
}
