/**
 * Time Tracking Service
 * For hourly billing and project time management
 */

import { TimeEntry, ActiveTimer, TimeSummary, Project } from '@/types/time-tracking';
import { logger } from '@/utils/logger';

/**
 * Start a new timer
 */
export function startTimer(params: {
  userId: string;
  projectId?: string;
  taskDescription: string;
}): ActiveTimer {
  const timer: ActiveTimer = {
    id: `timer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.userId,
    projectId: params.projectId,
    taskDescription: params.taskDescription,
    startTime: new Date(),
    elapsedMinutes: 0,
  };

  logger.info('Timer started', {
    timerId: timer.id,
    userId: params.userId,
    projectId: params.projectId,
  });

  return timer;
}

/**
 * Stop timer and create time entry
 */
export function stopTimer(params: {
  timer: ActiveTimer;
  hourlyRate: number;
  billable: boolean;
  clientId?: string;
  notes?: string;
}): TimeEntry {
  const endTime = new Date();
  const durationMs = endTime.getTime() - params.timer.startTime.getTime();
  const durationMinutes = Math.round(durationMs / 60000);

  const billableAmount = params.billable
    ? (durationMinutes / 60) * params.hourlyRate
    : 0;

  const entry: TimeEntry = {
    id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.timer.userId,
    clientId: params.clientId,
    projectId: params.timer.projectId,
    taskDescription: params.timer.taskDescription,
    startTime: params.timer.startTime,
    endTime,
    duration: durationMinutes,
    hourlyRate: params.hourlyRate,
    billableAmount,
    billable: params.billable,
    billed: false,
    tags: [],
    notes: params.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  logger.info('Timer stopped', {
    entryId: entry.id,
    duration: durationMinutes,
    billableAmount,
  });

  return entry;
}

/**
 * Create manual time entry
 */
export function createTimeEntry(params: {
  userId: string;
  clientId?: string;
  projectId?: string;
  taskDescription: string;
  startTime: Date;
  duration: number; // Minutes
  hourlyRate: number;
  billable: boolean;
  notes?: string;
  tags?: string[];
}): TimeEntry {
  const billableAmount = params.billable
    ? (params.duration / 60) * params.hourlyRate
    : 0;

  const entry: TimeEntry = {
    id: `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: params.userId,
    clientId: params.clientId,
    projectId: params.projectId,
    taskDescription: params.taskDescription,
    startTime: params.startTime,
    endTime: new Date(params.startTime.getTime() + params.duration * 60000),
    duration: params.duration,
    hourlyRate: params.hourlyRate,
    billableAmount,
    billable: params.billable,
    billed: false,
    tags: params.tags || [],
    notes: params.notes,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return entry;
}

/**
 * Calculate time summary for a period
 */
export function calculateTimeSummary(
  entries: TimeEntry[],
  projects: Project[]
): TimeSummary {
  const summary: TimeSummary = {
    totalHours: 0,
    billableHours: 0,
    unbilledHours: 0,
    totalRevenue: 0,
    unbilledRevenue: 0,
    byProject: {},
    byClient: {},
    byDay: {},
    byWeek: {},
  };

  const projectMap = new Map(projects.map(p => [p.id, p]));

  for (const entry of entries) {
    const hours = entry.duration / 60;

    summary.totalHours += hours;

    if (entry.billable) {
      summary.billableHours += hours;
      summary.totalRevenue += entry.billableAmount;

      if (!entry.billed) {
        summary.unbilledHours += hours;
        summary.unbilledRevenue += entry.billableAmount;
      }
    }

    // By project
    if (entry.projectId) {
      const project = projectMap.get(entry.projectId);
      if (project) {
        if (!summary.byProject[entry.projectId]) {
          summary.byProject[entry.projectId] = {
            hours: 0,
            revenue: 0,
            projectName: project.name,
          };
        }
        summary.byProject[entry.projectId].hours += hours;
        summary.byProject[entry.projectId].revenue += entry.billableAmount;
      }
    }

    // By client
    if (entry.clientId) {
      if (!summary.byClient[entry.clientId]) {
        summary.byClient[entry.clientId] = {
          hours: 0,
          revenue: 0,
          clientName: entry.clientId, // Would be replaced with actual client name
        };
      }
      summary.byClient[entry.clientId].hours += hours;
      summary.byClient[entry.clientId].revenue += entry.billableAmount;
    }

    // By day
    const dayKey = entry.startTime.toISOString().split('T')[0];
    if (!summary.byDay[dayKey]) {
      summary.byDay[dayKey] = 0;
    }
    summary.byDay[dayKey] += hours;

    // By week
    const weekKey = getISOWeek(entry.startTime);
    if (!summary.byWeek[weekKey]) {
      summary.byWeek[weekKey] = 0;
    }
    summary.byWeek[weekKey] += hours;
  }

  return summary;
}

/**
 * Generate timesheet for a period
 */
export function generateTimesheet(params: {
  entries: TimeEntry[];
  startDate: Date;
  endDate: Date;
  groupBy?: 'day' | 'project' | 'client';
}): {
  period: { start: Date; end: Date };
  entries: TimeEntry[];
  totalHours: number;
  billableHours: number;
  totalRevenue: number;
  unbilledRevenue: number;
  grouped?: Record<string, TimeEntry[]>;
} {
  const periodEntries = params.entries.filter(
    e => e.startTime >= params.startDate && e.startTime <= params.endDate
  );

  const totalHours = periodEntries.reduce((sum, e) => sum + e.duration / 60, 0);
  const billableHours = periodEntries
    .filter(e => e.billable)
    .reduce((sum, e) => sum + e.duration / 60, 0);
  const totalRevenue = periodEntries.reduce((sum, e) => sum + e.billableAmount, 0);
  const unbilledRevenue = periodEntries
    .filter(e => !e.billed)
    .reduce((sum, e) => sum + e.billableAmount, 0);

  let grouped: Record<string, TimeEntry[]> | undefined;

  if (params.groupBy === 'day') {
    grouped = {};
    for (const entry of periodEntries) {
      const key = entry.startTime.toISOString().split('T')[0];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    }
  } else if (params.groupBy === 'project') {
    grouped = {};
    for (const entry of periodEntries) {
      const key = entry.projectId || 'no_project';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    }
  } else if (params.groupBy === 'client') {
    grouped = {};
    for (const entry of periodEntries) {
      const key = entry.clientId || 'no_client';
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(entry);
    }
  }

  return {
    period: { start: params.startDate, end: params.endDate },
    entries: periodEntries,
    totalHours,
    billableHours,
    totalRevenue,
    unbilledRevenue,
    grouped,
  };
}

/**
 * Calculate billable time to invoice
 */
export function calculateInvoiceFromTime(params: {
  entries: TimeEntry[];
  includeNonBillable?: boolean;
}): {
  lineItems: Array<{
    description: string;
    quantity: number; // Hours
    rate: number;
    amount: number;
  }>;
  subtotal: number;
  entries: string[]; // Entry IDs included
} {
  const entries = params.includeNonBillable
    ? params.entries
    : params.entries.filter(e => e.billable && !e.billed);

  // Group by task description and rate
  const grouped = new Map<string, { hours: number; rate: number; entries: string[] }>();

  for (const entry of entries) {
    const key = `${entry.taskDescription}_${entry.hourlyRate}`;
    const existing = grouped.get(key) || { hours: 0, rate: entry.hourlyRate, entries: [] };

    existing.hours += entry.duration / 60;
    existing.entries.push(entry.id);

    grouped.set(key, existing);
  }

  const lineItems = Array.from(grouped.entries()).map(([key, data]) => {
    const description = key.split('_')[0];
    return {
      description,
      quantity: Number(data.hours.toFixed(2)),
      rate: data.rate,
      amount: Number((data.hours * data.rate).toFixed(2)),
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const entryIds = entries.map(e => e.id);

  return {
    lineItems,
    subtotal,
    entries: entryIds,
  };
}

/**
 * Round time to nearest interval
 * Common practice: round up to nearest 15 minutes
 */
export function roundTime(minutes: number, interval: 5 | 6 | 15 | 30 = 15): number {
  return Math.ceil(minutes / interval) * interval;
}

/**
 * Format duration as human-readable string
 */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  } else if (mins === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${mins}m`;
  }
}

/**
 * Get ISO week number
 */
function getISOWeek(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Check if time tracking limit reached (for free tier)
 */
export function checkTimeTrackingLimit(params: {
  userId: string;
  tier: 'free' | 'starter' | 'professional' | 'business';
  monthlyHours: number;
  activeProjects: number;
}): {
  allowed: boolean;
  reason?: string;
  limit: {
    hours: number | 'unlimited';
    projects: number | 'unlimited';
  };
} {
  const limits = {
    free: { hours: 50, projects: 3 },
    starter: { hours: Infinity, projects: Infinity },
    professional: { hours: Infinity, projects: Infinity },
    business: { hours: Infinity, projects: Infinity },
  };

  const tierLimits = limits[params.tier];

  if (params.monthlyHours >= tierLimits.hours) {
    return {
      allowed: false,
      reason: `Monthly hour limit reached (${tierLimits.hours} hours)`,
      limit: {
        hours: tierLimits.hours === Infinity ? 'unlimited' : tierLimits.hours,
        projects: tierLimits.projects === Infinity ? 'unlimited' : tierLimits.projects,
      },
    };
  }

  if (params.activeProjects >= tierLimits.projects) {
    return {
      allowed: false,
      reason: `Project limit reached (${tierLimits.projects} projects)`,
      limit: {
        hours: tierLimits.hours === Infinity ? 'unlimited' : tierLimits.hours,
        projects: tierLimits.projects === Infinity ? 'unlimited' : tierLimits.projects,
      },
    };
  }

  return {
    allowed: true,
    limit: {
      hours: tierLimits.hours === Infinity ? 'unlimited' : tierLimits.hours,
      projects: tierLimits.projects === Infinity ? 'unlimited' : tierLimits.projects,
    },
  };
}
