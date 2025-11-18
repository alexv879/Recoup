import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { sendWelcomeEmail } from '@/lib/onboarding-emails';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { formData } = body;

    // Update user profile with onboarding data
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data();

    await updateDoc(userRef, {
      businessName: formData.businessName,
      businessType: formData.businessType,
      industry: formData.industry,
      monthlyInvoices: formData.monthlyInvoices,
      mainGoal: formData.mainGoal,
      preferredCurrency: formData.preferredCurrency || 'GBP',
      'notifications.emailNotifications': formData.notificationPreference !== 'minimal',
      onboardingCompletedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Mark onboarding as complete
    const progressRef = doc(db, 'onboarding_progress', userId);
    await setDoc(progressRef, {
      userId,
      status: 'completed',
      completedAt: serverTimestamp(),
      formData,
    }, { merge: true });

    // Send welcome email
    if (userData?.email) {
      await sendWelcomeEmail(userData.email, {
        name: userData.name || formData.businessName,
        businessName: formData.businessName,
      });
    }

    // Track analytics event
    try {
      await fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'onboarding_completed',
          properties: {
            businessType: formData.businessType,
            industry: formData.industry,
            mainGoal: formData.mainGoal,
          },
        }),
      });
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error completing onboarding:', error);
    return NextResponse.json(
      { error: 'Failed to complete onboarding' },
      { status: 500 }
    );
  }
}
