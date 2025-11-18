import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import MobileNav from '@/components/UI/MobileNav';
import FeedbackWidget from '@/components/feedback/FeedbackWidget';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <>
      <MobileNav />
      {children}
      <FeedbackWidget />
    </>
  );
}
