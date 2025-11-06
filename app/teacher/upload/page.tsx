'use client';

import { Suspense } from 'react';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';
import PDFUploadForm from '@/app/teacher/components/PDFUploadForm';

export default function UploadPage() {
  return (
    <TeacherPageLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-cream rounded-[20px] p-6 sm:p-8 shadow-lg border-4 border-brown">
          <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
            <PDFUploadForm />
          </Suspense>
        </div>
      </div>
    </TeacherPageLayout>
  );
}
