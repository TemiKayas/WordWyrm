'use client';

import { useRouter } from 'next/navigation';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import BackButton from '@/components/ui/BackButton';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <TeacherPageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[40px]">
            Settings
          </h1>
          <BackButton href="/teacher/dashboard" variant="text">Back to Dashboard</BackButton>
        </div>

        <div className="bg-white border-[4px] border-[#473025] rounded-[24px] p-8 shadow-lg">
          <div className="text-center py-12">
            <div className="w-[150px] h-[150px] mx-auto mb-6 relative">
              <img
                src="/assets/gaming-floop.png"
                alt="WordWyrm Character"
                className="w-full h-full object-contain"
              />
            </div>
            <h2 className="font-quicksand font-bold text-[#473025] text-[28px] mb-3">
              Settings Coming Soon
            </h2>
            <p className="font-quicksand text-[#a7613c] text-[16px] max-w-md mx-auto">
              We&apos;re working on bringing you personalization options, notification preferences, and account management features.
            </p>
          </div>
        </div>
      </div>
    </TeacherPageLayout>
  );
}
