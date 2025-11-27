/**
 * Time Tracking Types
 * For billing hourly work and project tracking
 */

export interface TimeEntry {
  id: string;
  userId: string;
  clientId?: string;
  projectId?: string;
  taskDescription: string;
  startTime: Date;
  endTime?: Date; // Null if timer still running
  duration: number; // Minutes
  hourlyRate: number;
  billableAmount: number; // duration * rate
  billable: boolean;
  billed: boolean;
  invoiceId?: string;
  tags: string[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  userId: string;
  clientId?: string;
  name: string;
  description?: string;
  color?: string; // For UI visual distinction
  defaultHourlyRate: number;
  budget?: {
    type: 'hours' | 'amount';
    value: number;
    spent: number;
  };
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActiveTimer {
  id: string;
  userId: string;
  projectId?: string;
  taskDescription: string;
  startTime: Date;
  elapsedMinutes: number;
}

export interface TimeSummary {
  totalHours: number;
  billableHours: number;
  unbilledHours: number;
  totalRevenue: number;
  unbilledRevenue: number;
  byProject: Record<string, {
    hours: number;
    revenue: number;
    projectName: string;
  }>;
  byClient: Record<string, {
    hours: number;
    revenue: number;
    clientName: string;
  }>;
  byDay: Record<string, number>; // "2025-11-18": 8.5
  byWeek: Record<string, number>; // "2025-W47": 40
}

export interface Timesheet {
  userId: string;
  startDate: Date;
  endDate: Date;
  entries: TimeEntry[];
  totalHours: number;
  totalBillable: number;
  exported: boolean;
  exportedAt?: Date;
}

export const DEFAULT_HOURLY_RATES = {
  DEVELOPER: 75,
  DESIGNER: 65,
  CONSULTANT: 95,
  WRITER: 45,
  VA: 25,
  ACCOUNTANT: 85,
  LAWYER: 150,
  PHOTOGRAPHER: 55,
  VIDEOGRAPHER: 65,
  MARKETING: 60,
};
