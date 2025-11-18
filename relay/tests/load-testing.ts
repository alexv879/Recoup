/**
 * Load Testing Utilities for Recoup
 *
 * Usage:
 *   npm run test:load -- --scenario=dashboard --users=100
 */

import axios from 'axios';
import { performance } from 'perf_hooks';

interface LoadTestConfig {
  baseUrl: string;
  scenario: 'dashboard' | 'analytics' | 'invoices' | 'full';
  concurrentUsers: number;
  requestsPerUser: number;
  rampUpTime: number; // seconds
  authToken?: string;
}

interface LoadTestResult {
  scenario: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  duration: number;
  errors: Array<{ endpoint: string; error: string; count: number }>;
}

/**
 * Run load test
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  console.log(`Starting load test: ${config.scenario}`);
  console.log(`Concurrent users: ${config.concurrentUsers}`);
  console.log(`Requests per user: ${config.requestsPerUser}`);

  const startTime = performance.now();
  const responseTimes: number[] = [];
  const errors: Map<string, { endpoint: string; error: string; count: number }> = new Map();
  let successfulRequests = 0;
  let failedRequests = 0;

  // Get endpoints for scenario
  const endpoints = getScenarioEndpoints(config.scenario);

  // Create user load
  const userPromises: Promise<void>[] = [];

  for (let i = 0; i < config.concurrentUsers; i++) {
    // Stagger user start times (ramp up)
    const delay = (config.rampUpTime * 1000 * i) / config.concurrentUsers;

    const userPromise = new Promise<void>(async (resolve) => {
      await new Promise((r) => setTimeout(r, delay));

      // Each user makes N requests
      for (let j = 0; j < config.requestsPerUser; j++) {
        const endpoint = endpoints[j % endpoints.length];
        const requestStart = performance.now();

        try {
          const response = await axios.get(`${config.baseUrl}${endpoint}`, {
            headers: config.authToken
              ? { Authorization: `Bearer ${config.authToken}` }
              : {},
            timeout: 30000,
          });

          const requestTime = performance.now() - requestStart;
          responseTimes.push(requestTime);
          successfulRequests++;

          if (response.status !== 200) {
            failedRequests++;
            const key = `${endpoint}:${response.status}`;
            const existing = errors.get(key);
            if (existing) {
              existing.count++;
            } else {
              errors.set(key, {
                endpoint,
                error: `HTTP ${response.status}`,
                count: 1,
              });
            }
          }
        } catch (error: any) {
          const requestTime = performance.now() - requestStart;
          responseTimes.push(requestTime);
          failedRequests++;

          const key = `${endpoint}:${error.message}`;
          const existing = errors.get(key);
          if (existing) {
            existing.count++;
          } else {
            errors.set(key, {
              endpoint,
              error: error.message,
              count: 1,
            });
          }
        }
      }

      resolve();
    });

    userPromises.push(userPromise);
  }

  // Wait for all users to complete
  await Promise.all(userPromises);

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Calculate statistics
  responseTimes.sort((a, b) => a - b);

  const result: LoadTestResult = {
    scenario: config.scenario,
    totalRequests: successfulRequests + failedRequests,
    successfulRequests,
    failedRequests,
    avgResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
    minResponseTime: responseTimes[0] || 0,
    maxResponseTime: responseTimes[responseTimes.length - 1] || 0,
    p50ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.5)] || 0,
    p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)] || 0,
    p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)] || 0,
    requestsPerSecond: (successfulRequests + failedRequests) / (duration / 1000),
    duration: duration,
    errors: Array.from(errors.values()),
  };

  printResults(result);

  return result;
}

/**
 * Get endpoints for a scenario
 */
function getScenarioEndpoints(scenario: string): string[] {
  const scenarios: Record<string, string[]> = {
    dashboard: [
      '/api/dashboard/summary',
      '/api/dashboard/charts',
      '/api/dashboard/metrics',
    ],
    analytics: [
      '/api/dashboard/summary',
      '/api/dashboard/predictions',
      '/api/dashboard/charts',
    ],
    invoices: [
      '/api/invoices',
      '/api/invoices?status=paid',
      '/api/invoices?status=overdue',
    ],
    full: [
      '/api/dashboard/summary',
      '/api/dashboard/charts',
      '/api/dashboard/metrics',
      '/api/dashboard/predictions',
      '/api/invoices',
    ],
  };

  return scenarios[scenario] || scenarios.dashboard;
}

/**
 * Print results to console
 */
function printResults(result: LoadTestResult): void {
  console.log('\n' + '='.repeat(60));
  console.log('LOAD TEST RESULTS');
  console.log('='.repeat(60));
  console.log(`Scenario: ${result.scenario}`);
  console.log(`Duration: ${(result.duration / 1000).toFixed(2)}s`);
  console.log(`\nRequests:`);
  console.log(`  Total: ${result.totalRequests}`);
  console.log(`  Successful: ${result.successfulRequests}`);
  console.log(`  Failed: ${result.failedRequests}`);
  console.log(`  Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`);
  console.log(`\nThroughput:`);
  console.log(`  Requests/second: ${result.requestsPerSecond.toFixed(2)}`);
  console.log(`\nResponse Times (ms):`);
  console.log(`  Average: ${result.avgResponseTime.toFixed(2)}`);
  console.log(`  Min: ${result.minResponseTime.toFixed(2)}`);
  console.log(`  Max: ${result.maxResponseTime.toFixed(2)}`);
  console.log(`  P50: ${result.p50ResponseTime.toFixed(2)}`);
  console.log(`  P95: ${result.p95ResponseTime.toFixed(2)}`);
  console.log(`  P99: ${result.p99ResponseTime.toFixed(2)}`);

  if (result.errors.length > 0) {
    console.log(`\nErrors:`);
    result.errors.forEach((error) => {
      console.log(`  ${error.endpoint}: ${error.error} (${error.count}x)`);
    });
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Pre-defined test scenarios
 */
export const loadTestScenarios = {
  // Light load - normal usage
  light: {
    concurrentUsers: 10,
    requestsPerUser: 5,
    rampUpTime: 5,
  },

  // Medium load - busy period
  medium: {
    concurrentUsers: 50,
    requestsPerUser: 10,
    rampUpTime: 10,
  },

  // Heavy load - peak usage
  heavy: {
    concurrentUsers: 100,
    requestsPerUser: 20,
    rampUpTime: 15,
  },

  // Stress test - beyond capacity
  stress: {
    concurrentUsers: 200,
    requestsPerUser: 50,
    rampUpTime: 20,
  },
};

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const scenario = args.find((a) => a.startsWith('--scenario='))?.split('=')[1] || 'dashboard';
  const loadLevel = args.find((a) => a.startsWith('--load='))?.split('=')[1] || 'light';
  const baseUrl = args.find((a) => a.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000';
  const authToken = args.find((a) => a.startsWith('--token='))?.split('=')[1];

  const loadConfig = loadTestScenarios[loadLevel as keyof typeof loadTestScenarios] || loadTestScenarios.light;

  const config: LoadTestConfig = {
    baseUrl,
    scenario: scenario as any,
    authToken,
    ...loadConfig,
  };

  runLoadTest(config)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Load test failed:', error);
      process.exit(1);
    });
}
