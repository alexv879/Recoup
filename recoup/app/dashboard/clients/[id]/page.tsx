'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/Custom/Card';
import { Button } from '@/components/Custom/Button';
import { trackEvent } from '@/lib/analytics';

interface Client {
    id: string;
    name: string;
    email: string;
    phoneNumber?: string;
    status: 'active' | 'archived';
    createdAt: any;
}

export default function ClientProfilePage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [client, setClient] = useState<Client | null>(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', phoneNumber: '' });

    useEffect(() => {
        fetchClient();
    }, [params.id]);

    async function fetchClient() {
        setLoading(true);
        try {
            const response = await fetch(`/api/clients/${params.id}`);
            if (!response.ok) {
                throw new Error('Failed to fetch client');
            }
            const data = await response.json();
            setClient(data);
            setForm({ name: data.name, email: data.email, phoneNumber: data.phoneNumber || '' });
        } catch (err) {
            console.error('Error fetching client:', err);
        } finally {
            setLoading(false);
        }
    }

    async function handleSave() {
        try {
            const response = await fetch(`/api/clients/${params.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(form),
            });

            if (!response.ok) {
                throw new Error('Failed to update client');
            }

            trackEvent('client_updated', { client_id: params.id });
            setEditMode(false);
            fetchClient();
        } catch (err) {
            console.error('Error updating client:', err);
        }
    }

    if (loading) {
        return <div className="text-center py-12">Loading client...</div>;
    }

    if (!client) {
        return <Card className="p-12 text-center">Client not found</Card>;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-900">Client Profile</h1>
                    <Link href="/dashboard/clients">
                        <Button variant="outline">← Back to Clients</Button>
                    </Link>
                </div>
            </div>
            <div className="container mx-auto px-4 py-8">
                <Card className="p-8">
                    {editMode ? (
                        <form className="space-y-4">
                            <input
                                type="text"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                placeholder="Name"
                                className="px-4 py-2 border rounded-lg w-full"
                            />
                            <input
                                type="email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                placeholder="Email"
                                className="px-4 py-2 border rounded-lg w-full"
                            />
                            <input
                                type="text"
                                value={form.phoneNumber}
                                onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
                                placeholder="Phone Number"
                                className="px-4 py-2 border rounded-lg w-full"
                            />
                            <div className="flex gap-2">
                                <Button type="button" onClick={handleSave}>Save</Button>
                                <Button type="button" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                            </div>
                        </form>
                    ) : (
                        <div>
                            <h2 className="text-2xl font-bold mb-2">{client.name}</h2>
                            <p className="mb-2">Email: {client.email}</p>
                            <p className="mb-2">Phone: {client.phoneNumber || 'N/A'}</p>
                            <p className="mb-2">Status: {client.status}</p>
                            <Button variant="outline" onClick={() => setEditMode(true)}>Edit</Button>
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
