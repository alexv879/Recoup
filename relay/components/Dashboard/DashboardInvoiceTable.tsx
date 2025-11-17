import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

const STATUS_OPTIONS = [
    { value: 'all', label: 'All' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'sent', label: 'Sent' },
    { value: 'draft', label: 'Draft' },
    { value: 'in_collections', label: 'In Collections' },
];

export function DashboardInvoiceTable() {
    const [invoices, setInvoices] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState('all');
    const [selected, setSelected] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState<'dueDate' | 'amount' | 'clientName' | 'daysOverdue'>('dueDate');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        async function fetchInvoices() {
            setLoading(true);
            const res = await fetch(`/api/dashboard/invoices?status=${status}&limit=100`);
            const data = await res.json();
            setInvoices(data.invoices || []);
            setLoading(false);
        }
        fetchInvoices();
    }, [status]);

    function handleSelect(id: string) {
        setSelected(selected.includes(id) ? selected.filter(s => s !== id) : [...selected, id]);
    }

    function handleSelectAll() {
        if (selected.length === invoices.length) setSelected([]);
        else setSelected(invoices.map(inv => inv.invoiceId));
    }

    function handleSort(col: typeof sortBy) {
        if (sortBy === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
        else { setSortBy(col); setSortDir('desc'); }
    }

    // Sort invoices
    const sortedInvoices = [...invoices].sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];
        if (sortBy === 'dueDate') {
            valA = new Date(a.dueDate).getTime();
            valB = new Date(b.dueDate).getTime();
        }
        if (sortBy === 'clientName') {
            valA = a.clientName?.toLowerCase();
            valB = b.clientName?.toLowerCase();
        }
        if (sortBy === 'daysOverdue') {
            valA = a.daysOverdue || 0;
            valB = b.daysOverdue || 0;
        }
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    return (
        <Card className="p-6 bg-white border-l-4 border-gray-500 mt-8">
            <div className="flex gap-4 mb-4">
                <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-1">
                    {STATUS_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
                <Button variant="outline" onClick={handleSelectAll}>
                    {selected.length === invoices.length ? 'Deselect All' : 'Select All'}
                </Button>
                {selected.length > 0 && (
                    <Button variant="default">Send Reminder ({selected.length})</Button>
                )}
            </div>
            <table className="w-full text-sm">
                <thead>
                    <tr>
                        <th><input type="checkbox" checked={selected.length === invoices.length && invoices.length > 0} onChange={handleSelectAll} /></th>
                        <th onClick={() => handleSort('clientName')} className="cursor-pointer">Client Name</th>
                        <th onClick={() => handleSort('amount')} className="cursor-pointer">Amount</th>
                        <th onClick={() => handleSort('dueDate')} className="cursor-pointer">Due Date</th>
                        <th onClick={() => handleSort('daysOverdue')} className="cursor-pointer">Days Overdue</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6}>Loading...</td></tr>
                    ) : sortedInvoices.length === 0 ? (
                        <tr><td colSpan={6}>No invoices found.</td></tr>
                    ) : sortedInvoices.map(inv => (
                        <tr key={inv.invoiceId} className={selected.includes(inv.invoiceId) ? 'bg-blue-50' : ''}>
                            <td><input type="checkbox" checked={selected.includes(inv.invoiceId)} onChange={() => handleSelect(inv.invoiceId)} /></td>
                            <td>{inv.clientName}</td>
                            <td>£{inv.amount.toFixed(2)}</td>
                            <td>{new Date(inv.dueDate).toLocaleDateString('en-GB')}</td>
                            <td>{inv.daysOverdue ?? '-'}</td>
                            <td>{inv.status}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Card>
    );
}
