/**
 * Payment Evidence Upload API
 * 
 * POST /api/payment-claims/[id]/evidence
 * 
 * Uploads evidence files (bank statements, receipts, screenshots) to Firebase Storage
 * and updates the payment claim with evidence metadata.
 * 
 * Based on Research:
 * - payment_verification_guide.md §2.2 (Payment Claim Modal)
 * - payment_verification_guide.md §8 (Technical Implementation)
 * 
 * Features:
 * - File validation (type, size)
 * - Firebase Storage upload
 * - Firestore metadata update
 * - Analytics event tracking
 * - Secure file URLs with expiration
 * 
 * @module app/api/payment-claims/[id]/evidence
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db, storage } from '@/lib/firebase';
import { Timestamp } from 'firebase-admin/firestore';
import { trackServerEvent } from '@/lib/analytics-server';
import { handleApiError } from '@/utils/error';
import { logApiRequest, logApiResponse } from '@/utils/logger';

export const dynamic = 'force-dynamic';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_MIME_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];

/**
 * Upload payment evidence file
 * POST /api/payment-claims/[id]/evidence
 */
export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        logApiRequest('POST', `/api/payment-claims/${(await params).id}/evidence`);

        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: claimId } = await params;

        // Get payment claim
        const claimRef = db.doc(`payment_claims/${claimId}`);
        const claimSnap = await claimRef.get();

        if (!claimSnap.exists) {
            return NextResponse.json(
                { error: 'NOT_FOUND', message: 'Payment claim not found' },
                { status: 404 }
            );
        }

        const claim = claimSnap.data()!;

        // Verify ownership - only the freelancer who owns the invoice can upload evidence
        // OR the client who created the claim can upload evidence
        if (claim.freelancerId !== userId && claim.clientId !== userId) {
            return NextResponse.json(
                {
                    error: 'FORBIDDEN',
                    message: 'You do not have permission to upload evidence to this claim'
                },
                { status: 403 }
            );
        }

        // Parse form data
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json(
                { error: 'MISSING_FILE', message: 'No file provided' },
                { status: 400 }
            );
        }

        // Validate file type
        if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
            return NextResponse.json(
                {
                    error: 'INVALID_FILE_TYPE',
                    message: 'Invalid file type. Only PDF, PNG, and JPG files are accepted.',
                },
                { status: 400 }
            );
        }

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                {
                    error: 'FILE_TOO_LARGE',
                    message: `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`,
                },
                { status: 400 }
            );
        }

        // Generate unique filename
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop() || 'bin';
        const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `payment-evidence/${claimId}/${timestamp}-${sanitizedOriginalName}`;

        // Upload to Firebase Storage
        const bucket = storage!.bucket();
        const fileRef = bucket.file(filename);
        const fileBuffer = await file.arrayBuffer();

        await fileRef.save(Buffer.from(fileBuffer), {
            contentType: file.type,
            metadata: {
                metadata: {
                    uploadedBy: userId,
                    claimId: claimId,
                    originalName: file.name,
                    uploadedAt: new Date().toISOString(),
                },
            },
        });

        // Get download URL (signed URL for temporary access)
        const [downloadURL] = await fileRef.getSignedUrl({
            action: 'read',
            expires: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Update payment claim with evidence metadata
        await claimRef.update({
            evidenceFileUrl: downloadURL,
            evidenceFileName: file.name,
            evidenceFileSize: file.size,
            evidenceFileType: file.type,
            evidenceUploadedAt: Timestamp.now(),
            evidenceUploadedBy: userId,
            updatedAt: Timestamp.now(),
        });

        // Track analytics event
        await trackServerEvent('payment_evidence_uploaded', {
            claim_id: claimId,
            invoice_id: claim.invoiceId,
            file_type: file.type,
            file_size: file.size,
            file_name: file.name,
        }, userId);

        // Log response
        const duration = Date.now() - startTime;
        logApiResponse('POST', `/api/payment-claims/${claimId}/evidence`, 200, {
            duration,
        });

        return NextResponse.json({
            success: true,
            message: 'Evidence uploaded successfully',
            fileUrl: downloadURL,
            fileName: file.name,
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        logApiResponse('POST', `/api/payment-claims/${(await params).id}/evidence`, 500, {
            duration,
        });
        const { status, body } = await handleApiError(error);
        return NextResponse.json(body, { status });
    }
}

/**
 * Get payment evidence details
 * GET /api/payment-claims/[id]/evidence
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    const startTime = Date.now();

    try {
        logApiRequest('GET', `/api/payment-claims/${(await params).id}/evidence`);

        // Authenticate user
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json(
                { error: 'UNAUTHORIZED', message: 'Authentication required' },
                { status: 401 }
            );
        }

        const { id: claimId } = await params;

        // Get payment claim
        const claimRef = db.doc(`payment_claims/${claimId}`);
        const claimSnap = await claimRef.get();

        if (!claimSnap.exists) {
            return NextResponse.json(
                { error: 'NOT_FOUND', message: 'Payment claim not found' },
                { status: 404 }
            );
        }

        const claim = claimSnap.data()!;

        // Check if evidence exists
        if (!claim.evidenceFileUrl) {
            return NextResponse.json(
                { error: 'NO_EVIDENCE', message: 'No evidence uploaded for this claim' },
                { status: 404 }
            );
        }

        // Log response
        const duration = Date.now() - startTime;
        logApiResponse('GET', `/api/payment-claims/${claimId}/evidence`, 200, {
            duration,
        });

        return NextResponse.json({
            fileUrl: claim.evidenceFileUrl,
            fileName: claim.evidenceFileName,
            fileSize: claim.evidenceFileSize,
            fileType: claim.evidenceFileType,
            uploadedAt: claim.evidenceUploadedAt?.toDate().toISOString(),
            uploadedBy: claim.evidenceUploadedBy,
        });
    } catch (error) {
        const duration = Date.now() - startTime;
        logApiResponse('GET', `/api/payment-claims/${(await params).id}/evidence`, 500, {
            duration,
        });
        const { status, body } = await handleApiError(error);
        return NextResponse.json(body, { status });
    }
}
