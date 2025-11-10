'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { uploadAndProcessMultiplePDFs } from '@/app/actions/pdf';
import FileUploadDropZone from '@/components/fileupload/FileUploadDropZone';
import StepIndicator from '@/components/fileupload/StepIndicator';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';

const MAX_TOTAL_SIZE_MB = 25;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

interface PDFUploadFormProps {
  onFileSelect?: (file: File | File[] | null) => void;
}

export default function PDFUploadForm({ onFileSelect }: PDFUploadFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const classId = searchParams.get('classId');
  const { showToast } = useToast();

  const [isPending, startTransition] = useTransition();
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

    // Validate total file size
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      showToast(
        `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds ${MAX_TOTAL_SIZE_MB}MB limit`,
        'error'
      );
      return;
    }

    setSelectedFiles(files);
    onFileSelect?.(file);
  }

  async function handleSubmit() {
    if (selectedFiles.length === 0) {
      showToast('Please select at least one PDF file', 'error');
      return;
    }

    if (!classId) {
      showToast('Class ID is missing. Redirecting...', 'error');
      setTimeout(() => router.push('/teacher/dashboard'), 2000);
      return;
    }

    // Validate total size again before submission
    const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      showToast(
        `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds ${MAX_TOTAL_SIZE_MB}MB limit`,
        'error'
      );
      return;
    }

    showToast(`Processing ${selectedFiles.length} PDF(s)...`, 'info');

    startTransition(async () => {
      try {
        const formData = new FormData();

        // Add all files
        selectedFiles.forEach(file => {
          formData.append('pdfs', file);
        });

        // Add metadata
        formData.append('classId', classId);
        formData.append('numQuestions', numQuestions.toString());
        if (subject) {
          formData.append('subject', subject);
        }

        const result = await uploadAndProcessMultiplePDFs(formData);

        if (!result.success) {
          showToast(`Failed to process PDFs: ${result.error}`, 'error');
          return;
        }

        showToast('All PDFs processed successfully! Redirecting...', 'success');
        // Redirect to game settings to review questions
        setTimeout(() => {
          router.push(`/teacher/game-settings?quizId=${result.data.quizId}`);
        }, 1500);
      } catch (error) {
        showToast('An unexpected error occurred', 'error');
      }
    });
  }

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div className="mb-4 animate-fade-in flex justify-center">
        <StepIndicator step={1} title="Upload your PDF" />
      </div>

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
          <div className="flex items-center justify-between mb-1">
            <p className="text-[#473025] font-semibold text-xs">
              Selected {selectedFiles.length} file(s)
            </p>
            <p className="text-[#473025] font-semibold text-xs">
              Total: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} / {MAX_TOTAL_SIZE_MB} MB
            </p>
          </div>
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
        {selectedFiles.length > 1 ? `Generate Combined Quiz (${selectedFiles.length} PDFs)` : 'Generate Quiz'}
      </Button>
    </div>
  );
}
