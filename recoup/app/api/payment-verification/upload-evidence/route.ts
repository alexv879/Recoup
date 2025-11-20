/**
 * PAYMENT VERIFICATION - EVIDENCE UPLOAD API
 * POST /api/payment-verification/upload-evidence
 *
 * Uploads proof of payment (bank statement, receipt, etc.)
 *
 * Maximum file size: 10MB
 * Allowed types: PDF, PNG, JPG, JPEG
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { BadRequestError, handleApiError, UnauthorizedError, ForbiddenError } from '@/utils/error';
import { logInfo, logError } from '@/utils/logger';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate user
    const { userId } = await auth();
    if (!userId) {
      throw new UnauthorizedError('Authentication required');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const invoiceId = formData.get('invoiceId') as string;

    if (!file) {
      throw new BadRequestError('No file provided');
    }

    if (!invoiceId) {
      throw new BadRequestError('Invoice ID required');
    }

    // 2. Verify access - user must be either:
    //    a) The client associated with the invoice (for uploading payment evidence)
    //    b) The freelancer who owns the invoice (for viewing purposes)
    const invoiceDoc = await db.collection('invoices').doc(invoiceId).get();

    if (!invoiceDoc.exists) {
      throw new BadRequestError('Invoice not found');
    }

    const invoice = invoiceDoc.data();
    const isFreelancer = invoice?.freelancerId === userId;
    const isClient = invoice?.clientId === userId;

    // Only allow upload if user is the client
    if (!isClient && !isFreelancer) {
      throw new ForbiddenError('You do not have permission to upload evidence for this invoice');
    }

    if (!isClient) {
      throw new ForbiddenError('Only the client can upload payment evidence');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      throw new BadRequestError('File too large. Maximum size is 10MB.');
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new BadRequestError('Invalid file type. Allowed: PDF, PNG, JPG, JPEG');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const extension = file.name.split('.').pop();
    const filename = `evidence_${invoiceId}_${timestamp}_${randomString}.${extension}`;

    // Save file to public/uploads/payment-evidence
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'payment-evidence');

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const filepath = join(uploadDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    // Generate URL
    const fileUrl = `/uploads/payment-evidence/${filename}`;

    logInfo('Payment evidence uploaded', {
      invoiceId,
      filename,
      fileSize: file.size,
      fileType: file.type,
    });

    return NextResponse.json({
      success: true,
      url: fileUrl,
      filename,
    });

  } catch (error) {
    logError('Evidence upload failed', error as Error);
    const { status, body } = await handleApiError(error);
    return NextResponse.json(body, { status });
  }
}
