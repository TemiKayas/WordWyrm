'use client';

import PDFUploadForm from '@/app/teacher/components/PDFUploadForm';
import { Quiz } from '@/lib/processors/ai-generator';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuizGenerated: (data: { quizId: string; quiz: Quiz }) => void;
}

export default function UploadModal({ isOpen, onClose, onQuizGenerated }: UploadModalProps) {
  if (!isOpen) return null;

  const handleQuizGenerated = (data: { quizId: string; quiz: Quiz }) => {
    onQuizGenerated(data);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal content */}
      <div className="relative z-10 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="bg-cream rounded-[20px] p-6 sm:p-8 shadow-2xl border-4 border-brown">
          {/* close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-brown/10 hover:bg-brown/20 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-5 h-5 text-brown"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* title */}
          <h2 className="font-quicksand font-bold text-brown text-2xl sm:text-3xl mb-6 text-center">
            Upload PDF to Generate Quiz
          </h2>

          {/* upload form */}
          <PDFUploadForm
            onQuizGenerated={handleQuizGenerated}
          />
        </div>
      </div>
    </div>
  );
}
