'use client';

import React, { useState, useEffect } from 'react';
import { OnboardingChecklist } from '@/components/Dashboard/OnboardingChecklist';
import { CelebrationModal } from '@/components/Dashboard/CelebrationModal';

interface DashboardClientProps {
    userId: string;
    summary: any;
}

export const DashboardClient: React.FC<DashboardClientProps> = ({ userId, summary }) => {
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationType, setCelebrationType] = useState<'onboarding' | 'firstInvoice' | null>(null);

    // Check if user has completed first invoice (for celebration)
    useEffect(() => {
        if (summary?.recentActivity?.recentInvoices?.length === 1) {
            const hasSeenCelebration = localStorage.getItem(`celebration_first_invoice_${userId}`);
            if (!hasSeenCelebration) {
                setCelebrationType('firstInvoice');
                setShowCelebration(true);
                localStorage.setItem(`celebration_first_invoice_${userId}`, 'true');
            }
        }
    }, [summary, userId]);

    const handleOnboardingComplete = () => {
        setCelebrationType('onboarding');
        setShowCelebration(true);
    };

    const handleCloseCelebration = () => {
        setShowCelebration(false);
        setCelebrationType(null);
    };

    // Don't show onboarding checklist if user has sent more than 5 invoices (experienced user)
    const showOnboarding = (summary?.recentActivity?.recentInvoices?.length || 0) < 5;

    return (
        <>
            {/* Onboarding Checklist */}
            {showOnboarding && (
                <OnboardingChecklist
                    userId={userId}
                    onComplete={handleOnboardingComplete}
                />
            )}

            {/* Celebration Modal */}
            {showCelebration && celebrationType === 'onboarding' && (
                <CelebrationModal
                    title="You're all set!"
                    message="You've completed your onboarding. Now start creating and sending invoices to get paid faster."
                    primaryAction={{
                        label: "Go to Invoices",
                        href: "/dashboard/invoices"
                    }}
                    secondaryAction={{
                        label: "View Analytics",
                        href: "/dashboard/analytics"
                    }}
                    onClose={handleCloseCelebration}
                />
            )}

            {showCelebration && celebrationType === 'firstInvoice' && (
                <CelebrationModal
                    title="Invoice Sent! 🎉"
                    message="Your first invoice has been sent successfully. Your client will receive it shortly and can pay online."
                    primaryAction={{
                        label: "View All Invoices",
                        href: "/dashboard/invoices"
                    }}
                    secondaryAction={{
                        label: "Add Another Client",
                        href: "/dashboard/invoices/new"
                    }}
                    onClose={handleCloseCelebration}
                />
            )}
        </>
    );
};
