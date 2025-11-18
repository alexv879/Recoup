# Load Testing for Recoup

## Overview

This directory contains load testing scripts to measure and benchmark the performance of Recoup API endpoints.

## Prerequisites

```bash
npm install
```

## Running Load Tests

### Basic Test (All endpoints)
```bash
npm run load-test
```

### Test Specific Endpoint
```bash
npm run load-test -- --endpoint=/api/dashboard/summary --concurrent=50 --requests=500
```

### Predefined Scenarios

```bash
# Dashboard summary (50 concurrent, 500 total requests)
npm run load-test:dashboard

# Analytics charts (30 concurrent, 300 total requests)
npm run load-test:analytics

# Heavy load test (100 concurrent, 1000 total requests)
npm run load-test:heavy
```

## Custom Parameters

```bash
npm run load-test -- \
  --endpoint=/api/your-endpoint \
  --concurrent=20 \
  --requests=200
```

## Performance Targets

- **Excellent**: p95 < 200ms
- **Good**: p95 < 500ms
- **Fair**: p95 < 1000ms
- **Poor**: p95 > 1000ms

## Metrics Collected

- **Response Times**: avg, min, max, p50, p95, p99
- **Throughput**: requests per second
- **Success Rate**: percentage of successful requests
- **Errors**: breakdown of error types

## Interpreting Results

### Response Time Percentiles

- **p50 (median)**: Half of requests complete faster than this
- **p95**: 95% of requests complete faster than this (most important for SLAs)
- **p99**: 99% of requests complete faster than this (worst-case scenarios)

### Example Output

```
📊 Load Test Results
════════════════════════════════════════════════════════════
Endpoint: /api/dashboard/summary
Total Requests: 500
Successful: 498
Failed: 2
Success Rate: 99.60%
────────────────────────────────────────────────────────────
Response Times (ms):
  Average: 145ms
  Min: 42ms
  Max: 387ms
  p50: 132ms
  p95: 198ms
  p99: 285ms
────────────────────────────────────────────────────────────
Throughput: 45 req/s
Total Duration: 11234ms
════════════════════════════════════════════════════════════
✅ EXCELLENT: p95 response time < 200ms
```

## Continuous Monitoring

Run load tests before and after performance optimizations to measure impact:

1. **Baseline**: Run tests before changes
2. **Optimize**: Apply performance improvements
3. **Validate**: Run tests again to confirm improvements
4. **Compare**: Calculate % improvement in key metrics

## Best Practices

1. **Test in Staging**: Don't run heavy load tests against production
2. **Warm Up**: Run a small test first to warm caches
3. **Monitor Resources**: Watch CPU, memory, and database metrics
4. **Gradual Ramp**: Start with low concurrency, increase gradually
5. **Realistic Data**: Use production-like data volumes

## Integration with CI/CD

Add performance regression tests to your CI pipeline:

```yaml
# .github/workflows/performance-test.yml
- name: Run Load Tests
  run: |
    cd relay/tests/load
    npm install
    npm run load-test
```

## Troubleshooting

### High Error Rates
- Check rate limiting configuration
- Verify authentication tokens
- Review server logs for errors

### Slow Response Times
- Check database query performance
- Review cache hit rates
- Monitor external API latencies

### Connection Timeouts
- Increase timeout values
- Check network connectivity
- Verify server capacity
