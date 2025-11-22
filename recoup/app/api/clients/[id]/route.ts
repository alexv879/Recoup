import { NextRequest, NextResponse } from 'next/server';
import { getClientDetails, updateClient } from '@/services/clientService.server';
import { auth } from '@clerk/nextjs/server';
import { trackEvent } from '@/lib/analytics';
import { logError } from '@/utils/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const client = await getClientDetails(id);
        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 });
        }

        // Check if user owns this client
        if ((client as any).ownerId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        return NextResponse.json(client);
    } catch (error) {
        logError('Error fetching client', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const updates = await request.json();

        // Verify client ownership before updating
        const existingClient = await getClientDetails(id);
        if (!existingClient || (existingClient as any).ownerId !== userId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await updateClient(id, updates);

        // Track the update event
        await trackEvent('client_updated', { client_id: id });

        return NextResponse.json({ success: true });
    } catch (error) {
        logError('Error updating client', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}