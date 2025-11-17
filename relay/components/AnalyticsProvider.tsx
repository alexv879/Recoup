/**
 * ANALYTICS PROVIDER
 * Initializes analytics on app startup
 * Based on: MASTER_IMPLEMENTATION_AUDIT_V1.md §4.8
 */

'use client';

import React, { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { initializeAnalytics, identifyUser } from '@/lib/analytics';
import { logInfo } from '@/utils/logger';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  // Initialize analytics on mount
  useEffect(() => {
    initializeAnalytics().then(() => {
      logInfo('Analytics initialized');
    });
  }, []);

  // Identify user when logged in
  useEffect(() => {
    if (isLoaded && user) {
      identifyUser(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName || undefined,
        created_at: user.createdAt?.toISOString(),
        // Add subscription tier from user metadata if available
        subscription_tier: (user.publicMetadata?.subscriptionTier as string) || 'free',
        is_founding_member: user.publicMetadata?.isFoundingMember as boolean,
      });
    }
  }, [isLoaded, user]);

  return <>{children}</>;
}
