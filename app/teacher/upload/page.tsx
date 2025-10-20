'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import PDFUploadForm from '@/app/teacher/components/PDFUploadForm';
import { Quiz } from '@/lib/processors/ai-generator';

export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleQuizGenerated = (quiz: Quiz) => {
    // Redirect to dashboard Games tab after successful quiz generation
    router.push('/teacher/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar title="Upload PDF" showSignOut={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-cream rounded-[20px] p-6 sm:p-8 shadow-lg border-4 border-brown">
          <h1 className="font-quicksand font-bold text-brown text-3xl sm:text-4xl mb-6 text-center">
            Upload PDF to Generate Quiz
          </h1>

          <PDFUploadForm
            onQuizGenerated={handleQuizGenerated}
            onFileSelect={setSelectedFile}
          />
        </div>
      </main>
    </div>
  );
}
