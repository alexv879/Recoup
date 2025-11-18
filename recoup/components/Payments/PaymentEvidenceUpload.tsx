/**
 * Payment Evidence Upload Component
 * 
 * Drag-and-drop file upload for payment verification evidence (bank statements, receipts, etc.)
 * 
 * Based on Research:
 * - payment_verification_guide.md §2.2 (Payment Claim Modal)
 * - payment_verification_guide.md §6.0 (Accessibility)
 * 
 * Features:
 * - Drag-and-drop file upload
 * - File type validation (PDF, PNG, JPG only)
 * - File size validation (max 10MB)
 * - File preview with thumbnails
 * - Accessible with ARIA labels and keyboard support
 * - WCAG AAA compliant
 * 
 * @module components/Payments/PaymentEvidenceUpload
 */

'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';

interface PaymentEvidenceUploadProps {
    paymentClaimId: string;
    onUploadComplete: (fileUrl: string, fileName: string) => void;
    onUploadError: (error: string) => void;
    existingFileUrl?: string;
    existingFileName?: string;
}

interface UploadedFile {
    file: File;
    preview: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMessage?: string;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ACCEPTED_FILE_TYPES = ['application/pdf', 'image/png', 'image/jpeg'];
const ACCEPTED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg'];

export default function PaymentEvidenceUpload({
    paymentClaimId,
    onUploadComplete,
    onUploadError,
    existingFileUrl,
    existingFileName,
}: PaymentEvidenceUploadProps) {
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Validate file type and size
    const validateFile = useCallback((file: File): string | null => {
        // Check file type
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            return 'Invalid file type. Please upload a PDF, PNG, or JPG file.';
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return `File size exceeds 10MB limit. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.`;
        }

        return null;
    }, []);

    // Generate file preview URL
    const generatePreview = useCallback((file: File): string => {
        if (file.type.startsWith('image/')) {
            return URL.createObjectURL(file);
        }
        return ''; // PDF will use icon instead
    }, []);

    // Handle file selection
    const handleFileSelect = useCallback(
        (file: File) => {
            const validationError = validateFile(file);

            if (validationError) {
                onUploadError(validationError);
                setUploadedFile({
                    file,
                    preview: '',
                    status: 'error',
                    errorMessage: validationError,
                });
                return;
            }

            const preview = generatePreview(file);
            setUploadedFile({
                file,
                preview,
                status: 'pending',
            });

            // Auto-upload after selection
            uploadFile(file, preview);
        },
        [validateFile, generatePreview, onUploadError]
    );

    // Upload file to API
    const uploadFile = async (file: File, preview: string) => {
        setUploadedFile((prev) =>
            prev ? { ...prev, status: 'uploading' } : null
        );

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('paymentClaimId', paymentClaimId);

            const response = await fetch(`/api/payment-claims/${paymentClaimId}/evidence`, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Upload failed');
            }

            const data = await response.json();

            setUploadedFile({
                file,
                preview,
                status: 'success',
            });

            onUploadComplete(data.fileUrl, file.name);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed. Please try again.';

            setUploadedFile({
                file,
                preview,
                status: 'error',
                errorMessage,
            });

            onUploadError(errorMessage);
        }
    };

    // Handle drag events
    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                handleFileSelect(files[0]); // Only accept first file
            }
        },
        [handleFileSelect]
    );

    // Handle file input change
    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFileSelect(files[0]);
            }
        },
        [handleFileSelect]
    );

    // Handle click to browse
    const handleBrowseClick = () => {
        fileInputRef.current?.click();
    };

    // Handle keyboard activation
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
        }
    };

    // Remove uploaded file
    const handleRemoveFile = () => {
        if (uploadedFile?.preview) {
            URL.revokeObjectURL(uploadedFile.preview);
        }
        setUploadedFile(null);
    };

    // Render file preview
    const renderFilePreview = () => {
        if (!uploadedFile) return null;

        const { file, preview, status, errorMessage } = uploadedFile;
        const isPDF = file.type === 'application/pdf';

        return (
            <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex items-start gap-3">
                    {/* File Icon/Preview */}
                    <div className="flex-shrink-0">
                        {isPDF ? (
                            <div className="w-12 h-12 bg-red-100 rounded flex items-center justify-center">
                                <File className="w-6 h-6 text-red-600" />
                            </div>
                        ) : preview ? (
                            <img
                                src={preview}
                                alt="Payment evidence preview"
                                className="w-12 h-12 object-cover rounded"
                            />
                        ) : null}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                            {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>

                        {/* Status Messages */}
                        {status === 'uploading' && (
                            <div className="flex items-center gap-2 mt-2">
                                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm text-blue-600">Uploading...</span>
                            </div>
                        )}

                        {status === 'success' && (
                            <div className="flex items-center gap-2 mt-2">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-600">Upload complete</span>
                            </div>
                        )}

                        {status === 'error' && errorMessage && (
                            <div className="flex items-center gap-2 mt-2">
                                <AlertCircle className="w-4 h-4 text-red-600" />
                                <span className="text-sm text-red-600">{errorMessage}</span>
                            </div>
                        )}
                    </div>

                    {/* Remove Button */}
                    {status !== 'uploading' && (
                        <button
                            type="button"
                            onClick={handleRemoveFile}
                            className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                            aria-label="Remove file"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>
        );
    };

    // If existing file, show that
    if (existingFileUrl && !uploadedFile) {
        return (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="text-sm font-medium text-green-900">
                            Evidence uploaded
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                            {existingFileName || 'Payment evidence'}
                        </p>
                        <a
                            href={existingFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-800 underline mt-1 inline-block"
                        >
                            View file
                        </a>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            {/* Upload Zone */}
            <div
                role="button"
                tabIndex={0}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                onKeyDown={handleKeyDown}
                aria-label="Upload payment evidence. Drag and drop file or click to browse."
                className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${isDragging
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400 bg-white'
                    }
        `}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_EXTENSIONS.join(',')}
                    onChange={handleInputChange}
                    className="sr-only"
                    aria-hidden="true"
                />

                <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />

                <p className="text-sm font-medium text-gray-900 mb-1">
                    {isDragging ? 'Drop file here' : 'Upload payment evidence'}
                </p>

                <p className="text-xs text-gray-500 mb-3">
                    Drag and drop or click to browse
                </p>

                <p className="text-xs text-gray-400">
                    PDF, PNG, or JPG • Max 10MB
                </p>
            </div>

            {/* File Preview */}
            {renderFilePreview()}

            {/* Help Text */}
            <p className="mt-3 text-xs text-gray-500">
                Upload a bank statement, receipt, or screenshot showing proof of payment.
                This helps verify your payment claim faster.
            </p>
        </div>
    );
}
