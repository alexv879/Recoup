'use client';

import { KeyboardShortcutsProvider } from './KeyboardShortcutsProvider';

export function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <>
            <KeyboardShortcutsProvider />
            {children}
        </>
    );
}