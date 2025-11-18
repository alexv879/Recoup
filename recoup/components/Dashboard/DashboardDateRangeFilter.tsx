import React, { useState } from 'react';

const QUICK_OPTIONS = [
    { label: 'Today', value: 'today' },
    { label: 'Last 7 Days', value: '7d' },
    { label: 'Last 30 Days', value: '30d' },
    { label: 'Last 90 Days', value: '90d' },
    { label: 'Year to Date', value: 'ytd' },
    { label: 'Last 12 Months', value: '12m' },
    { label: 'Custom', value: 'custom' },
];

interface DateRangeFilterProps {
    onChange: (range: { preset?: string; from?: string; to?: string }) => void;
}

export function DashboardDateRangeFilter({ onChange }: DateRangeFilterProps) {
    const [option, setOption] = useState('30d');
    const [customFrom, setCustomFrom] = useState('');
    const [customTo, setCustomTo] = useState('');

    function handleApply() {
        if (option === 'custom') {
            onChange({ from: customFrom, to: customTo });
        } else {
            onChange({ preset: option });
        }
    }

    return (
        <div className="flex gap-2 items-center mb-4">
            <select value={option} onChange={e => setOption(e.target.value)} className="border rounded px-2 py-1">
                {QUICK_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            {option === 'custom' && (
                <>
                    <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="border rounded px-2 py-1" />
                    <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="border rounded px-2 py-1" />
                </>
            )}
            <button onClick={handleApply} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">Apply</button>
        </div>
    );
}
