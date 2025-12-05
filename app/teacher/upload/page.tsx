'use client';

import { Suspense } from 'react';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import PDFUploadForm from '@/app/teacher/components/PDFUploadForm';
import Image from 'next/image';

export default function UploadPage() {
  return (
    <TeacherPageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Image
              src="/assets/onboarding/27f0bc773218feb1f33fcb7da210f02c61215925.png"
              alt="AI Floopa"
              width={180}
              height={180}
              className="object-contain"
            />
          </div>
          <h1 className="font-quicksand font-bold text-[#473025] text-[36px] mb-3">
            Create Your Quiz
          </h1>
          <p className="font-quicksand text-[#473025] text-[18px] max-w-2xl mx-auto">
            Upload PDFs or paste text content to generate an AI-powered quiz for your students
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-[25px] p-8 sm:p-10 shadow-2xl border-[3px] border-[#473025]">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <PDFUploadForm />
          </Suspense>
        </div>
      </div>
    </TeacherPageLayout>
  );
}
