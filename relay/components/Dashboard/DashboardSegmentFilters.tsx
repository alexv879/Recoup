import React, { useState } from 'react';

export function DashboardSegmentFilters({ clients, paymentMethods, onChange }) {
    const [selectedClients, setSelectedClients] = useState<string[]>([]);
    const [selectedStatus, setSelectedStatus] = useState<string[]>(['all']);
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);

    function handleApply() {
        onChange({ clients: selectedClients, status: selectedStatus, paymentMethods: selectedMethods });
    }

    function handleReset() {
        setSelectedClients([]);
        setSelectedStatus(['all']);
        setSelectedMethods([]);
        onChange({ clients: [], status: ['all'], paymentMethods: [] });
    }

    return (
        <div className="flex gap-4 mb-4 items-center">
            <div>
                <label className="font-semibold">Client:</label>
                <select multiple value={selectedClients} onChange={e => setSelectedClients(Array.from(e.target.selectedOptions, o => o.value))} className="border rounded px-2 py-1">
                    <option value="all">All Clients</option>
                    {clients.map((c: string) => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
            <div>
                <label className="font-semibold">Status:</label>
                <select multiple value={selectedStatus} onChange={e => setSelectedStatus(Array.from(e.target.selectedOptions, o => o.value))} className="border rounded px-2 py-1">
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                    <option value="sent">Sent</option>
                    <option value="draft">Draft</option>
                    <option value="in_collections">In Collections</option>
                </select>
            </div>
            <div>
                <label className="font-semibold">Payment Method:</label>
                <select multiple value={selectedMethods} onChange={e => setSelectedMethods(Array.from(e.target.selectedOptions, o => o.value))} className="border rounded px-2 py-1">
                    <option value="all">All Methods</option>
                    {paymentMethods.map((m: string) => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <button onClick={handleApply} className="ml-2 px-3 py-1 bg-blue-600 text-white rounded">Apply</button>
            <button onClick={handleReset} className="ml-2 px-3 py-1 bg-gray-300 text-gray-800 rounded">Reset</button>
        </div>
    );
}
