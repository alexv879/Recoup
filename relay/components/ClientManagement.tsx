// Main Client Management UI integrating all features

import React, { useState, useEffect } from 'react';
import ClientSelector from './ClientSelector';
import ClientList from './ClientList';
import ClientDetailModal from './ClientDetailModal';
import ClientAnalytics from './ClientAnalytics';
import { Client } from '../types/client';
import * as clientService from '../services/clientService';

const USER_ID = 'currentUserId'; // TODO: Replace with actual user context

const ClientManagement: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analyticsEvent, setAnalyticsEvent] = useState<null | { event: string; clientId: string }>();
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<{ status?: string; tags?: string[] }>({});

    // Fetch clients from backend with search and filters
    useEffect(() => {
        setLoading(true);
        clientService.getClients(USER_ID, search, 1, 50, filters)
            .then(data => {
                setClients(data);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load clients');
                setLoading(false);
            });
    }, [search, filters]);

    const handleSelectClient = async (client: Client) => {
        try {
            setLoading(true);
            const details = await clientService.getClientDetails(client.id);
            setSelectedClient(details);
            setShowModal(true);
            setAnalyticsEvent({ event: 'select', clientId: client.id });
        } catch (err) {
            setError('Failed to load client details');
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewClient = async (name: string) => {
        try {
            setLoading(true);
            const newClientId = await clientService.addClient(USER_ID, { name });
            const newClient = await clientService.getClientDetails(newClientId);
            setClients([newClient, ...clients]);
            setSelectedClient(newClient);
            setShowModal(true);
            setAnalyticsEvent({ event: 'add', clientId: newClientId });
        } catch (err) {
            setError('Failed to add client');
        } finally {
            setLoading(false);
        }
    };

    const handleArchive = async (clientId: string) => {
        try {
            setLoading(true);
            await clientService.archiveClient(clientId);
            setClients(clients =>
                clients.map(c =>
                    c.id === clientId ? { ...c, archived: true } : c
                )
            );
            setAnalyticsEvent({ event: 'archive', clientId });
        } catch (err) {
            setError('Failed to archive client');
        } finally {
            setLoading(false);
        }
    };

    const handleUnarchive = async (clientId: string) => {
        try {
            setLoading(true);
            await clientService.updateClient(clientId, { archived: false });
            setClients(clients =>
                clients.map(c =>
                    c.id === clientId ? { ...c, archived: false } : c
                )
            );
            setAnalyticsEvent({ event: 'unarchive', clientId });
        } catch (err) {
            setError('Failed to unarchive client');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6">Client Management</h1>
            {loading && <div className="mb-4 text-blue-600">Loading...</div>}
            {error && <div className="mb-4 text-red-600">{error}</div>}
            <div className="mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <input
                    type="text"
                    placeholder="Search by name, email, company, phone, invoice, tags..."
                    className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-1/2"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    aria-label="Search clients"
                />
                <div className="flex gap-2 items-center">
                    <select
                        value={filters.status || ''}
                        onChange={e => setFilters(f => ({ ...f, status: e.target.value || undefined }))}
                        className="px-3 py-2 border rounded-lg"
                        aria-label="Filter by status"
                    >
                        <option value="">All Status</option>
                        <option value="active">Active</option>
                        <option value="archived">Archived</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {/* Example tag filter, could be replaced with multi-select */}
                    <input
                        type="text"
                        placeholder="Tags (comma separated)"
                        className="px-3 py-2 border rounded-lg"
                        value={filters.tags ? filters.tags.join(',') : ''}
                        onChange={e => setFilters(f => ({ ...f, tags: e.target.value ? e.target.value.split(',').map(t => t.trim()) : undefined }))}
                        aria-label="Filter by tags"
                    />
                    {(filters.status || (filters.tags && filters.tags.length > 0)) && (
                        <button
                            onClick={() => setFilters({})}
                            className="px-3 py-2 bg-gray-200 rounded-lg text-gray-700 font-semibold"
                            aria-label="Clear all filters"
                        >
                            Clear Filters
                        </button>
                    )}
                </div>
            </div>
            {/* Filter badges */}
            <div className="mb-2 flex gap-2">
                {filters.status && <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">Status: {filters.status}</span>}
                {filters.tags && filters.tags.length > 0 && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold">Tags: {filters.tags.join(', ')}</span>}
            </div>
            <ClientSelector
                clients={clients}
                onSelectClient={handleSelectClient}
                onAddNewClient={handleAddNewClient}
                selectedClient={selectedClient}
            />
            <div className="mt-8">
                <ClientList
                    clients={clients}
                    onSelect={handleSelectClient}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                    selectedClientId={selectedClient?.id}
                />
            </div>
            {showModal && (
                <ClientDetailModal
                    client={selectedClient}
                    onClose={() => setShowModal(false)}
                    onArchive={handleArchive}
                    onUnarchive={handleUnarchive}
                />
            )}
            {analyticsEvent && (
                <ClientAnalytics
                    event={analyticsEvent.event as any}
                    clientId={analyticsEvent.clientId}
                />
            )}
        </div>
    );
};

export default ClientManagement;
