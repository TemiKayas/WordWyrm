'use client';

import { useRouter } from 'next/navigation';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';

export default function SettingsPage() {
  const router = useRouter();

  return (
    <TeacherPageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[40px]">
            Settings
          </h1>
          <button
            onClick={() => router.push('/teacher/dashboard')}
            className="bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[11px] h-[45px] px-6 flex items-center gap-2 hover:bg-[#e6832b] transition-all cursor-pointer"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.5 15L7.5 10L12.5 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span className="font-quicksand font-bold text-white text-[16px]">
              Back to Dashboard
            </span>
          </button>
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
