/**
 * Client Profitability & Cost-to-Serve Analysis
 *
 * COMPETITIVE ADVANTAGE: NO existing invoicing tool tracks this
 *
 * Addresses key pain point: Freelancers don't know which clients are actually profitable
 * - High-revenue clients may have high "cost-to-serve" (meetings, revisions, support)
 * - Can't make informed decisions about which clients to focus on
 * - Pricing decisions made blindly
 *
 * Features:
 * - Profit per client (revenue - time cost)
 * - Cost-to-serve tracking (meetings, emails, revisions)
 * - Client LTV (Lifetime Value)
 * - "Best/worst clients" ranking
 * - Pricing recommendations
 * - Client health scoring
 */

import { logger } from '@/utils/logger';
import { TimeEntry } from '@/types/time-tracking';

export interface ClientProfitabilityAnalysis {
  clientId: string;
  clientName: string;
  analysisDate: Date;

  // Revenue
  revenue: {
    total: number;
    averageInvoiceValue: number;
    invoiceCount: number;
    lifetimeValue: number;
  };

  // Costs
  costs: {
    directTime: number; // Billable time cost
    indirectTime: number; // Unbillable time cost (meetings, emails, etc)
    totalTime: number;
    hoursTracked: number;
    averageHourlyRate: number;
  };

  // Cost-to-Serve breakdown
  costToServe: {
    meetings: { hours: number; cost: number };
    emails: { count: number; estimatedHours: number; cost: number };
    revisions: { count: number; hours: number; cost: number };
    support: { hours: number; cost: number };
    adminOverhead: { hours: number; cost: number };
    total: number;
  };

  // Profitability
  profitability: {
    grossProfit: number; // Revenue - direct time
    netProfit: number; // Revenue - all costs
    grossMargin: number; // %
    netMargin: number; // %
  };

  // Efficiency
  efficiency: {
    billableRatio: number; // % of time that's billable
    revenuePerHour: number;
    profitPerHour: number;
    costToServeRatio: number; // Cost-to-serve as % of revenue
  };

  // Risk Assessment
  risk: {
    score: number; // 0-100 (higher = more risky)
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };

  // Overall Rating
  rating: {
    score: number; // 0-100
    tier: 'A' | 'B' | 'C' | 'D' | 'F'; // Best to worst
    recommendation: string;
  };
}

export interface CostToServeEntry {
  id: string;
  clientId: string;
  date: Date;
  type: 'meeting' | 'email' | 'revision' | 'support' | 'admin';
  description: string;
  timeSpent: number; // Minutes
  cost: number; // Calculated based on hourly rate
}

export interface ClientHealthScore {
  clientId: string;
  clientName: string;
  overallScore: number; // 0-100

  factors: {
    profitability: { score: number; weight: 0.3 };
    paymentBehavior: { score: number; weight: 0.25 };
    engagement: { score: number; weight: 0.2 };
    efficiency: { score: number; weight: 0.15 };
    growth: { score: number; weight: 0.1 };
  };

  status: 'thriving' | 'healthy' | 'at_risk' | 'problem';
  alerts: string[];
  recommendations: string[];
}

export interface ClientRanking {
  userId: string;
  generatedAt: Date;

  rankings: {
    byProfit: ClientProfitabilityAnalysis[];
    byRevenue: ClientProfitabilityAnalysis[];
    byMargin: ClientProfitabilityAnalysis[];
    byEfficiency: ClientProfitabilityAnalysis[];
  };

  insights: {
    bestClient: { id: string; name: string; reason: string };
    worstClient: { id: string; name: string; reason: string };
    recommendations: string[];
  };
}

// ==============================================================================
// CLIENT PROFITABILITY ANALYSIS
// ==============================================================================

/**
 * Analyze client profitability
 */
export function analyzeClientProfitability(params: {
  clientId: string;
  clientName: string;
  invoices: Array<{ amount: number; amountPaid: number }>;
  timeEntries: TimeEntry[];
  costToServeEntries: CostToServeEntry[];
  defaultHourlyRate: number;
}): ClientProfitabilityAnalysis {
  const { clientId, clientName, invoices, timeEntries, costToServeEntries, defaultHourlyRate } = params;

  // Revenue calculation
  const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
  const invoiceCount = invoices.length;
  const averageInvoiceValue = invoiceCount > 0 ? totalRevenue / invoiceCount : 0;
  const lifetimeValue = totalRevenue; // Could add future value prediction

  // Time costs calculation
  const billableEntries = timeEntries.filter(e => e.billable);
  const unbillableEntries = timeEntries.filter(e => !e.billable);

  const billableHours = billableEntries.reduce((sum, e) => sum + e.duration / 60, 0);
  const unbillableHours = unbillableEntries.reduce((sum, e) => sum + e.duration / 60, 0);
  const totalHours = billableHours + unbillableHours;

  const avgRate = timeEntries.length > 0
    ? timeEntries.reduce((sum, e) => sum + e.hourlyRate, 0) / timeEntries.length
    : defaultHourlyRate;

  const directTimeCost = billableHours * avgRate;
  const indirectTimeCost = unbillableHours * avgRate;
  const totalTimeCost = directTimeCost + indirectTimeCost;

  // Cost-to-serve breakdown
  const meetingEntries = costToServeEntries.filter(e => e.type === 'meeting');
  const emailEntries = costToServeEntries.filter(e => e.type === 'email');
  const revisionEntries = costToServeEntries.filter(e => e.type === 'revision');
  const supportEntries = costToServeEntries.filter(e => e.type === 'support');
  const adminEntries = costToServeEntries.filter(e => e.type === 'admin');

  const costToServe = {
    meetings: {
      hours: meetingEntries.reduce((sum, e) => sum + e.timeSpent / 60, 0),
      cost: meetingEntries.reduce((sum, e) => sum + e.cost, 0),
    },
    emails: {
      count: emailEntries.length,
      estimatedHours: emailEntries.reduce((sum, e) => sum + e.timeSpent / 60, 0),
      cost: emailEntries.reduce((sum, e) => sum + e.cost, 0),
    },
    revisions: {
      count: revisionEntries.length,
      hours: revisionEntries.reduce((sum, e) => sum + e.timeSpent / 60, 0),
      cost: revisionEntries.reduce((sum, e) => sum + e.cost, 0),
    },
    support: {
      hours: supportEntries.reduce((sum, e) => sum + e.timeSpent / 60, 0),
      cost: supportEntries.reduce((sum, e) => sum + e.cost, 0),
    },
    adminOverhead: {
      hours: adminEntries.reduce((sum, e) => sum + e.timeSpent / 60, 0),
      cost: adminEntries.reduce((sum, e) => sum + e.cost, 0),
    },
    total: costToServeEntries.reduce((sum, e) => sum + e.cost, 0),
  };

  // Profitability
  const grossProfit = totalRevenue - directTimeCost;
  const netProfit = totalRevenue - totalTimeCost - costToServe.total;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Efficiency metrics
  const billableRatio = totalHours > 0 ? (billableHours / totalHours) * 100 : 0;
  const revenuePerHour = totalHours > 0 ? totalRevenue / totalHours : 0;
  const profitPerHour = totalHours > 0 ? netProfit / totalHours : 0;
  const costToServeRatio = totalRevenue > 0 ? (costToServe.total / totalRevenue) * 100 : 0;

  // Risk assessment
  const riskFactors: string[] = [];
  let riskScore = 0;

  if (netMargin < 20) {
    riskFactors.push(`Low profit margin: ${netMargin.toFixed(0)}%`);
    riskScore += 30;
  }

  if (costToServeRatio > 30) {
    riskFactors.push(`High cost-to-serve: ${costToServeRatio.toFixed(0)}% of revenue`);
    riskScore += 25;
  }

  if (costToServe.revisions.count > 5 && invoiceCount > 0) {
    riskFactors.push(`High revision count: ${costToServe.revisions.count} revisions for ${invoiceCount} invoices`);
    riskScore += 20;
  }

  if (billableRatio < 60) {
    riskFactors.push(`Low billable ratio: ${billableRatio.toFixed(0)}%`);
    riskScore += 15;
  }

  const riskLevel: 'low' | 'medium' | 'high' =
    riskScore < 30 ? 'low' : riskScore < 60 ? 'medium' : 'high';

  // Overall rating
  let ratingScore = 100;

  // Profitability weight (40%)
  const profitabilityScore = Math.max(0, Math.min(100, netMargin * 2)); // 50% margin = 100 score
  ratingScore = profitabilityScore * 0.4;

  // Efficiency weight (30%)
  const efficiencyScore = Math.min(100, billableRatio);
  ratingScore += efficiencyScore * 0.3;

  // Revenue weight (20%)
  const revenueScore = Math.min(100, (totalRevenue / 10000) * 100); // £10k = 100 score
  ratingScore += revenueScore * 0.2;

  // Low risk bonus (10%)
  const riskBonusScore = Math.max(0, 100 - riskScore);
  ratingScore += riskBonusScore * 0.1;

  const tier: 'A' | 'B' | 'C' | 'D' | 'F' =
    ratingScore >= 80 ? 'A' :
    ratingScore >= 65 ? 'B' :
    ratingScore >= 50 ? 'C' :
    ratingScore >= 35 ? 'D' : 'F';

  let recommendation: string;

  if (tier === 'A') {
    recommendation = 'PRIORITY CLIENT: Highly profitable, focus on retention and upselling';
  } else if (tier === 'B') {
    recommendation = 'GOOD CLIENT: Solid profitability, maintain relationship';
  } else if (tier === 'C') {
    recommendation = 'REVIEW: Moderate profitability, look for optimization opportunities';
  } else if (tier === 'D') {
    recommendation = 'WARNING: Low profitability, consider raising rates or reducing scope';
  } else {
    recommendation = 'PROBLEM CLIENT: Unprofitable, consider terminating relationship';
  }

  logger.info('Client profitability analyzed', {
    clientId,
    netProfit,
    netMargin,
    tier,
    riskLevel,
  });

  return {
    clientId,
    clientName,
    analysisDate: new Date(),
    revenue: {
      total: totalRevenue,
      averageInvoiceValue,
      invoiceCount,
      lifetimeValue,
    },
    costs: {
      directTime: directTimeCost,
      indirectTime: indirectTimeCost,
      totalTime: totalTimeCost,
      hoursTracked: totalHours,
      averageHourlyRate: avgRate,
    },
    costToServe,
    profitability: {
      grossProfit,
      netProfit,
      grossMargin,
      netMargin,
    },
    efficiency: {
      billableRatio,
      revenuePerHour,
      profitPerHour,
      costToServeRatio,
    },
    risk: {
      score: riskScore,
      level: riskLevel,
      factors: riskFactors,
    },
    rating: {
      score: ratingScore,
      tier,
      recommendation,
    },
  };
}

// ==============================================================================
// CLIENT HEALTH SCORING
// ==============================================================================

/**
 * Calculate comprehensive client health score
 */
export function calculateClientHealth(params: {
  clientId: string;
  clientName: string;
  profitabilityAnalysis: ClientProfitabilityAnalysis;
  paymentHistory: {
    onTimeRate: number; // %
    averageDaysLate: number;
  };
  engagement: {
    daysSinceLastInvoice: number;
    invoiceFrequency: number; // Invoices per month
  };
}): ClientHealthScore {
  const { clientId, clientName, profitabilityAnalysis, paymentHistory, engagement } = params;

  // Profitability score (30% weight)
  const profitabilityScore = Math.max(0, Math.min(100,
    profitabilityAnalysis.profitability.netMargin * 2
  ));

  // Payment behavior score (25% weight)
  let paymentScore = paymentHistory.onTimeRate;
  if (paymentHistory.averageDaysLate > 15) {
    paymentScore = Math.max(0, paymentScore - 20);
  }

  // Engagement score (20% weight)
  let engagementScore = 100;
  if (engagement.daysSinceLastInvoice > 90) {
    engagementScore = 40; // Inactive
  } else if (engagement.daysSinceLastInvoice > 60) {
    engagementScore = 70; // At risk
  }

  if (engagement.invoiceFrequency >= 4) {
    engagementScore = Math.min(100, engagementScore + 10); // Bonus for high frequency
  }

  // Efficiency score (15% weight)
  const efficiencyScore = profitabilityAnalysis.efficiency.billableRatio;

  // Growth score (10% weight) - simplified, could be based on trend
  const growthScore = 75; // Placeholder - would analyze invoice trend

  // Calculate weighted overall score
  const overallScore = Math.round(
    profitabilityScore * 0.3 +
    paymentScore * 0.25 +
    engagementScore * 0.2 +
    efficiencyScore * 0.15 +
    growthScore * 0.1
  );

  const status: 'thriving' | 'healthy' | 'at_risk' | 'problem' =
    overallScore >= 80 ? 'thriving' :
    overallScore >= 60 ? 'healthy' :
    overallScore >= 40 ? 'at_risk' : 'problem';

  // Generate alerts and recommendations
  const alerts: string[] = [];
  const recommendations: string[] = [];

  if (profitabilityScore < 50) {
    alerts.push('Low profitability - consider rate adjustment');
    recommendations.push('Increase rates by 20-30% for this client');
  }

  if (paymentScore < 60) {
    alerts.push('Poor payment history');
    recommendations.push('Require upfront deposits or shorter payment terms');
  }

  if (engagement.daysSinceLastInvoice > 60) {
    alerts.push('Client inactive for 60+ days');
    recommendations.push('Reach out with new project ideas or check-in');
  }

  if (profitabilityAnalysis.efficiency.costToServeRatio > 30) {
    alerts.push('High cost-to-serve');
    recommendations.push('Set clearer boundaries on revisions and scope');
  }

  if (status === 'thriving') {
    recommendations.push('Excellent client - prioritize retention and upselling');
  }

  return {
    clientId,
    clientName,
    overallScore,
    factors: {
      profitability: { score: profitabilityScore, weight: 0.3 },
      paymentBehavior: { score: paymentScore, weight: 0.25 },
      engagement: { score: engagementScore, weight: 0.2 },
      efficiency: { score: efficiencyScore, weight: 0.15 },
      growth: { score: growthScore, weight: 0.1 },
    },
    status,
    alerts,
    recommendations,
  };
}

// ==============================================================================
// CLIENT RANKING & INSIGHTS
// ==============================================================================

/**
 * Rank all clients by various metrics
 */
export function rankClients(params: {
  userId: string;
  analyses: ClientProfitabilityAnalysis[];
}): ClientRanking {
  const { userId, analyses } = params;

  // Sort by different metrics
  const byProfit = [...analyses].sort((a, b) => b.profitability.netProfit - a.profitability.netProfit);
  const byRevenue = [...analyses].sort((a, b) => b.revenue.total - a.revenue.total);
  const byMargin = [...analyses].sort((a, b) => b.profitability.netMargin - a.profitability.netMargin);
  const byEfficiency = [...analyses].sort((a, b) => b.efficiency.profitPerHour - a.efficiency.profitPerHour);

  // Identify best and worst
  const bestClient = byProfit[0];
  const worstClient = byProfit[byProfit.length - 1];

  const bestReason = `Highest net profit: £${bestClient.profitability.netProfit.toFixed(2)} (${bestClient.profitability.netMargin.toFixed(0)}% margin)`;
  const worstReason = worstClient.profitability.netProfit < 0
    ? `Unprofitable: £${worstClient.profitability.netProfit.toFixed(2)} loss`
    : `Lowest profit: £${worstClient.profitability.netProfit.toFixed(2)} (${worstClient.profitability.netMargin.toFixed(0)}% margin)`;

  // Generate insights
  const recommendations: string[] = [];

  const unprofitableCount = analyses.filter(a => a.profitability.netProfit < 0).length;
  if (unprofitableCount > 0) {
    recommendations.push(`${unprofitableCount} unprofitable clients - review pricing or terminate`);
  }

  const lowMarginCount = analyses.filter(a => a.profitability.netMargin < 20).length;
  if (lowMarginCount > analyses.length * 0.3) {
    recommendations.push(`${lowMarginCount} clients with <20% margin - consider rate increases`);
  }

  const topClients = byProfit.slice(0, 3);
  const topRevenue = topClients.reduce((sum, c) => sum + c.revenue.total, 0);
  const totalRevenue = analyses.reduce((sum, c) => sum + c.revenue.total, 0);
  const concentration = (topRevenue / totalRevenue) * 100;

  if (concentration > 70) {
    recommendations.push(`Top 3 clients = ${concentration.toFixed(0)}% of revenue - diversify client base`);
  }

  return {
    userId,
    generatedAt: new Date(),
    rankings: {
      byProfit,
      byRevenue,
      byMargin,
      byEfficiency,
    },
    insights: {
      bestClient: {
        id: bestClient.clientId,
        name: bestClient.clientName,
        reason: bestReason,
      },
      worstClient: {
        id: worstClient.clientId,
        name: worstClient.clientName,
        reason: worstReason,
      },
      recommendations,
    },
  };
}

/**
 * Track cost-to-serve activity
 */
export function trackCostToServe(params: {
  clientId: string;
  type: 'meeting' | 'email' | 'revision' | 'support' | 'admin';
  description: string;
  timeSpent: number; // Minutes
  hourlyRate: number;
}): CostToServeEntry {
  const { clientId, type, description, timeSpent, hourlyRate } = params;

  const cost = (timeSpent / 60) * hourlyRate;

  const entry: CostToServeEntry = {
    id: `cts-${Date.now()}`,
    clientId,
    date: new Date(),
    type,
    description,
    timeSpent,
    cost,
  };

  logger.info('Cost-to-serve tracked', {
    clientId,
    type,
    timeSpent,
    cost,
  });

  return entry;
}

/**
 * Get pricing recommendation for client
 */
export function getPricingRecommendation(params: {
  analysis: ClientProfitabilityAnalysis;
  targetMargin: number; // e.g., 40%
}): {
  currentRate: number;
  recommendedRate: number;
  increaseAmount: number;
  increasePercentage: number;
  reasoning: string;
} {
  const { analysis, targetMargin } = params;

  const currentRate = analysis.costs.averageHourlyRate;
  const currentMargin = analysis.profitability.netMargin;

  if (currentMargin >= targetMargin) {
    return {
      currentRate,
      recommendedRate: currentRate,
      increaseAmount: 0,
      increasePercentage: 0,
      reasoning: `Current margin (${currentMargin.toFixed(0)}%) meets target (${targetMargin}%)`,
    };
  }

  // Calculate required rate increase
  const marginGap = targetMargin - currentMargin;
  const increasePercentage = (marginGap / (100 - targetMargin)) * 100;
  const recommendedRate = currentRate * (1 + increasePercentage / 100);
  const increaseAmount = recommendedRate - currentRate;

  let reasoning: string;

  if (increasePercentage > 50) {
    reasoning = `CRITICAL: Need ${increasePercentage.toFixed(0)}% rate increase to reach target margin. Consider if this client is viable.`;
  } else if (increasePercentage > 30) {
    reasoning = `Significant rate increase needed (${increasePercentage.toFixed(0)}%). Implement gradually or reduce cost-to-serve.`;
  } else {
    reasoning = `Modest rate increase (${increasePercentage.toFixed(0)}%) recommended to reach ${targetMargin}% target margin.`;
  }

  return {
    currentRate,
    recommendedRate,
    increaseAmount,
    increasePercentage,
    reasoning,
  };
}
