import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SkipLink } from '@/lib/accessibility';
import { ClientProviders } from '@/components/ClientProviders';
// Import tracing setup to initialize OpenTelemetry
// import '@/lib/tracing';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Relay - Invoice & Payment Tracking',
  description: 'Smart invoicing and payment tracking for freelancers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en"> {/* This is explicitly set to 'en' for a single-language application. Consider dynamic setting for i18n. */}
        <body className={inter.className}>
          <SkipLink />
          <ClientProviders>
            <AnalyticsProvider>
              <ErrorBoundary>
                {children}
              </ErrorBoundary>
            </AnalyticsProvider>
          </ClientProviders>
        </body>
      </html>
    </ClerkProvider>
  );
}
