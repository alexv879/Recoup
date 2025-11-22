/**
 * Firebase Storage utilities
 * Handles file uploads and storage operations
 */

import { getStorage } from 'firebase-admin/storage';

export interface UploadResult {
    success: boolean;
    storagePath?: string;
    url?: string;
    error?: string;
}

/**
 * Upload a file to Firebase Storage (Admin SDK)
 */
export async function uploadFile(
    fileBuffer: Buffer,
    path: string,
    metadata?: { contentType?: string }
): Promise<UploadResult> {
    try {
        const storage = getStorage();
        const bucket = storage.bucket();
        const file = bucket.file(path);

        await file.save(fileBuffer, {
            metadata: {
                contentType: metadata?.contentType || 'application/octet-stream',
            },
        });

        // Make the file publicly accessible
        await file.makePublic();

        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

        return {
            success: true,
            storagePath: path,
            url: publicUrl,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Upload communication history for agency handoff
 */
export async function uploadCommunicationHistory(params: {
    contentBuffer: Buffer;
    fileName: string;
    contentType: string;
    handoffId: string;
    freelancerId: string;
}): Promise<UploadResult> {
    const path = `agency-handoff/${params.freelancerId}/${params.handoffId}/${params.fileName}`;
    return uploadFile(params.contentBuffer, path, { contentType: params.contentType });
}

/**
 * Upload communication history (legacy signature for backward compatibility)
 */
export async function uploadCommunicationHistoryLegacy(
    userId: string,
    invoiceId: string,
    history: any
): Promise<UploadResult> {
    const fileName = `agency-handoff/${userId}/${invoiceId}/${Date.now()}.json`;
    const fileBuffer = Buffer.from(JSON.stringify(history), 'utf-8');

    return uploadFile(fileBuffer, fileName, { contentType: 'application/json' });
}
/**
 * List agency handoff documents for a user/invoice
 */
export async function listHandoffDocuments(
    handoffId: string,
    userId: string
): Promise<{ success: boolean; documents?: Array<{ storagePath: string; name: string }>; error?: string }> {
    try {
        const storage = getStorage();
        const bucket = storage.bucket();
        const prefix = `agency-handoff/${userId}/${handoffId}/`;

        const [files] = await bucket.getFiles({ prefix });
        const documents = files.map(file => ({
            storagePath: file.name,
            name: file.name.split('/').pop() || file.name,
        }));

        return {
            success: true,
            documents,
        };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}

/**
 * Delete a document from Firebase Storage
 */
export async function deleteDocument(path: string): Promise<{ success: boolean; error?: string }> {
    try {
        const storage = getStorage();
        const bucket = storage.bucket();
        const file = bucket.file(path);

        await file.delete();

        return { success: true };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
