/**
 * Firebase Storage utilities
 * Handles file uploads and storage operations
 * Uses Firebase Admin SDK for server-side storage operations
 */

import { storage } from './firebase';

export interface UploadResult {
    url: string;
    path: string;
    size: number;
}

/**
 * Upload a file to Firebase Storage (Admin SDK)
 * @param fileData - Buffer or Uint8Array containing file data
 * @param path - Storage path for the file
 * @param metadata - Optional metadata including contentType
 */
export async function uploadFile(
    fileData: Buffer | Uint8Array | string,
    path: string,
    metadata?: { contentType?: string }
): Promise<UploadResult> {
    if (!storage) {
        throw new Error('Firebase Storage is not available');
    }

    const bucket = storage.bucket();
    const fileRef = bucket.file(path);

    // Convert string to Buffer if needed
    const buffer = typeof fileData === 'string' ? Buffer.from(fileData) : fileData;

    await fileRef.save(buffer, {
        metadata: metadata,
        contentType: metadata?.contentType,
    });

    // Get signed URL for download (valid for 7 days)
    const [url] = await fileRef.getSignedUrl({
        action: 'read',
        expires: Date.now() + 7 * 24 * 3600 * 1000, // 7 days
    });

    const [metadataResult] = await fileRef.getMetadata();

    return {
        url,
        path: fileRef.name,
        size: metadataResult.size ? Number(metadataResult.size) : 0,
    };
}

/**
 * Upload communication history for agency handoff
 */
export async function uploadCommunicationHistory(
    userId: string,
    invoiceId: string,
    history: any
): Promise<UploadResult> {
    const fileName = `agency-handoff/${userId}/${invoiceId}/${Date.now()}.json`;
    const jsonData = JSON.stringify(history);

    return uploadFile(jsonData, fileName, {
        contentType: 'application/json',
    });
}
