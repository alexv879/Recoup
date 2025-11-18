import { NextRequest, NextResponse } from 'next/server';
import { getClients, archiveClient, addClient } from '@/services/clientService.server';
import { auth } from '@clerk/nextjs/server';
import { trackEvent } from '@/lib/analytics';

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '20');
        const status = searchParams.get('status');

        const filters = status ? { status } : {};

        const clients = await getClients(userId, search, page, pageSize, filters);

        return NextResponse.json(clients);
    } catch (error) {
        console.error('Error fetching clients:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { action, clientId, ...clientData } = body;

        if (action === 'add') {
            const newClientId = await addClient(userId, clientData);

            // Track the add event
            await trackEvent('client_added', { client_id: newClientId });

            return NextResponse.json({ clientId: newClientId });
        }

        if (action === 'archive' && clientId) {
            await archiveClient(clientId);

            // Track the archive event
            await trackEvent('client_archived', { client_id: clientId });

            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error performing client action:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}