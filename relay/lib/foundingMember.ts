// Founding member discount code logic and Firestore sync
// Handles code redemption, assignment, and eligibility tracking

import { db } from '@/lib/firebase';
import { FOUNDING_MEMBER_LIMIT, FOUNDING_MEMBER_PRICING } from '@/utils/constants';
import { User } from '@/types/models';

export const FOUNDING_MEMBER_CODES = [
    // Example codes, replace with secure generation in production
    'RECOUP50-001', 'RECOUP50-002', 'RECOUP50-003', 'RECOUP50-004', 'RECOUP50-005',
    // ... up to 50
];

export async function redeemFoundingMemberCode(userId: string, code: string): Promise<{ success: boolean; message: string }> {
    // Check if code is valid and unused
    const codeIndex = FOUNDING_MEMBER_CODES.indexOf(code);
    if (codeIndex === -1) {
        return { success: false, message: 'Invalid code.' };
    }

    // Check if already assigned
    const snapshot = await db.collection('users').where('foundingMemberCode', '==', code).get();
    if (!snapshot.empty) {
        return { success: false, message: 'Code already used.' };
    }

    // Check if founding member limit reached
    const fmSnapshot = await db.collection('users').where('isFoundingMember', '==', true).get();
    if (fmSnapshot.size >= FOUNDING_MEMBER_LIMIT) {
        return { success: false, message: 'Founding member limit reached.' };
    }

    // Assign founding member status
    await db.collection('users').doc(userId).update({
        isFoundingMember: true,
        foundingMemberCode: code,
        foundingMemberNumber: fmSnapshot.size + 1,
        lockedInPrice: getLockedInPrice(),
        foundingMemberJoinedAt: new Date(),
    });

    return { success: true, message: 'Founding member discount applied.' };
}

function getLockedInPrice(): number {
    // Default to Starter tier price for demo
    return FOUNDING_MEMBER_PRICING.starter;
}

export async function getFoundingMemberCountdown(): Promise<number> {
    // Returns spots remaining
    const fmSnapshot = await db.collection('users').where('isFoundingMember', '==', true).get();
    return Math.max(0, FOUNDING_MEMBER_LIMIT - fmSnapshot.size);
}

// UI stub: get countdown for pricing page
export async function getFoundingMemberCountdownText(): Promise<string> {
    const spots = await getFoundingMemberCountdown();
    return `${spots} founding member spots remaining!`;
}
