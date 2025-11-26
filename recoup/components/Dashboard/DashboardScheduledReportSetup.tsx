import React, { useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

const SCHEDULE_OPTIONS = [
    { label: 'Daily Summary (7am)', value: 'daily' },
    { label: 'Weekly Report (Fridays 5pm)', value: 'weekly' },
    { label: 'Monthly Report (End of month)', value: 'monthly' },
];

export function DashboardScheduledReportSetup() {
    const [selected, setSelected] = useState<string[]>([]);
    const [recipients, setRecipients] = useState<string>('');

    async function handleSave() {
        try {
            const response = await fetch('/api/reports/schedule', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    schedules: selected,
                    recipients: recipients.split(',').map(e => e.trim()).filter(Boolean),
                    reportType: 'collections',
                }),
            });

            if (response.ok) {
                alert(`Scheduled reports saved: ${selected.join(', ')}\nRecipients: ${recipients}`);
            } else {
                alert('Failed to save scheduled reports');
            }
        } catch (error) {
            console.error('Error saving scheduled reports:', error);
            alert('Error saving scheduled reports');
        }
    }

    async function handleTestSend() {
        try {
            const response = await fetch('/api/reports/send-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reportType: 'collections',
                    recipients: recipients.split(',').map(e => e.trim()).filter(Boolean),
                }),
            });

            if (response.ok) {
                alert('Test report sent!');
            } else {
                alert('Failed to send test report');
            }
        } catch (error) {
            console.error('Error sending test report:', error);
            alert('Error sending test report');
        }
    }

    return (
        <Card className="p-6 bg-white border-l-4 border-pink-500 mt-8">
            <h3 className="text-lg font-bold mb-2">Automated Report Scheduling</h3>
            <div className="mb-2">
                {SCHEDULE_OPTIONS.map(opt => (
                    <label key={opt.value} className="flex items-center gap-2 mb-1">
                        <input type="checkbox" value={opt.value} checked={selected.includes(opt.value)} onChange={e => {
                            setSelected(selected.includes(opt.value) ? selected.filter(s => s !== opt.value) : [...selected, opt.value]);
                        }} />
                        {opt.label}
                    </label>
                ))}
            </div>
            <div className="mb-2">
                <label className="font-semibold">Recipients:</label>
                <input type="text" value={recipients} onChange={e => setRecipients(e.target.value)} placeholder="email1, email2" className="border rounded px-2 py-1 w-64" />
            </div>
            <div className="flex gap-2 mt-2">
                <Button variant="default" onClick={handleSave}>Save</Button>
                <Button variant="outline" onClick={handleTestSend}>Test Send</Button>
            </div>
        </Card>
    );
}
