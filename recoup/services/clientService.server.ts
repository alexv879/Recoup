// Server-side ClientService: Direct Firebase operations for API routes
// Based on Document 11 requirements and client_management_guide.md
// This service is used by API routes and should NOT be imported by client components

import { db } from '@/lib/firebase';
import { Client } from '@/types/models';
import { COLLECTIONS } from '@/lib/firebase';

export async function addClient(userId: string, clientData: Partial<Client>) {
    // Add new client to database
    const docRef = await db.collection(COLLECTIONS.CLIENTS).add({
        ...clientData,
        ownerId: userId,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    });

    return docRef.id;
}

export async function updateClient(clientId: string, updates: Partial<Client>) {
    // Update client details
    await db.collection(COLLECTIONS.CLIENTS).doc(clientId).update({
        ...updates,
        updatedAt: new Date().toISOString(),
    });
}

export async function archiveClient(clientId: string) {
    // Archive client (soft delete)
    await db.collection(COLLECTIONS.CLIENTS).doc(clientId).update({ archived: true });
}

export async function deleteClient(clientId: string) {
    // Permanently delete client
    await db.collection(COLLECTIONS.CLIENTS).doc(clientId).delete();
}

export async function getClients(userId: string, search: string = '', page: number = 1, pageSize: number = 20, filters: any = {}) {
    // Paginated, searchable client list with advanced filters
    let query = db.collection(COLLECTIONS.CLIENTS).where('ownerId', '==', userId);
    if (filters.status) {
        query = query.where('status', '==', filters.status);
    } else {
        query = query.where('archived', '==', false);
    }
    if (search && search.length >= 2) {
        // Search by name, email, company, phone, invoice number
        // Firestore doesn't support OR queries, so fetch and filter client-side
        const snapshot = await query.get();
        const allClients: Client[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Client));
        const filtered = allClients.filter((client) => {
            const term = search.toLowerCase();
            return (
                client.name?.toLowerCase().includes(term) ||
                client.email?.toLowerCase().includes(term) ||
                client.company?.toLowerCase().includes(term) ||
                client.phone?.toLowerCase().includes(term) ||
                client.poNumber?.toLowerCase().includes(term)
            );
        });
        return filtered.slice((page - 1) * pageSize, page * pageSize);
    } else {
        const snapshot = await query.limit(pageSize).offset((page - 1) * pageSize).get();
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
}

export async function getClientDetails(clientId: string) {
    // Get client profile, payment history, contact info, invoice summary
    const doc = await db.collection(COLLECTIONS.CLIENTS).doc(clientId).get();
    if (!doc.exists) return null;
    const client = { id: doc.id, ...doc.data() };
    // Invoice summary join
    const invoicesSnap = await db.collection(COLLECTIONS.INVOICES)
        .where('clientId', '==', clientId)
        .get();
    const invoices = invoicesSnap.docs.map(inv => inv.data());
    (client as any).invoiceCount = invoices.length;
    (client as any).totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
    (client as any).totalOwed = invoices.filter(i => i.status !== 'paid').reduce((sum, i) => sum + (i.amount || 0), 0);
    (client as any).lastInvoiceDate = invoices.length ? invoices.reduce((latest, i) => i.createdAt > latest ? i.createdAt : latest, invoices[0].createdAt) : null;
    return client;
}