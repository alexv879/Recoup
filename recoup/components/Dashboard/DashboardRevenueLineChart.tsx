import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';

export function DashboardRevenueLineChart() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchChartData() {
            setLoading(true);
            const res = await fetch('/api/dashboard/charts?type=revenue&period=12m');
            const chart = await res.json();
            setData(chart);
            setLoading(false);
        }
        fetchChartData();
    }, []);

    if (loading || !data) {
        return <div>Loading revenue trend...</div>;
    }

    // Simple SVG line chart
    const points = data.data.map((d: any, i: number) => `${10 + i * 30},${120 - d.revenue / 1000}`);
    const polyline = points.join(' ');

    return (
        <Card className="p-6 bg-white border-l-4 border-blue-500">
            <h3 className="text-lg font-bold mb-2">Revenue Trend (12 Months)</h3>
            <svg width="400" height="140">
                <polyline points={polyline} fill="none" stroke="#2563eb" strokeWidth="3" />
                {data.labels.map((label: string, i: number) => (
                    <text key={label} x={10 + i * 30} y={135} fontSize="10" textAnchor="middle">{label}</text>
                ))}
            </svg>
            <div className="mt-2 text-sm text-gray-600">Trend: <span className={data.trend === 'up' ? 'text-green-600' : data.trend === 'down' ? 'text-red-600' : 'text-gray-600'}>{data.trend}</span></div>
        </Card>
    );
}
