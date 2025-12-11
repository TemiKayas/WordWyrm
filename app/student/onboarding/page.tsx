'use client';

import { useRouter } from 'next/navigation';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import { markOnboardingComplete } from '@/app/actions/onboarding';

const studentScreens = [
  {
    image: '/assets/onboarding/Join Games - Student.png',
    alt: 'Join Games - Access fun educational games shared by your teachers',
  },
  {
    image: '/assets/onboarding/Coins - Student.png',
    alt: 'Earn Coins - Collect coins as you play and learn',
  },
  {
    image: '/assets/onboarding/Learn and Have Fun - Student.png',
    alt: 'Learn and Have Fun - Make learning exciting with interactive games',
  },
];

export default function StudentOnboarding() {
  const router = useRouter();

  const handleComplete = async () => {
    // Mark onboarding as complete
    await markOnboardingComplete();

    // Redirect to student dashboard
    router.push('/student/dashboard');
  };

  return <OnboardingCarousel screens={studentScreens} onComplete={handleComplete} />;
}
