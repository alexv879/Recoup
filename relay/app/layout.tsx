import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import './globals.css';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AnalyticsProvider } from '@/components/AnalyticsProvider';
import { SkipLink } from '@/lib/accessibility';

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
      <html lang="en">
        <body className={inter.className}>
          <SkipLink />
          <AnalyticsProvider>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </AnalyticsProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
