import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Custom/Card';

export function DashboardStatusBarChart() {
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
        return <div>Loading status bar chart...</div>;
    }

    const total = data.total || 1;
    const paid = data.paid || 0;
    const overdue = data.overdue || 0;
    const outstanding = total - paid - overdue;

    return (
        <Card className="p-6 bg-white border-l-4 border-indigo-500">
            <h3 className="text-lg font-bold mb-2">Invoices by Status (Bar Chart)</h3>
            <div className="flex gap-2 items-end h-32">
                <div className="flex flex-col items-center">
                    <div className="bg-green-500 w-8" style={{ height: `${(paid / total) * 100}px` }} />
                    <span className="text-xs mt-1">Paid</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="bg-red-500 w-8" style={{ height: `${(overdue / total) * 100}px` }} />
                    <span className="text-xs mt-1">Overdue</span>
                </div>
                <div className="flex flex-col items-center">
                    <div className="bg-orange-400 w-8" style={{ height: `${(outstanding / total) * 100}px` }} />
                    <span className="text-xs mt-1">Outstanding</span>
                </div>
            </div>
        </Card>
    );
}
