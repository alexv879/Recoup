/**
 * Firebase Storage utilities
 * Handles file uploads and storage operations
 */

import { storage } from './firebase';

export interface UploadResult {
    url: string;
    path: string;
    size: number;
}

/**
 * Upload a file to Firebase Storage (using Admin SDK)
 */
export async function uploadFile(
    file: Buffer | File,
    path: string,
    metadata?: { contentType?: string }
): Promise<UploadResult> {
    if (!storage) {
        throw new Error('Firebase Storage is not available');
    }

    // Firebase Admin SDK uses bucket().file() instead of ref()
    const bucket = storage.bucket();
    const fileRef = bucket.file(path);

    // Convert File to Buffer if needed (for client-side File objects)
    const buffer = file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());

    await fileRef.save(buffer, {
        metadata: {
            contentType: metadata?.contentType || 'application/octet-stream',
        },
    });

    // Make the file publicly accessible and get download URL
    await fileRef.makePublic();
    const downloadURL = `https://storage.googleapis.com/${bucket.name}/${path}`;

    return {
        url: downloadURL,
        path: path,
        size: buffer.length,
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
    const file = new File([JSON.stringify(history)], fileName, {
        type: 'application/json',
    });

    return uploadFile(file, fileName);
}

// ============================================================================
// RECEIPT UPLOADS (NEW)
// ============================================================================

export const STORAGE_PATHS = {
    RECEIPTS: 'receipts',
    RECEIPTS_THUMBNAILS: 'receipts/thumbnails',
    AGENCY_HANDOFF: 'agency-handoff',
} as const;

const ALLOWED_RECEIPT_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/pdf',
];

const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate receipt file
 */
function validateReceiptFile(file: File): void {
    // Check file type
    if (!ALLOWED_RECEIPT_TYPES.includes(file.type)) {
        throw new Error(`Invalid file type. Allowed: ${ALLOWED_RECEIPT_TYPES.join(', ')}`);
    }

    // Check file size
    if (file.size > MAX_RECEIPT_SIZE) {
        throw new Error(`File too large. Maximum size: ${MAX_RECEIPT_SIZE / 1024 / 1024}MB`);
    }

    // Check file name
    if (!file.name || file.name.length > 255) {
        throw new Error('Invalid file name');
    }
}

/**
 * Sanitize filename to prevent path traversal
 */
function sanitizeFilename(filename: string): string {
    return filename
        .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace unsafe chars
        .replace(/\.{2,}/g, '_') // Prevent directory traversal
        .slice(0, 255); // Limit length
}

/**
 * Upload receipt file
 * @param userId - Owner user ID
 * @param expenseId - Associated expense ID
 * @param file - Receipt file (image or PDF)
 * @returns Upload result with URL and thumbnail URL (if image)
 */
export async function uploadReceiptFile(
    userId: string,
    expenseId: string,
    file: File
): Promise<{ url: string; thumbnailUrl?: string; path: string; size: number }> {
    // Validate file
    validateReceiptFile(file);

    // Generate safe path
    const timestamp = Date.now();
    const safeFilename = sanitizeFilename(file.name);
    const filePath = `${STORAGE_PATHS.RECEIPTS}/${userId}/${expenseId}/${timestamp}_${safeFilename}`;

    // Upload main file
    const result = await uploadFile(file, filePath, {
        contentType: file.type,
    });

    // TODO: Generate thumbnail for images (requires client-side canvas or server-side image processing)
    // For now, return without thumbnail
    return {
        url: result.url,
        path: result.path,
        size: result.size,
    };
}

/**
 * Upload multiple receipt files
 */
export async function uploadMultipleReceipts(
    userId: string,
    expenseId: string,
    files: File[]
): Promise<Array<{ url: string; thumbnailUrl?: string; path: string; size: number }>> {
    const results = [];

    for (const file of files) {
        try {
            const result = await uploadReceiptFile(userId, expenseId, file);
            results.push(result);
        } catch (error) {
            console.error('Failed to upload receipt:', file.name, error);
            // Continue with other files
        }
    }

    return results;
}

/**
 * Delete receipt file
 * @param path - Storage path to delete
 */
export async function deleteReceiptFile(path: string): Promise<void> {
    if (!storage) {
        throw new Error('Firebase Storage is not available');
    }

    try {
        const storageRef = ref(storage, path);
        const { deleteObject } = await import('firebase/storage');
        await deleteObject(storageRef);
    } catch (error) {
        console.error('Failed to delete receipt:', path, error);
        throw new Error('Failed to delete receipt file');
    }
}