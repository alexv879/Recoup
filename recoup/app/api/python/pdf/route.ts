import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    // Server-only proxy that forwards to a Python microservice running locally or in your infra
    const serviceUrl = process.env.PY_PDF_SERVICE_URL || 'http://127.0.0.1:8000/generate/test-pdf';

    try {
        const res = await fetch(serviceUrl);
        const buffer = await res.arrayBuffer();
        const headers: HeadersInit = {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename="pdf-test-sample.pdf"',
        };

        return new NextResponse(buffer, { status: res.status, headers });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch PDF from python service', details: String(e) }, { status: 500 });
    }
}
