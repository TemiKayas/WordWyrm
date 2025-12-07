'use client';

import { Suspense } from 'react';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import PDFUploadForm from '@/app/teacher/components/PDFUploadForm';
import Image from 'next/image';

export default function UploadPage() {
  return (
    <TeacherPageLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        

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
