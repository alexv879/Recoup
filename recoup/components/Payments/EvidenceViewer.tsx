/**
 * Evidence Viewer Component
 *
 * Displays uploaded payment evidence (bank statements, receipts, screenshots) with
 * support for images and PDFs, zoom/enlarge capability, and download functionality.
 *
 * Research Source: PHASE_2_RESEARCH_VERIFICATION.md (Evidence viewing requirement)
 * Features:
 * - Image preview with zoom
 * - PDF viewer integration
 * - Download button
 * - Fullscreen mode
 * - Accessible alt text
 * - WCAG AA compliant
 *
 * @see PHASE_2_PROGRESS.md Task 3
 */

'use client';

import React, { useState } from 'react';
import {
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  FileText,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';

export interface EvidenceFile {
  /** File URL (from storage bucket) */
  url: string;
  /** Original filename */
  filename: string;
  /** File MIME type */
  mimeType: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Optional uploader info */
  uploadedBy?: {
    name: string;
    role: 'client' | 'freelancer';
  };
}

interface EvidenceViewerProps {
  /** Evidence file to display */
  evidence: EvidenceFile;
  /** Optional className for container */
  className?: string;
  /** Show download button */
  showDownload?: boolean;
  /** Show fullscreen button */
  showFullscreen?: boolean;
  /** Callback when download clicked */
  onDownload?: (file: EvidenceFile) => void;
}

/**
 * Get file type category from MIME type
 */
function getFileCategory(mimeType: string): 'image' | 'pdf' | 'unknown' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'unknown';
}

/**
 * Format file size to human-readable string
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Image Viewer - For PNG, JPG, JPEG files
 */
function ImageViewer({
  evidence,
  showDownload,
  showFullscreen,
  onDownload
}: EvidenceViewerProps) {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoomLevel(100);
  const handleDownload = () => onDownload?.(evidence);

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-gray-600" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {evidence.filename}
          </span>
          <span className="text-xs text-gray-500">
            ({formatFileSize(evidence.size)})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Zoom Controls */}
          <button
            onClick={handleZoomOut}
            disabled={zoomLevel <= 50}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom out"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs text-gray-700 min-w-[3rem] text-center">
            {zoomLevel}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={zoomLevel >= 200}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Zoom in"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleResetZoom}
            className="px-2 py-1.5 text-xs rounded hover:bg-gray-200"
            aria-label="Reset zoom to 100%"
          >
            Reset
          </button>

          {/* Fullscreen */}
          {showFullscreen && (
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 rounded hover:bg-gray-200 ml-1"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <X className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}

          {/* Download */}
          {showDownload && (
            <button
              onClick={handleDownload}
              className="p-1.5 rounded hover:bg-gray-200 ml-1"
              aria-label="Download file"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Image Preview */}
      <div
        className={`
          relative overflow-auto rounded-lg border border-gray-200 bg-gray-50
          ${isFullscreen ? 'fixed inset-0 z-50 bg-black/90 border-0 rounded-none' : 'max-h-[500px]'}
        `}
      >
        <img
          src={evidence.url}
          alt={`Payment evidence: ${evidence.filename}`}
          className="mx-auto transition-transform duration-200"
          style={{
            transform: `scale(${zoomLevel / 100})`,
            transformOrigin: 'center top'
          }}
          loading="lazy"
        />

        {isFullscreen && (
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100"
            aria-label="Close fullscreen"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-2 text-xs text-gray-600">
        Uploaded {evidence.uploadedAt.toLocaleDateString()} at{' '}
        {evidence.uploadedAt.toLocaleTimeString()}
        {evidence.uploadedBy && (
          <> by {evidence.uploadedBy.name} ({evidence.uploadedBy.role})</>
        )}
      </div>
    </div>
  );
}

/**
 * PDF Viewer - For PDF files
 */
function PDFViewer({
  evidence,
  showDownload,
  onDownload
}: EvidenceViewerProps) {
  const handleDownload = () => onDownload?.(evidence);
  const handleOpenInNewTab = () => window.open(evidence.url, '_blank');

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 mb-3 p-2 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-red-600" />
          <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
            {evidence.filename}
          </span>
          <span className="text-xs text-gray-500">
            ({formatFileSize(evidence.size)})
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* Open in New Tab */}
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1 px-3 py-1.5 text-xs rounded hover:bg-gray-200"
            aria-label="Open PDF in new tab"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </button>

          {/* Download */}
          {showDownload && (
            <button
              onClick={handleDownload}
              className="p-1.5 rounded hover:bg-gray-200"
              aria-label="Download PDF"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PDF Embed */}
      <div className="relative rounded-lg border border-gray-200 bg-gray-50 overflow-hidden">
        <iframe
          src={evidence.url}
          className="w-full h-[500px]"
          title={`Payment evidence PDF: ${evidence.filename}`}
          aria-label="PDF document viewer"
        />
      </div>

      {/* Metadata */}
      <div className="mt-2 text-xs text-gray-600">
        Uploaded {evidence.uploadedAt.toLocaleDateString()} at{' '}
        {evidence.uploadedAt.toLocaleTimeString()}
        {evidence.uploadedBy && (
          <> by {evidence.uploadedBy.name} ({evidence.uploadedBy.role})</>
        )}
      </div>
    </div>
  );
}

/**
 * Unknown File Type Viewer - Fallback for unsupported formats
 */
function UnknownFileViewer({
  evidence,
  showDownload,
  onDownload
}: EvidenceViewerProps) {
  const handleDownload = () => onDownload?.(evidence);

  return (
    <div className="p-8 text-center border border-gray-200 rounded-lg bg-gray-50">
      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-sm font-medium text-gray-900 mb-1">{evidence.filename}</p>
      <p className="text-xs text-gray-600 mb-4">
        {evidence.mimeType} ({formatFileSize(evidence.size)})
      </p>
      <p className="text-sm text-gray-600 mb-4">
        This file type cannot be previewed in the browser.
      </p>

      {showDownload && (
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          aria-label="Download file to view"
        >
          <Download className="w-4 h-4" />
          Download to View
        </button>
      )}
    </div>
  );
}

/**
 * EvidenceViewer - Main component that routes to appropriate viewer
 *
 * Displays payment evidence with support for images, PDFs, and download functionality.
 *
 * @example
 * ```tsx
 * const evidence: EvidenceFile = {
 *   url: 'https://storage.example.com/evidence/receipt.pdf',
 *   filename: 'payment-receipt.pdf',
 *   mimeType: 'application/pdf',
 *   size: 1024000,
 *   uploadedAt: new Date(),
 *   uploadedBy: { name: 'John Client', role: 'client' }
 * };
 *
 * <EvidenceViewer
 *   evidence={evidence}
 *   showDownload
 *   showFullscreen
 *   onDownload={(file) => {
 *     // Trigger download
 *     window.open(file.url, '_blank');
 *   }}
 * />
 * ```
 */
export function EvidenceViewer({
  evidence,
  className = '',
  showDownload = true,
  showFullscreen = true,
  onDownload
}: EvidenceViewerProps) {
  const fileCategory = getFileCategory(evidence.mimeType);

  return (
    <div className={className}>
      {fileCategory === 'image' && (
        <ImageViewer
          evidence={evidence}
          showDownload={showDownload}
          showFullscreen={showFullscreen}
          onDownload={onDownload}
        />
      )}

      {fileCategory === 'pdf' && (
        <PDFViewer
          evidence={evidence}
          showDownload={showDownload}
          onDownload={onDownload}
        />
      )}

      {fileCategory === 'unknown' && (
        <UnknownFileViewer
          evidence={evidence}
          showDownload={showDownload}
          onDownload={onDownload}
        />
      )}
    </div>
  );
}

/**
 * Compact Evidence Preview - For use in lists/cards
 */
export function EvidencePreviewCompact({ evidence }: { evidence: EvidenceFile }) {
  const fileCategory = getFileCategory(evidence.mimeType);
  const Icon = fileCategory === 'image' ? ImageIcon : FileText;

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
      <Icon className="w-4 h-4 text-gray-600 flex-shrink-0" />
      <span className="text-sm text-gray-900 truncate flex-1">{evidence.filename}</span>
      <span className="text-xs text-gray-500 flex-shrink-0">
        {formatFileSize(evidence.size)}
      </span>
    </div>
  );
}

export default EvidenceViewer;
