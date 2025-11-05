'use client';

import TeacherPageLayout from '@/components/shared/TeacherPageLayout';

export default function DiscoverPage() {
  return (
    <TeacherPageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[32px] mb-6">
          Discover
        </h2>
        <div className="bg-white border-[3px] border-[#473025] rounded-[15px] p-8 text-center">
          <p className="font-quicksand text-[#a7613c] text-lg">
            Coming soon! Discover games and quizzes from other teachers.
          </p>
        </div>
      </div>
    </TeacherPageLayout>
  );
}
