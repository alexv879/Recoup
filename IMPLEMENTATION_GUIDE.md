# Performance Optimization Implementation Guide

This guide provides step-by-step instructions for deploying the performance optimizations.

## Prerequisites

- Upstash Redis account (free tier available)
- Firebase project with Firestore
- Sentry account (already configured)

## Step 1: Configure Redis

1. **Create Upstash Redis Instance**
   - Go to https://console.upstash.com/
   - Create new database (free tier works)
   - Copy REST URL and REST TOKEN

2. **Add Environment Variables**
   ```bash
   # Add to .env.local and Vercel
   UPSTASH_REDIS_REST_URL=https://your-instance.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your_token_here
   ```

3. **Deploy to Vercel**
   ```bash
   vercel env add UPSTASH_REDIS_REST_URL
   vercel env add UPSTASH_REDIS_REST_TOKEN
   ```

## Step 2: Deploy Firestore Indexes

```bash
cd relay
firebase deploy --only firestore:indexes
```

⏱️ **Note:** Index deployment can take 10-30 minutes depending on existing data size.

## Step 3: Install Dependencies (Already in package.json)

The following packages are already installed:
- `@upstash/redis`: ^1.35.6
- `@upstash/ratelimit`: ^2.0.7
- `pino`: ^10.1.0

No additional installation needed.

## Step 4: Test Caching

```bash
# Start dev server
npm run dev

# Test dashboard endpoint
curl http://localhost:3000/api/dashboard/summary \
  -H "Authorization: Bearer YOUR_TOKEN"

# Check logs for cache hit/miss
# Look for: "redis-cache-hit" or "redis-cache-miss"
```

## Step 5: Run Load Tests

```bash
# Build the project first
npm run build

# Run load tests
npm run test:load -- --scenario=dashboard --load=light --url=http://localhost:3000

# Test with auth token
npm run test:load -- --scenario=full --load=medium --token=YOUR_AUTH_TOKEN
```

## Step 6: Configure Sentry Alerts

1. Go to Sentry → Alerts
2. Create new alert rule:
   - **Metric:** Custom Metric
   - **Filter:** `type:slow_query`
   - **Threshold:** > 10 events in 1 hour
   - **Action:** Send email to team

3. Create API error alert:
   - **Metric:** Error Rate
   - **Threshold:** > 1% in 5 minutes
   - **Action:** Slack notification + email

## Step 7: Monitor Performance

### View Cache Statistics

```typescript
import { getCacheStats } from '@/lib/redis';

const stats = await getCacheStats();
console.log(`Cache size: ${stats.size} keys`);
```

### Check Logs

```bash
# View logs in Vercel dashboard
vercel logs YOUR_DEPLOYMENT_URL --follow

# Filter for slow queries
vercel logs YOUR_DEPLOYMENT_URL | grep "slow"
```

### Sentry Performance Tab

1. Go to Sentry → Performance
2. Check transaction traces for:
   - `analytics.getInvoiceStats`
   - `analytics.getTopUsers`
   - `dashboard.summary`

## Step 8: Cache Invalidation

Integrate cache invalidation when data changes:

```typescript
import { invalidateUserCache } from '@/services/analyticsService';

// When invoice is created/updated
async function updateInvoice(userId: string, invoiceData: any) {
  // Update invoice
  await db.collection('invoices').doc(id).update(invoiceData);

  // Invalidate cache
  await invalidateUserCache(userId);
}
```

## Frontend Optimizations (Recommended Next Steps)

### 1. Add React.memo to Components

```typescript
import { memo } from 'react';

// Before
export function DashboardCard({ data }) {
  return <div>...</div>;
}

// After
export const DashboardCard = memo(function DashboardCard({ data }) {
  return <div>...</div>;
});
```

### 2. Implement Virtual Scrolling

```bash
npm install react-window
```

```typescript
import { FixedSizeList } from 'react-window';

function InvoiceTable({ invoices }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      {invoices[index].invoiceNumber}
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={invoices.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

### 3. Add Code Splitting

```typescript
import dynamic from 'next/dynamic';

// Lazy load heavy components
const DashboardCharts = dynamic(() => import('@/components/DashboardCharts'), {
  loading: () => <Skeleton />,
});
```

### 4. Add Skeleton Screens

```typescript
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
      <div className="h-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
    </div>
  );
}

// Use with Suspense
<Suspense fallback={<DashboardSkeleton />}>
  <DashboardContent />
</Suspense>
```

## Rollback Plan

If issues occur:

1. **Disable Caching**
   ```bash
   # Remove Redis env vars from Vercel
   vercel env rm UPSTASH_REDIS_REST_URL
   vercel env rm UPSTASH_REDIS_REST_TOKEN
   ```

2. **Revert Code Changes**
   ```bash
   git revert HEAD
   git push
   ```

3. **Use Old Analytics Service**
   ```bash
   mv relay/services/analyticsService.old.ts relay/services/analyticsService.ts
   git commit -am "Rollback to old analytics service"
   ```

## Performance Monitoring Checklist

Daily:
- [ ] Check Sentry for slow query alerts
- [ ] Monitor API error rates
- [ ] Review cache hit rates

Weekly:
- [ ] Run load tests
- [ ] Analyze slow endpoints
- [ ] Review and optimize cache TTLs

Monthly:
- [ ] Audit Firestore indexes
- [ ] Review database query patterns
- [ ] Capacity planning

## Troubleshooting

### Cache Not Working

1. Check Redis credentials:
   ```bash
   vercel env ls
   ```

2. Test Redis connection:
   ```typescript
   import { redis } from '@/lib/redis';
   const result = await redis.ping();
   console.log(result); // Should return "PONG"
   ```

### Slow Queries Still Occurring

1. Check if indexes are deployed:
   ```bash
   firebase firestore:indexes
   ```

2. Verify composite index usage in Firestore console

3. Check query patterns in Sentry

### High Memory Usage

1. Check CSV exports are using streaming
2. Verify cache size isn't growing unbounded
3. Monitor Firestore batch sizes

## Support

For questions or issues:
- Review PERFORMANCE_REPORT.md
- Check inline code comments
- Review Sentry error traces
- Contact team lead

---

**Last Updated:** 2025-11-18
