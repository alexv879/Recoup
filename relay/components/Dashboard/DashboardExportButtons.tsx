import React, { useEffect, useState } from 'react';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';

export function DashboardExportButtons() {
    return (
        <div className="flex gap-4 mt-6">
            <Button as="a" href="/api/dashboard/export/csv" variant="outline" download>
                📥 Export CSV
            </Button>
            <Button as="a" href="/api/dashboard/export/pdf" variant="outline" download>
                📄 Export PDF
            </Button>
        </div>
    );
}
