import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';

export function DashboardStatusDonutChart() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStatusData() {
            setLoading(true);
            const res = await fetch('/api/dashboard/stats');
            const stats = await res.json();
            setData(stats.invoices);
            setLoading(false);
        }
        fetchStatusData();
    }, []);

    if (loading || !data) {
        return <div>Loading status breakdown...</div>;
    }

    // Calculate percentages
    const total = data.total || 1;
    const paid = data.paid || 0;
    const overdue = data.overdue || 0;
    const outstanding = total - paid - overdue;
    const paidPct = Math.round((paid / total) * 100);
    const overduePct = Math.round((overdue / total) * 100);
    const outstandingPct = Math.max(0, 100 - paidPct - overduePct);

    // Simple SVG donut chart
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const paidArc = (paidPct / 100) * circumference;
    const overdueArc = (overduePct / 100) * circumference;
    const outstandingArc = (outstandingPct / 100) * circumference;

    return (
        <Card className="p-6 bg-white border-l-4 border-purple-500 flex flex-col items-center">
            <h3 className="text-lg font-bold mb-2">Invoice Status Breakdown</h3>
            <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                    cx="60" cy="60" r={radius}
                    stroke="#22c55e" strokeWidth="16"
                    strokeDasharray={`${paidArc} ${circumference - paidArc}`}
                    strokeDashoffset="0"
                    fill="none"
                />
                <circle
                    cx="60" cy="60" r={radius}
                    stroke="#ef4444" strokeWidth="16"
                    strokeDasharray={`${overdueArc} ${circumference - overdueArc}`}
                    strokeDashoffset={paidArc}
                    fill="none"
                />
                <circle
                    cx="60" cy="60" r={radius}
                    stroke="#f59e42" strokeWidth="16"
                    strokeDasharray={`${outstandingArc} ${circumference - outstandingArc}`}
                    strokeDashoffset={paidArc + overdueArc}
                    fill="none"
                />
            </svg>
            <div className="mt-4 flex flex-col gap-2 text-sm">
                <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-green-500 rounded-full" /> Paid: {paidPct}%</span>
                <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-red-500 rounded-full" /> Overdue: {overduePct}%</span>
                <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 bg-orange-400 rounded-full" /> Outstanding: {outstandingPct}%</span>
            </div>
        </Card>
    );
}
