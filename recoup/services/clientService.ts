// ClientService: CRUD operations for client management
// Based on Document 11 requirements and client_management_guide.md
// Note: This service now calls API routes instead of direct Firebase access
// to avoid client-side Firebase bundling issues

import { Client } from '../types/models';

export async function addClient(userId: string, clientData: Partial<Client>) {
    // Add a new client via API route
    const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', ...clientData, userId }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add client');
    }

    const data = await response.json();
    return data.clientId;
}

export async function updateClient(clientId: string, updates: Partial<Client>) {
    const response = await fetch(`/api/clients/${clientId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update client');
    }
}

export async function archiveClient(clientId: string) {
    const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action: 'archive',
            clientId,
        }),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to archive client');
    }
}

export async function deleteClient(clientId: string) {
    const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete client');
    }
}

export async function getClients(userId: string, search: string = '', page: number = 1, pageSize: number = 20, filters: any = {}) {
    const params = new URLSearchParams({
        search,
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters.status && { status: filters.status }),
    });

    const response = await fetch(`/api/clients?${params}`);

    if (!response.ok) {
        throw new Error('Failed to fetch clients');
    }

    return await response.json();
}

export async function getClientDetails(clientId: string) {
    const response = await fetch(`/api/clients/${clientId}`);

    if (!response.ok) {
        if (response.status === 404) {
            return null;
        }
        throw new Error('Failed to fetch client details');
    }

    return await response.json();
}
