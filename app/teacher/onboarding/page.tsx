'use client';

import { useRouter } from 'next/navigation';
import OnboardingCarousel from '@/components/onboarding/OnboardingCarousel';
import { markOnboardingComplete } from '@/app/actions/onboarding';

const teacherScreens = [
  {
    image: '/assets/onboarding/Upload - Teacher.png',
    alt: 'Upload Content - Teachers can upload PDFs and other learning materials',
  },
  {
    image: '/assets/onboarding/Share - Teacher.png',
    alt: 'Share Games - Create and share interactive games with your students',
  },
  {
    image: '/assets/onboarding/Track - Teacher.png',
    alt: 'Track Progress - Monitor student performance and learning outcomes',
  },
];

export default function TeacherOnboarding() {
  const router = useRouter();

  const handleComplete = async () => {
    // Mark onboarding as complete
    await markOnboardingComplete();

    // Redirect to teacher dashboard
    router.push('/teacher/dashboard');
  };

  return <OnboardingCarousel screens={teacherScreens} onComplete={handleComplete} />;
}
