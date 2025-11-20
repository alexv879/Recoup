'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/Custom/Card';
import { Button } from '@/components/Custom/Button';
import { Badge } from '@/components/Custom/Badge';
import { getClients, archiveClient } from '@/services/clientService';
import { trackEvent } from '@/lib/analytics';
import ClientManagement from '@/components/ClientManagement';
import ClientManagementButton from '@/components/Custom/ClientManagementButton';

interface Client {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    status: 'active' | 'archived';
    createdAt: any;
}

export default function ClientsPage() {
    // ...existing code...
    // Modal state for advanced client management
    const [showClientManagement, setShowClientManagement] = useState(false);

    // ...existing code...

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
                    <div className="flex gap-2">
                        <Link href="/dashboard/clients/new">
                            <Button>+ Add Client</Button>
                        </Link>
                        <ClientManagementButton onClick={() => setShowClientManagement(true)} />
                    </div>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                {/* Existing simple client list UI remains for legacy users */}
                {/* Advanced client management modal */}
                {showClientManagement && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6 relative">
                            <button
                                onClick={() => setShowClientManagement(false)}
                                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                                aria-label="Close client management"
                            >
                                ×
                            </button>
                            <ClientManagement />
                        </div>
                    </div>
                )}
                {/* ...existing code for search, bulk actions, and legacy list... */}
                {/* ...existing code... */}
            </div>
        </div>
    );
}
