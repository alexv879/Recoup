import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import OnboardingWizard from '@/components/onboarding/OnboardingWizard';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default async function OnboardingPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  // Check if user has already completed onboarding
  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);
  const userData = userDoc.data();

  if (userData?.onboardingCompletedAt) {
    // User already completed onboarding, redirect to dashboard
    redirect('/dashboard');
  }

  return <OnboardingWizard />;
}
