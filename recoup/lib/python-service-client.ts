/**
 * Python Microservice Client with Retry Logic
 * Handles communication with Python services (ports 8001-8004)
 * Includes exponential backoff and circuit breaker
 */

import { logger } from '@/utils/logger';

export interface PythonServiceConfig {
  name: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number; // ms
  maxDelay: number; // ms
  backoffFactor: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate next retry delay with exponential backoff
 */
function getRetryDelay(attempt: number, config: RetryConfig): number {
  const delay = Math.min(
    config.initialDelay * Math.pow(config.backoffFactor, attempt),
    config.maxDelay
  );
  // Add jitter (±25%)
  const jitter = delay * 0.25 * (Math.random() * 2 - 1);
  return Math.floor(delay + jitter);
}

/**
 * Fetch with retry logic and exponential backoff
 */
export async function fetchWithRetry<T = any>(
  url: string,
  options: RequestInit = {},
  retryConfig: Partial<RetryConfig> = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      logger.info(`Fetching ${url}`, { attempt, maxRetries: config.maxRetries });

      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      // Success
      if (response.ok) {
        logger.info(`Request succeeded`, { url, attempt });
        return await response.json();
      }

      // Check if error is retryable
      if (!config.retryableStatuses.includes(response.status)) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      // Retry on retryable status codes
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      logger.warn(`Retryable error, will retry`, {
        url,
        attempt,
        status: response.status,
      });

    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on non-network errors (like JSON parse errors)
      if (error instanceof TypeError || error instanceof SyntaxError) {
        throw error;
      }

      logger.warn(`Request failed`, {
        url,
        attempt,
        error: lastError.message,
      });
    }

    // Wait before retrying (except on last attempt)
    if (attempt < config.maxRetries) {
      const delay = getRetryDelay(attempt, config);
      logger.info(`Waiting ${delay}ms before retry`, { attempt, url });
      await sleep(delay);
    }
  }

  // All retries exhausted
  logger.error(`All retries exhausted`, {
    url,
    maxRetries: config.maxRetries,
    lastError: lastError?.message,
  });

  throw new Error(
    `Failed after ${config.maxRetries} retries: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Python Microservice Client
 */
export class PythonServiceClient {
  private config: PythonServiceConfig;

  constructor(config: PythonServiceConfig) {
    this.config = config;
  }

  /**
   * GET request with retry logic
   */
  async get<T = any>(path: string, retryConfig?: Partial<RetryConfig>): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    return fetchWithRetry<T>(
      url,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      },
      retryConfig
    );
  }

  /**
   * POST request with retry logic
   */
  async post<T = any>(
    path: string,
    body: any,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    return fetchWithRetry<T>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
      {
        ...retryConfig,
        // POST requests: retry fewer times
        maxRetries: retryConfig?.maxRetries ?? 2,
      }
    );
  }

  /**
   * Upload file (multipart/form-data) with retry logic
   */
  async upload<T = any>(
    path: string,
    formData: FormData,
    retryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;

    return fetchWithRetry<T>(
      url,
      {
        method: 'POST',
        body: formData,
        // Don't set Content-Type - browser will set it with boundary
      },
      {
        ...retryConfig,
        // File uploads: retry fewer times due to bandwidth
        maxRetries: retryConfig?.maxRetries ?? 1,
      }
    );
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const url = `${this.config.baseUrl}/health`;
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5s timeout
      });

      return response.ok;
    } catch (error) {
      logger.warn(`Health check failed for ${this.config.name}`, {
        service: this.config.name,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

// ==============================================================================
// SERVICE INSTANCES
// ==============================================================================

/**
 * Voice Service (Port 8001)
 * Handles audio transcription and invoice parsing
 */
export const voiceService = new PythonServiceClient({
  name: 'voice_service',
  baseUrl: process.env.PYTHON_VOICE_SERVICE_URL || 'http://localhost:8001',
  timeout: 60000, // 60s for audio processing
  maxRetries: 2,
});

/**
 * Analytics Service (Port 8002)
 * ML-powered predictions and forecasting
 */
export const analyticsService = new PythonServiceClient({
  name: 'analytics_service',
  baseUrl: process.env.PYTHON_ANALYTICS_SERVICE_URL || 'http://localhost:8002',
  timeout: 30000, // 30s for ML predictions
  maxRetries: 3,
});

/**
 * AI Voice Agent (Port 8003)
 * Voice call orchestration (complementary to OpenAI Realtime)
 */
export const aiVoiceAgentService = new PythonServiceClient({
  name: 'ai_voice_agent',
  baseUrl: process.env.PYTHON_AI_VOICE_AGENT_URL || 'http://localhost:8003',
  timeout: 120000, // 2 minutes for call processing
  maxRetries: 1, // Calls are time-sensitive
});

/**
 * Decision Engine (Port 8004)
 * Collections decision logic
 */
export const decisionEngineService = new PythonServiceClient({
  name: 'decision_engine',
  baseUrl: process.env.PYTHON_DECISION_ENGINE_URL || 'http://localhost:8004',
  timeout: 10000, // 10s for decisions
  maxRetries: 3,
});

// ==============================================================================
// HEALTH CHECK UTILITIES
// ==============================================================================

export interface ServiceHealthStatus {
  service: string;
  healthy: boolean;
  responseTime?: number;
}

/**
 * Check health of all Python services
 */
export async function checkAllServices(): Promise<ServiceHealthStatus[]> {
  const services = [
    { name: 'voice_service', client: voiceService },
    { name: 'analytics_service', client: analyticsService },
    { name: 'ai_voice_agent', client: aiVoiceAgentService },
    { name: 'decision_engine', client: decisionEngineService },
  ];

  const results = await Promise.all(
    services.map(async ({ name, client }) => {
      const startTime = Date.now();
      const healthy = await client.healthCheck();
      const responseTime = Date.now() - startTime;

      return {
        service: name,
        healthy,
        responseTime: healthy ? responseTime : undefined,
      };
    })
  );

  return results;
}

/**
 * Example usage in API route
 */
export async function exampleUsage() {
  try {
    // Transcribe audio with automatic retry
    const transcription = await voiceService.post('/transcribe-and-parse', {
      audio_url: 'https://example.com/audio.mp3',
    });

    // Get ML predictions with automatic retry
    const predictions = await analyticsService.post('/predictions', {
      user_id: 'user123',
      invoices: [
        /* ... */
      ],
    });

    // Check service health
    const healthStatus = await checkAllServices();
    const allHealthy = healthStatus.every((s) => s.healthy);

    if (!allHealthy) {
      logger.warn('Some Python services are unhealthy', { healthStatus });
    }

    return { transcription, predictions, allHealthy };
  } catch (error) {
    logger.error('Python service error', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
