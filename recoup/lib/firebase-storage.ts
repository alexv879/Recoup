/**
 * Firebase Storage utilities
 * Handles file uploads and storage operations
 */

import { storage } from './firebase';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

export interface UploadResult {
    url: string;
    path: string;
    size: number;
}

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(
    file: File,
    path: string,
    metadata?: { contentType?: string }
): Promise<UploadResult> {
    if (!storage) {
        throw new Error('Firebase Storage is not available');
    }

    const storageRef = ref(storage, path);
    const uploadResult = await uploadBytes(storageRef, file, metadata);
    const downloadURL = await getDownloadURL(uploadResult.ref);

    return {
        url: downloadURL,
        path: uploadResult.ref.fullPath,
        size: uploadResult.metadata.size,
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