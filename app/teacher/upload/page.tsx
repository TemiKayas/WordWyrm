'use client';

import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import PDFUploadForm from '@/app/teacher/components/PDFUploadForm';

export default function UploadPage() {
  const router = useRouter();

  const handleQuizGenerated = () => {
    // Redirect to dashboard Games tab after successful quiz generation
    router.push('/teacher/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar showSignOut={true} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-cream rounded-[20px] p-6 sm:p-8 shadow-lg border-4 border-brown">

          <PDFUploadForm
            onQuizGenerated={handleQuizGenerated}
          />
        </div>
      </main>
    </div>
  );
}
