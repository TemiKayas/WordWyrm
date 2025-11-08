'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadAndProcessPDF } from '@/app/actions/pdf';
import FileUploadDropZone from '@/components/fileupload/FileUploadDropZone';
import StepIndicator from '@/components/fileupload/StepIndicator';
import Button from '@/components/ui/Button';

interface PDFUploadFormProps {
  onFileSelect?: (file: File | File[] | null) => void;
}

export default function PDFUploadForm({ onFileSelect }: PDFUploadFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [progress, setProgress] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [subject, setSubject] = useState<string>('');

  // Redirect if no classId is provided
  useEffect(() => {
    if (!classId) {
      router.push('/teacher/dashboard');
    }
  }, [classId, router]);

  async function handleFileSelect(file: File | File[]) {
    const files = Array.isArray(file) ? file : [file];
    setSelectedFiles(files);
    setError(null);
    onFileSelect?.(file);
  }

  async function handleSubmit() {
    if (selectedFiles.length === 0) {
      setError('Please select at least one PDF file');
      return;
    }

    if (!classId) {
      setError('Class ID is missing. Redirecting...');
      setTimeout(() => router.push('/teacher/dashboard'), 2000);
      return;
    }

    setError(null);
    setProgress(`Uploading ${selectedFiles.length} PDF(s)...`);

    startTransition(async () => {
      try {
        const quizIds: string[] = [];

        // Process each PDF one by one
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          setProgress(`Processing ${file.name} (${i + 1}/${selectedFiles.length})...`);

          const formData = new FormData();
          formData.append('pdf', file);
          formData.append('classId', classId);
          formData.append('numQuestions', numQuestions.toString());
          if (subject) {
            formData.append('subject', subject);
          }

          const result = await uploadAndProcessPDF(formData);

          if (!result.success) {
            setError(`Failed to process ${file.name}: ${result.error}`);
            setProgress('');
            return;
          }

          quizIds.push(result.data.quizId);
        }

        setProgress('All PDFs processed successfully! Redirecting...');
        // Redirect to game settings to review questions
        router.push(`/teacher/game-settings?quizId=${quizIds[0]}`);
      } catch {
        setError('An unexpected error occurred');
        setProgress('');
      }
    });
  }

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="mb-4 animate-fade-in flex justify-center">
        <StepIndicator step={1} title="Upload your PDF" />
      </div>

      {/* Progress and Error Messages */}
      {progress && (
        <div className="mb-3 p-2 bg-[#96b902]/10 border-2 border-[#96b902] rounded-lg animate-slide-up">
          <p className="text-[#7a9700] font-semibold text-center text-xs">{progress}</p>
        </div>
      )}

      {error && (
        <div className="mb-3 p-2 bg-red-100 border-2 border-error rounded-lg animate-slide-up">
          <p className="text-error font-semibold text-center text-xs">{error}</p>
        </div>
      )}

      {/* File Upload Drop Zone */}
      <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <FileUploadDropZone
          onFileSelect={handleFileSelect}
          disabled={isPending}
          maxSizeMB={25}
          multiple={true}
        />
      </div>

      {/* Selected Files Info */}
      {selectedFiles.length > 0 && !isPending && (
        <div className="mb-3 p-2 bg-[#fff6e8] border-2 border-[#ff9f22] rounded-lg animate-fade-in">
          <p className="text-[#473025] font-semibold text-xs mb-1">
            Selected {selectedFiles.length} file(s):
          </p>
          <div className="space-y-1 max-h-[80px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-xs">
                <span className="text-[#ff9f22] font-semibold truncate flex-1">{file.name}</span>
                <span className="text-[#473025] ml-2 text-[10px]">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subject Selection */}
      <div className="mb-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <label
          htmlFor="subject"
          className="block text-[#473025] font-bold text-sm mb-1"
        >
          Subject
        </label>
        <select
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isPending}
          className="w-full px-3 py-2 bg-[#fff6e8] border-2 border-[#473025] rounded-lg font-semibold text-[#473025] text-xs focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all disabled:opacity-50 cursor-pointer"
        >
          <option value="">General / No specific subject</option>
          <option value="ENGLISH">English</option>
          <option value="MATH">Math</option>
          <option value="SCIENCE">Science</option>
          <option value="HISTORY">History</option>
          <option value="LANGUAGE">Language</option>
        </select>
      </div>

      {/* Number of Questions */}
      <div className="mb-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <label
          htmlFor="numQuestions"
          className="block text-[#473025] font-bold text-sm mb-1"
        >
          Number of Questions
        </label>
        <select
          id="numQuestions"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          disabled={isPending}
          className="w-full px-3 py-2 bg-[#fff6e8] border-2 border-[#473025] rounded-lg font-semibold text-[#473025] text-xs focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all disabled:opacity-50 cursor-pointer"
        >
          <option value="3">3 questions</option>
          <option value="5">5 questions</option>
          <option value="10">10 questions</option>
          <option value="15">15 questions</option>
        </select>
      </div>

      {/* Generate Quiz Button */}
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || selectedFiles.length === 0}
        variant="success"
        size="md"
        className="w-full animate-slide-up"
        style={{ animationDelay: '0.4s' } as React.CSSProperties}
        isLoading={isPending}
      >
        {selectedFiles.length > 1 ? `Generate ${selectedFiles.length} Quizzes` : 'Generate Quiz'}
      </Button>
    </div>
  );
}
