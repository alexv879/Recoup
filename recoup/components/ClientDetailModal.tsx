// Accessible Client Detail Modal for Relay
import React, { useState } from 'react';
import { AccessibleDialog } from '@/lib/accessibility';
import { Client } from '../types/models';

interface ClientDetailModalProps {
    client: Client | null;
    onClose: () => void;
    onArchive: (clientId: string) => void;
    onUnarchive: (clientId: string) => void;
}

const TABS = [
    { key: 'contact', label: 'Contact Info' },
    { key: 'invoices', label: 'Invoices' },
    { key: 'payment', label: 'Payment Info' },
    { key: 'activity', label: 'Activity/Notes' },
];

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client, onClose, onArchive, onUnarchive }) => {
    const [activeTab, setActiveTab] = useState('contact');
    if (!client) return null;
    return (
        <AccessibleDialog
            isOpen={!!client}
            onClose={onClose}
            title={client?.name || 'Client details'}
            description={client?.company || ''}
        >
            <div className="p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    aria-label="Close client details"
                >
                    ×
                </button>
                <div className="mb-4">
                    <h2 id="client-modal-title" className="text-2xl font-bold mb-1">{client.name}</h2>
                    <div className="flex gap-2 items-center mb-2">
                        {client.company && <span className="text-gray-700 font-semibold">{client.company}</span>}
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${client.status === 'archived' ? 'bg-gray-200 text-gray-700' : client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{client.status || (client.archived ? 'archived' : 'active')}</span>
                    </div>
                    <div className="text-lg font-bold text-blue-700">£{client.totalOwed?.toLocaleString() || '0'}</div>
                </div>
                <div className="mb-4 border-b">
                    <nav className="flex gap-4">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`pb-2 font-semibold text-sm border-b-2 ${activeTab === tab.key ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}
                                aria-selected={activeTab === tab.key}
                                aria-controls={`tab-panel-${tab.key}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                <div id={`tab-panel-${activeTab}`} role="tabpanel" className="min-h-[180px]">
                    {activeTab === 'contact' && (
                        <div>
                            <p className="mb-1 text-gray-700">Email: <span className="font-mono">{client.email}</span></p>
                            {client.phone && <p className="mb-1 text-gray-700">Phone: <span className="font-mono">{client.phone}</span></p>}
                            {client.industry && <p className="mb-1 text-gray-700">Industry: <span className="font-mono">{client.industry}</span></p>}
                            {client.billingAddress && (
                                <div className="mb-1 text-gray-700">
                                    <div>Billing Address:</div>
                                    <div className="font-mono text-sm">
                                        {client.billingAddress.street}<br />
                                        {client.billingAddress.street2 && <>{client.billingAddress.street2}<br /></>}
                                        {client.billingAddress.city}, {client.billingAddress.state} {client.billingAddress.postalCode}<br />
                                        {client.billingAddress.country}
                                    </div>
                                </div>
                            )}
                            {client.tags && client.tags.length > 0 && (
                                <div className="mb-1 text-gray-700">Tags: <span className="font-mono">{client.tags.join(', ')}</span></div>
                            )}
                            {client.notes && <div className="mb-1 text-gray-700">Notes: <span className="font-mono">{client.notes}</span></div>}
                        </div>
                    )}
                    {activeTab === 'invoices' && (
                        <div>
                            <div className="mb-2 font-semibold">Invoices</div>
                            <div className="mb-1">Total invoices: {client.invoiceCount || 0}</div>
                            <div className="mb-1">Total paid: £{client.totalPaid?.toLocaleString() || '0'}</div>
                            <div className="mb-1">Total owed: £{client.totalOwed?.toLocaleString() || '0'}</div>
                            <div className="mb-1">Last invoice: {client.lastInvoiceDate ? new Date(client.lastInvoiceDate).toLocaleDateString() : '-'}</div>
                            {/* Add quick filters, invoice table, and link to create new invoice here */}
                        </div>
                    )}
                    {activeTab === 'payment' && (
                        <div>
                            <div className="mb-1">Payment Terms: {client.paymentTerms ? `Net ${client.paymentTerms}` : '-'}</div>
                            <div className="mb-1">Preferred Payment Method: {client.preferredPaymentMethod || '-'}</div>
                            <div className="mb-1">Currency: {client.currency || '-'}</div>
                            <div className="mb-1">Tax ID: {client.taxId || '-'}</div>
                        </div>
                    )}
                    {activeTab === 'activity' && (
                        <div>
                            <div className="mb-1">Created: {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}</div>
                            <div className="mb-1">Updated: {client.updatedAt ? new Date(client.updatedAt).toLocaleDateString() : '-'}</div>
                            {/* Add timeline, manual notes, and communication log here */}
                        </div>
                    )}
                </div>
                <div className="mt-6 flex gap-2">
                    {client.archived ? (
                        <button
                            onClick={() => onUnarchive(client.id)}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                            Unarchive
                        </button>
                    ) : (
                        <button
                            onClick={() => onArchive(client.id)}
                            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                        >
                            Archive
                        </button>
                    )}
                </div>
            </div>
        </AccessibleDialog>
    );
};

export default ClientDetailModal;
