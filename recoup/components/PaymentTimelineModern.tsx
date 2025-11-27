/**
 * Modern Payment Timeline Visualization
 * Fintech-style timeline showing invoice payment journey
 * Built with Shadcn UI components
 */

'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mail,
  MessageSquare,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  DollarSign,
  FileText,
} from 'lucide-react';

interface TimelineEvent {
  id: string;
  type: 'invoice_sent' | 'email_sent' | 'sms_sent' | 'call_made' | 'payment_received' | 'overdue' | 'escalated';
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'in_progress' | 'failed' | 'pending';
  amount?: number;
  metadata?: Record<string, any>;
}

interface PaymentTimelineProps {
  events: TimelineEvent[];
  invoiceReference: string;
  totalAmount: number;
  amountPaid: number;
  status: 'paid' | 'partial' | 'overdue' | 'pending';
}

const eventIcons = {
  invoice_sent: FileText,
  email_sent: Mail,
  sms_sent: MessageSquare,
  call_made: Phone,
  payment_received: DollarSign,
  overdue: AlertCircle,
  escalated: XCircle,
};

const eventColors = {
  invoice_sent: 'text-blue-600 bg-blue-100',
  email_sent: 'text-purple-600 bg-purple-100',
  sms_sent: 'text-green-600 bg-green-100',
  call_made: 'text-orange-600 bg-orange-100',
  payment_received: 'text-emerald-600 bg-emerald-100',
  overdue: 'text-amber-600 bg-amber-100',
  escalated: 'text-red-600 bg-red-100',
};

const statusColors = {
  completed: 'border-green-500 bg-green-50',
  in_progress: 'border-blue-500 bg-blue-50',
  failed: 'border-red-500 bg-red-50',
  pending: 'border-gray-300 bg-gray-50',
};

export default function PaymentTimelineModern({
  events,
  invoiceReference,
  totalAmount,
  amountPaid,
  status,
}: PaymentTimelineProps) {
  const progress = (amountPaid / totalAmount) * 100;

  return (
    <Card>
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold">Payment Journey</h3>
            <p className="text-sm text-muted-foreground">
              Invoice {invoiceReference}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold">
              £{amountPaid.toFixed(2)}
              <span className="text-muted-foreground text-base font-normal">
                {' '}
                / £{totalAmount.toFixed(2)}
              </span>
            </p>
            <Badge
              variant={
                status === 'paid'
                  ? 'default'
                  : status === 'overdue'
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Payment Progress</span>
            <span className="font-semibold">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                status === 'paid'
                  ? 'bg-green-500'
                  : status === 'partial'
                  ? 'bg-blue-500'
                  : status === 'overdue'
                  ? 'bg-red-500'
                  : 'bg-gray-400'
              }`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-[17px] top-8 bottom-0 w-0.5 bg-gray-200" />

          {/* Events */}
          <div className="space-y-6">
            {events.map((event, index) => {
              const Icon = eventIcons[event.type];
              const isLast = index === events.length - 1;

              return (
                <div key={event.id} className="relative flex gap-4">
                  {/* Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div
                      className={`
                        w-9 h-9 rounded-full flex items-center justify-center
                        ${eventColors[event.type]}
                      `}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-6">
                    <div
                      className={`
                        border-l-2 pl-4 py-3 rounded-r-lg
                        ${statusColors[event.status]}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold">{event.title}</h4>
                            {event.status === 'completed' && (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            )}
                            {event.status === 'failed' && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                            {event.status === 'in_progress' && (
                              <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {event.description}
                          </p>

                          {/* Metadata */}
                          {event.metadata && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {Object.entries(event.metadata).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-2 py-1 bg-white rounded border"
                                >
                                  <span className="font-medium">{key}:</span> {value}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Amount if present */}
                          {event.amount !== undefined && (
                            <div className="mt-2">
                              <Badge variant="outline" className="font-semibold">
                                £{event.amount.toFixed(2)}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {formatTimestamp(event.timestamp)}
                        </span>
                      </div>

                      {/* Action button if needed */}
                      {event.status === 'failed' && (
                        <Button variant="outline" size="sm" className="mt-3">
                          Retry
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Next Actions */}
        {status !== 'paid' && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold mb-3">Recommended Next Actions</h4>
            <div className="space-y-2">
              {status === 'overdue' && (
                <>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Mail className="mr-2 h-4 w-4" />
                    Send Payment Reminder Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Send SMS Reminder
                  </Button>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Phone className="mr-2 h-4 w-4" />
                    Schedule AI Voice Call
                  </Button>
                </>
              )}
              {status === 'pending' && (
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Gentle Reminder
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return 'Just now';
}

// Example usage component
export function PaymentTimelineExample() {
  const mockEvents: TimelineEvent[] = [
    {
      id: '1',
      type: 'invoice_sent',
      title: 'Invoice Created & Sent',
      description: 'Invoice sent to customer via email',
      timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      status: 'completed',
      amount: 500,
      metadata: { channel: 'Email', recipient: 'customer@example.com' },
    },
    {
      id: '2',
      type: 'email_sent',
      title: 'Day 7 Reminder',
      description: 'Friendly payment reminder sent',
      timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'completed',
      metadata: { tone: 'Friendly', opened: 'Yes' },
    },
    {
      id: '3',
      type: 'sms_sent',
      title: 'Day 14 SMS Reminder',
      description: 'Firm reminder sent via SMS',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'completed',
      metadata: { tone: 'Firm', cost: '£0.04' },
    },
    {
      id: '4',
      type: 'call_made',
      title: 'AI Voice Call Scheduled',
      description: 'Final notice call scheduled for tomorrow',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
      status: 'pending',
      metadata: { scheduled: 'Tomorrow 2pm' },
    },
  ];

  return (
    <PaymentTimelineModern
      events={mockEvents}
      invoiceReference="INV-1234"
      totalAmount={500}
      amountPaid={0}
      status="overdue"
    />
  );
}
