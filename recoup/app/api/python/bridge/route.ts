import { NextResponse } from 'next/server';
import { getAuth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
    const secretHeader = request.headers.get('x-service-secret');
    // Require Clerk authentication for this proxy
    const authData = getAuth?.(request as any);
    const userId = authData?.userId;
    if (!userId) {
        return NextResponse.json({ error: 'Unauthenticated user' }, { status: 401 });
    }
    const expected = process.env.PY_PDF_SERVICE_SECRET || process.env.PY_SERVICE_SECRET;
    if (!expected || secretHeader !== expected) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.text();
    const target = process.env.PY_PDF_SERVICE_URL || 'http://127.0.0.1:8000/generate/test-pdf';

    try {
        const res = await fetch(target, { method: 'GET' });
        const data = await res.arrayBuffer();

        return new NextResponse(data, { status: res.status, headers: { 'Content-Type': 'application/pdf' } });
    } catch (e) {
        return NextResponse.json({ error: 'Error proxying request', details: String(e) }, { status: 502 });
    }
}
