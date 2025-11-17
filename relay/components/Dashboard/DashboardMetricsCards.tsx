import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

export function DashboardMetricsCards() {
    const [metrics, setMetrics] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchMetrics() {
            setLoading(true);
            const res = await fetch('/api/dashboard/metrics');
            const data = await res.json();
            setMetrics(data);
            setLoading(false);
        }
        fetchMetrics();
    }, []);

    if (loading || !metrics) {
        return <div>Loading metrics...</div>;
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="p-6 bg-white border-l-4 border-blue-500">
                <h3 className="text-lg font-bold mb-2">Collection Effectiveness Index (CEI)</h3>
                <div className="text-3xl font-bold text-blue-700">{metrics.cei}%</div>
                <div className="text-sm text-gray-600 mt-2">Higher is better. Target: 70-85%.</div>
            </Card>
            <Card className="p-6 bg-white border-l-4 border-green-500">
                <h3 className="text-lg font-bold mb-2">Reminder Effectiveness Rates</h3>
                <ul className="mt-2">
                    {metrics.reminderRates.map((r: any) => (
                        <li key={r.reminder} className="mb-1">
                            <span className="font-semibold">{r.reminder}:</span> <span className="text-green-700">{r.rate}%</span> <span className="text-xs text-gray-500">({r.paidCount}/{r.totalCount} paid)</span>
                        </li>
                    ))}
                </ul>
            </Card>
        </div>
    );
}
