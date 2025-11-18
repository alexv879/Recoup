import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { currentStep, completedSteps, formData } = body;

    // Save onboarding progress to Firestore
    const progressRef = doc(db, 'onboarding_progress', userId);
    await setDoc(progressRef, {
      userId,
      currentStep,
      completedSteps: completedSteps || [],
      formData: formData || {},
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    }, { merge: true });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving onboarding progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}
