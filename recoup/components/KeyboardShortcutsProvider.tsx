'use client';

import { useEffect } from 'react';
import { initializeKeyboardShortcuts } from '@/lib/accessibility';

export function KeyboardShortcutsProvider() {
    useEffect(() => {
        initializeKeyboardShortcuts();
    }, []);

    return null;
}