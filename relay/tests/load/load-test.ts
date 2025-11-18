/**
 * Load Testing Script for Recoup API
 *
 * Tests various API endpoints under load to identify performance bottlenecks
 *
 * Usage:
 *   npm run load-test
 *   npm run load-test -- --endpoint=/api/dashboard/summary --concurrent=50
 */

import https from 'https';
import http from 'http';

interface LoadTestConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  concurrent: number;
  requests: number;
  headers?: Record<string, string>;
  body?: any;
}

interface LoadTestResult {
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  avgResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  p50: number;
  p95: number;
  p99: number;
  requestsPerSecond: number;
  duration: number;
  errors: Record<string, number>;
}

/**
 * Run load test for a single endpoint
 */
async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  console.log(`\n🚀 Starting load test for ${config.endpoint}`);
  console.log(`   Concurrent requests: ${config.concurrent}`);
  console.log(`   Total requests: ${config.requests}`);

  const results: Array<{
    success: boolean;
    duration: number;
    statusCode?: number;
    error?: string;
  }> = [];

  const startTime = Date.now();

  // Run requests in batches
  const batchSize = config.concurrent;
  const batches = Math.ceil(config.requests / batchSize);

  for (let batch = 0; batch < batches; batch++) {
    const batchStart = batch * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, config.requests);
    const batchRequests: Promise<void>[] = [];

    for (let i = batchStart; i < batchEnd; i++) {
      batchRequests.push(
        makeRequest(config).then((result) => {
          results.push(result);
          // Progress indicator
          if (results.length % 100 === 0) {
            process.stdout.write(
              `\r   Progress: ${results.length}/${config.requests} requests`
            );
          }
        })
      );
    }

    await Promise.all(batchRequests);
  }

  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`\n✅ Load test completed in ${duration}ms`);

  // Calculate statistics
  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  const durations = successful.map((r) => r.duration).sort((a, b) => a - b);

  const avgResponseTime =
    durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

  const errors: Record<string, number> = {};
  failed.forEach((r) => {
    const errorKey = r.error || 'Unknown error';
    errors[errorKey] = (errors[errorKey] || 0) + 1;
  });

  return {
    endpoint: config.endpoint,
    totalRequests: config.requests,
    successfulRequests: successful.length,
    failedRequests: failed.length,
    avgResponseTime: Math.round(avgResponseTime),
    minResponseTime: durations[0] || 0,
    maxResponseTime: durations[durations.length - 1] || 0,
    p50: durations[Math.floor(durations.length * 0.5)] || 0,
    p95: durations[Math.floor(durations.length * 0.95)] || 0,
    p99: durations[Math.floor(durations.length * 0.99)] || 0,
    requestsPerSecond: Math.round((config.requests / duration) * 1000),
    duration,
    errors,
  };
}

/**
 * Make a single HTTP request
 */
async function makeRequest(config: LoadTestConfig): Promise<{
  success: boolean;
  duration: number;
  statusCode?: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const startTime = Date.now();

    const url = new URL(
      config.endpoint,
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    );

    const options = {
      method: config.method,
      headers: config.headers || {},
    };

    const protocol = url.protocol === 'https:' ? https : http;

    const req = protocol.request(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        const duration = Date.now() - startTime;
        const success = res.statusCode! >= 200 && res.statusCode! < 300;

        resolve({
          success,
          duration,
          statusCode: res.statusCode,
          error: success ? undefined : `HTTP ${res.statusCode}`,
        });
      });
    });

    req.on('error', (error) => {
      const duration = Date.now() - startTime;
      resolve({
        success: false,
        duration,
        error: error.message,
      });
    });

    if (config.body) {
      req.write(JSON.stringify(config.body));
    }

    req.end();
  });
}

/**
 * Print load test results
 */
function printResults(result: LoadTestResult) {
  console.log('\n📊 Load Test Results');
  console.log('═'.repeat(60));
  console.log(`Endpoint: ${result.endpoint}`);
  console.log(`Total Requests: ${result.totalRequests}`);
  console.log(`Successful: ${result.successfulRequests}`);
  console.log(`Failed: ${result.failedRequests}`);
  console.log(
    `Success Rate: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%`
  );
  console.log('─'.repeat(60));
  console.log('Response Times (ms):');
  console.log(`  Average: ${result.avgResponseTime}ms`);
  console.log(`  Min: ${result.minResponseTime}ms`);
  console.log(`  Max: ${result.maxResponseTime}ms`);
  console.log(`  p50: ${result.p50}ms`);
  console.log(`  p95: ${result.p95}ms`);
  console.log(`  p99: ${result.p99}ms`);
  console.log('─'.repeat(60));
  console.log(`Throughput: ${result.requestsPerSecond} req/s`);
  console.log(`Total Duration: ${result.duration}ms`);

  if (Object.keys(result.errors).length > 0) {
    console.log('─'.repeat(60));
    console.log('Errors:');
    Object.entries(result.errors).forEach(([error, count]) => {
      console.log(`  ${error}: ${count}`);
    });
  }
  console.log('═'.repeat(60));

  // Performance assessment
  if (result.p95 < 200) {
    console.log('✅ EXCELLENT: p95 response time < 200ms');
  } else if (result.p95 < 500) {
    console.log('⚠️  GOOD: p95 response time < 500ms');
  } else if (result.p95 < 1000) {
    console.log('⚠️  FAIR: p95 response time < 1000ms (needs optimization)');
  } else {
    console.log('❌ POOR: p95 response time > 1000ms (critical optimization needed)');
  }
}

/**
 * Main load test suite
 */
async function main() {
  const args = process.argv.slice(2);
  const endpoint = args.find((arg) => arg.startsWith('--endpoint='))?.split('=')[1];
  const concurrent = parseInt(
    args.find((arg) => arg.startsWith('--concurrent='))?.split('=')[1] || '10'
  );
  const requests = parseInt(
    args.find((arg) => arg.startsWith('--requests='))?.split('=')[1] || '100'
  );

  // Test scenarios
  const scenarios: LoadTestConfig[] = endpoint
    ? [
        {
          endpoint,
          method: 'GET',
          concurrent,
          requests,
        },
      ]
    : [
        {
          endpoint: '/api/dashboard/summary',
          method: 'GET',
          concurrent: 20,
          requests: 200,
        },
        {
          endpoint: '/api/dashboard/charts?type=revenue&period=12m',
          method: 'GET',
          concurrent: 20,
          requests: 200,
        },
        {
          endpoint: '/api/dashboard/metrics',
          method: 'GET',
          concurrent: 20,
          requests: 200,
        },
      ];

  console.log('🔥 Recoup Load Testing Suite');
  console.log('═'.repeat(60));

  const results: LoadTestResult[] = [];

  for (const scenario of scenarios) {
    const result = await runLoadTest(scenario);
    results.push(result);
    printResults(result);

    // Wait between tests
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  // Summary
  console.log('\n📈 Overall Summary');
  console.log('═'.repeat(60));

  const totalRequests = results.reduce((sum, r) => sum + r.totalRequests, 0);
  const totalSuccessful = results.reduce((sum, r) => sum + r.successfulRequests, 0);
  const avgP95 =
    results.reduce((sum, r) => sum + r.p95, 0) / results.length;

  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Total Successful: ${totalSuccessful}`);
  console.log(
    `Overall Success Rate: ${((totalSuccessful / totalRequests) * 100).toFixed(2)}%`
  );
  console.log(`Average p95 Response Time: ${Math.round(avgP95)}ms`);

  if (avgP95 < 200) {
    console.log('✅ System performance: EXCELLENT');
  } else if (avgP95 < 500) {
    console.log('✅ System performance: GOOD');
  } else {
    console.log('⚠️  System performance: NEEDS IMPROVEMENT');
  }
}

// Run tests
main().catch((error) => {
  console.error('Load test failed:', error);
  process.exit(1);
});
