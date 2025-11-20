import React, { useEffect, useState } from 'react';
import { Card } from '@/components/Custom/Card';
import { Button } from '@/components/Custom/Button';
import { trackEvent } from '@/lib/analytics';

export function DashboardExportButtons() {
    return (
        <div className="flex gap-4 mt-6">
            <a
                href="/api/dashboard/export/csv"
                download
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
                📥 Export CSV
            </a>
            <a
                href="/api/dashboard/export/pdf"
                download
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                    try {
                        trackEvent('pdf_exported', { source: 'ui_button' });
                    } catch (e) {
                        // ignore analytics errs
                    }
                }}
            >
                📄 Export PDF
            </a>
            {/* Track export intent from the client so we capture UX events quickly */}
            <script dangerouslySetInnerHTML={{
                __html: `
                            document.addEventListener('DOMContentLoaded', function() {
                                var btn = document.querySelector('a[href="/api/dashboard/export/pdf"]');
                                if (btn) {
                                    btn.addEventListener('click', function() {
                                        try { window?.trackEvent?.('pdf_exported', { source: 'ui_button' }); } catch (e) {}
                                    });
                                }
                            });
                        `}} />
        </div>
    );
}
