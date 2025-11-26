/**
 * Industry Benchmarks Aggregation Job
 *
 * Scheduled job that aggregates collection outcome data by industry
 * to generate benchmark reports and ML training features.
 *
 * Schedule: Run daily at 2 AM UTC
 * Deployment: Can be triggered via cron job or Vercel/Render scheduled function
 *
 * Output:
 * - industryBenchmarks collection in Firestore
 * - Contains success rates, average days to collect, response rates by industry
 */

import { db } from '@/lib/firebase-admin';
import { logInfo, logError } from '@/utils/logger';
import { INDUSTRIES } from '@/constants/industries';

interface BenchmarkData {
  industryCode: number;
  industryLabel: string;
  totalAttempts: number;
  successfulAttempts: number;
  successRate: number;
  averageDaysToCollect: number;
  averageAmountCollected: number;
  totalAmountCollected: number;
  attemptsByType: {
    [key: string]: {
      count: number;
      successRate: number;
    };
  };
  outcomeDistribution: {
    [key: string]: number;
  };
  lastUpdated: Date;
}

/**
 * Aggregate collection outcomes by industry
 */
export async function aggregateIndustryBenchmarks(): Promise<void> {
  const startTime = Date.now();
  logInfo('Starting industry benchmarks aggregation');

  try {
    // 1. Get all collection outcomes from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const outcomesSnapshot = await db
      .collection('collectionOutcomes')
      .where('timestamp', '>=', ninetyDaysAgo)
      .get();

    if (outcomesSnapshot.empty) {
      logInfo('No collection outcomes found for aggregation');
      return;
    }

    logInfo(`Processing ${outcomesSnapshot.size} collection outcomes`);

    // 2. Group outcomes by industry code
    const outcomesByIndustry: Map<number, any[]> = new Map();

    outcomesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      const industryCode = data.industryCode;

      if (!industryCode) {
        return; // Skip outcomes without industry code
      }

      if (!outcomesByIndustry.has(industryCode)) {
        outcomesByIndustry.set(industryCode, []);
      }

      outcomesByIndustry.get(industryCode)!.push(data);
    });

    logInfo(`Found ${outcomesByIndustry.size} industries with data`);

    // 3. Calculate benchmarks for each industry
    const benchmarks: BenchmarkData[] = [];

    for (const [industryCode, outcomes] of outcomesByIndustry.entries()) {
      const industry = INDUSTRIES.find(ind => ind.code === industryCode);
      if (!industry) continue;

      // Calculate success metrics
      const totalAttempts = outcomes.length;
      const successfulAttempts = outcomes.filter(
        o => o.outcome === 'paid' || o.outcome === 'partial'
      ).length;
      const successRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;

      // Calculate average days to collect (only for successful outcomes)
      const successfulOutcomes = outcomes.filter(
        o => (o.outcome === 'paid' || o.outcome === 'partial') && o.daysPastDue
      );
      const averageDaysToCollect =
        successfulOutcomes.length > 0
          ? successfulOutcomes.reduce((sum, o) => sum + o.daysPastDue, 0) /
            successfulOutcomes.length
          : 0;

      // Calculate amount collected
      const totalAmountCollected = outcomes.reduce(
        (sum, o) => sum + (o.amountCollected || 0),
        0
      );
      const averageAmountCollected =
        successfulAttempts > 0 ? totalAmountCollected / successfulAttempts : 0;

      // Group by attempt type
      const attemptsByType: { [key: string]: { count: number; successRate: number } } = {};
      const attemptTypes = ['email', 'sms', 'letter', 'call', 'ai_call', 'manual'];

      attemptTypes.forEach(type => {
        const typeOutcomes = outcomes.filter(o => o.attemptType === type);
        const typeSuccessful = typeOutcomes.filter(
          o => o.outcome === 'paid' || o.outcome === 'partial'
        ).length;

        if (typeOutcomes.length > 0) {
          attemptsByType[type] = {
            count: typeOutcomes.length,
            successRate: typeSuccessful / typeOutcomes.length,
          };
        }
      });

      // Outcome distribution
      const outcomeDistribution: { [key: string]: number } = {};
      const possibleOutcomes = ['paid', 'partial', 'promise', 'dispute', 'no_response', 'refused'];

      possibleOutcomes.forEach(outcome => {
        const count = outcomes.filter(o => o.outcome === outcome).length;
        if (count > 0) {
          outcomeDistribution[outcome] = count / totalAttempts;
        }
      });

      // Create benchmark data
      const benchmark: BenchmarkData = {
        industryCode,
        industryLabel: industry.label,
        totalAttempts,
        successfulAttempts,
        successRate,
        averageDaysToCollect,
        averageAmountCollected,
        totalAmountCollected,
        attemptsByType,
        outcomeDistribution,
        lastUpdated: new Date(),
      };

      benchmarks.push(benchmark);

      // 4. Store benchmark in Firestore
      const benchmarkRef = db
        .collection('industryBenchmarks')
        .doc(`industry_${industryCode}`);

      await benchmarkRef.set(benchmark);

      logInfo(`Stored benchmark for industry ${industry.label}`, {
        industryCode,
        successRate: (successRate * 100).toFixed(1) + '%',
        totalAttempts,
      });
    }

    // 5. Store aggregate summary
    const summaryRef = db.collection('industryBenchmarks').doc('_summary');
    await summaryRef.set({
      totalIndustries: benchmarks.length,
      totalAttempts: benchmarks.reduce((sum, b) => sum + b.totalAttempts, 0),
      overallSuccessRate:
        benchmarks.reduce((sum, b) => sum + b.successRate * b.totalAttempts, 0) /
        benchmarks.reduce((sum, b) => sum + b.totalAttempts, 0),
      lastAggregated: new Date(),
      period: '90_days',
    });

    const elapsedTime = Date.now() - startTime;
    logInfo('Industry benchmarks aggregation completed', {
      industriesProcessed: benchmarks.length,
      totalOutcomes: outcomesSnapshot.size,
      elapsedTimeMs: elapsedTime,
    });

  } catch (error: any) {
    logError('Failed to aggregate industry benchmarks', error);
    throw error;
  }
}

/**
 * Entry point for scheduled job
 * Can be called from:
 * - Vercel Cron: /api/cron/aggregate-benchmarks
 * - Render Cron: Direct invocation
 * - Manual trigger: npm run aggregate-benchmarks
 */
export async function handler() {
  try {
    await aggregateIndustryBenchmarks();
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Benchmarks aggregated successfully' }),
    };
  } catch (error: any) {
    logError('Benchmark aggregation job failed', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
}

// If run directly (not imported)
if (require.main === module) {
  aggregateIndustryBenchmarks()
    .then(() => {
      console.log('Benchmark aggregation completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('Benchmark aggregation failed:', error);
      process.exit(1);
    });
}
