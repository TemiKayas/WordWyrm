'use client';

import { useState, useTransition, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processContentForQuiz } from '@/app/actions/pdf';
import FileUploadDropZone from '@/components/fileupload/FileUploadDropZone';
import StepIndicator from '@/components/fileupload/StepIndicator';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/providers/ToastProvider';
import { gsap } from 'gsap';
import ProcessingModal from '@/components/ui/ProcessingModal';

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
  const [textContent, setTextContent] = useState<string>('');

  // GSAP refs
  const stepRef = useRef<HTMLDivElement>(null);
  const uploadRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const subjectRef = useRef<HTMLDivElement>(null);
  const questionsRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLDivElement>(null);

  // Redirect if no classId is provided
  useEffect(() => {
    if (!classId) {
      router.push('/teacher/dashboard');
    }
  }, [classId, router]);

  // GSAP animations on mount
  useEffect(() => {
    const ctx = gsap.context(() => {
      const timeline = gsap.timeline();

      timeline
        .fromTo(stepRef.current,
          { y: -30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' }
        )
        .fromTo(uploadRef.current,
          { y: 30, opacity: 0, scale: 0.95 },
          { y: 0, opacity: 1, scale: 1, duration: 0.6, ease: 'back.out(1.7)' },
          '-=0.3'
        )
        .fromTo(textRef.current,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          '-=0.3'
        )
        .fromTo(subjectRef.current,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          '-=0.2'
        )
        .fromTo(questionsRef.current,
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, ease: 'power2.out' },
          '-=0.2'
        )
        .fromTo(buttonRef.current,
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, ease: 'back.out(1.7)' },
          '-=0.1'
        );
    });

    return () => ctx.revert();
  }, []);

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
    const hasText = textContent.trim().length > 0;
    const hasPDFs = selectedFiles.length > 0;

    if (!hasText && !hasPDFs) {
      showToast('Please provide text content or upload at least one PDF', 'error');
      return;
    }

    if (!classId) {
      showToast('Class ID is missing. Redirecting...', 'error');
      setTimeout(() => router.push('/teacher/dashboard'), 2000);
      return;
    }

    // Validate total size if PDFs provided
    if (hasPDFs) {
      const totalSize = selectedFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_TOTAL_SIZE_BYTES) {
        showToast(
          `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds ${MAX_TOTAL_SIZE_MB}MB limit`,
          'error'
        );
        return;
      }
    }

    // Show appropriate processing message
    let processingMessage = 'Processing content...';
    if (hasText && hasPDFs) {
      processingMessage = `Processing text and ${selectedFiles.length} PDF(s)...`;
    } else if (hasPDFs) {
      processingMessage = `Processing ${selectedFiles.length} PDF(s)...`;
    } else {
      processingMessage = 'Processing text content...';
    }
    showToast(processingMessage, 'info');

    startTransition(async () => {
      try {
        const formData = new FormData();

        // Add text content if provided
        if (hasText) {
          formData.append('textContent', textContent.trim());
        }

        // Add all files if provided
        selectedFiles.forEach(file => {
          formData.append('pdfs', file);
        });

        // Add metadata
        formData.append('classId', classId);
        formData.append('numQuestions', numQuestions.toString());
        if (subject) {
          formData.append('subject', subject);
        }

        const result = await processContentForQuiz(formData);

        if (!result.success) {
          showToast(`Failed to generate quiz: ${result.error}`, 'error');
          return;
        }

        showToast('Quiz generated successfully! Redirecting...', 'success');
        // Redirect to game settings to review questions
        setTimeout(() => {
          router.push(`/teacher/game-settings?quizId=${result.data.quizId}`);
        }, 1500);
      } catch {
        showToast('An unexpected error occurred', 'error');
      }
    });
  }

  return (
    <div className="w-full">
      {/* Step Indicator */}
      <div ref={stepRef} className="mb-6 flex justify-center opacity-0">
        <StepIndicator step={1} title="Add your content" />
      </div>

      {/* File Upload Drop Zone - Now at the top */}
      <div ref={uploadRef} className="mb-6 opacity-0">
        <FileUploadDropZone
          onFileSelect={handleFileSelect}
          disabled={isPending}
          maxSizeMB={25}
          multiple={true}
        />
      </div>

      {/* Selected Files Info */}
      {selectedFiles.length > 0 && !isPending && (
        <div className="mb-4 p-3 bg-[#fff6e8] border-2 border-[#ff9f22] rounded-lg animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[#473025] font-semibold text-sm">
              Selected {selectedFiles.length} file(s)
            </p>
            <p className="text-[#473025] font-semibold text-xs">
              Total: {(selectedFiles.reduce((sum, f) => sum + f.size, 0) / 1024 / 1024).toFixed(2)} / {MAX_TOTAL_SIZE_MB} MB
            </p>
          </div>
          <div className="space-y-1 max-h-[100px] overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <span className="text-[#ff9f22] font-semibold truncate flex-1">{file.name}</span>
                <span className="text-[#473025] ml-2 text-xs">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="flex items-center mb-6">
        <div className="flex-1 border-t-2 border-[#473025]/20"></div>
        <span className="px-4 text-[#473025]/60 font-bold text-sm">OR ADD TEXT</span>
        <div className="flex-1 border-t-2 border-[#473025]/20"></div>
      </div>

      {/* Text Input Area - Now below, without border */}
      <div ref={textRef} className="mb-6 opacity-0">
        <label
          htmlFor="textContent"
          className="block text-[#473025] font-bold text-base mb-2"
        >
          Text Content <span className="font-normal text-sm text-[#473025]/60">(optional if uploading PDF)</span>
        </label>
        <textarea
          id="textContent"
          value={textContent}
          onChange={(e) => setTextContent(e.target.value)}
          disabled={isPending}
          placeholder="Paste or type your educational content here... (vocabulary lists, notes, study material, etc.)"
          className="w-full px-4 py-3 bg-[#fffaf2] border-2 border-[#473025] rounded-xl font-medium text-[#473025] text-sm focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all disabled:opacity-50 resize-y min-h-[120px] max-h-[250px]"
          rows={5}
        />
        {textContent.trim().length > 0 && (
          <p className="text-[#473025]/60 text-xs mt-2">
            {textContent.trim().length} characters
          </p>
        )}
      </div>

      {/* Subject Selection */}
      <div ref={subjectRef} className="mb-4 opacity-0">
        <label
          htmlFor="subject"
          className="block text-[#473025] font-bold text-base mb-2"
        >
          Subject
        </label>
        <select
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          disabled={isPending}
          className="w-full px-4 py-3 bg-[#fff6e8] border-2 border-[#473025] rounded-xl font-semibold text-[#473025] text-sm focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all disabled:opacity-50 cursor-pointer"
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
      <div ref={questionsRef} className="mb-6 opacity-0">
        <label
          htmlFor="numQuestions"
          className="block text-[#473025] font-bold text-base mb-2"
        >
          Number of Questions
        </label>
        <select
          id="numQuestions"
          value={numQuestions}
          onChange={(e) => setNumQuestions(Number(e.target.value))}
          disabled={isPending}
          className="w-full px-4 py-3 bg-[#fff6e8] border-2 border-[#473025] rounded-xl font-semibold text-[#473025] text-sm focus:ring-4 focus:ring-[#96b902]/30 focus:border-[#96b902] transition-all disabled:opacity-50 cursor-pointer"
        >
          <option value="3">3 questions</option>
          <option value="5">5 questions</option>
          <option value="10">10 questions</option>
          <option value="15">15 questions</option>
        </select>
      </div>

      {/* Generate Quiz Button */}
      <div ref={buttonRef} className="opacity-0">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || (selectedFiles.length === 0 && textContent.trim().length === 0)}
          variant="success"
          size="lg"
          className="w-full"
          isLoading={isPending}
        >
          {(() => {
            const hasText = textContent.trim().length > 0;
            const hasPDFs = selectedFiles.length > 0;

            if (hasText && hasPDFs) {
              return selectedFiles.length > 1
                ? `Generate Quiz (Text + ${selectedFiles.length} PDFs)`
                : 'Generate Quiz (Text + PDF)';
            } else if (hasPDFs) {
              return selectedFiles.length > 1
                ? `Generate Quiz (${selectedFiles.length} PDFs)`
                : 'Generate Quiz';
            } else if (hasText) {
              return 'Generate Quiz from Text';
            } else {
              return 'Generate Quiz';
            }
          })()}
        </Button>
      </div>

      {/* Processing Modal */}
      <ProcessingModal
        isOpen={isPending}
        message="Creating your quiz... This may take a moment."
      />
    </div>
  );
}
