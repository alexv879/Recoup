'use client';

import { KeyboardShortcutsProvider } from './KeyboardShortcutsProvider';
import { PWAProvider } from './PWA/PWAProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <PWAProvider>
            <KeyboardShortcutsProvider />
            {children}
        </PWAProvider>
    );
}