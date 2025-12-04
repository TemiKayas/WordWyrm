'use client';

import { useState, useRef, DragEvent, ChangeEvent } from 'react';
import FileUploadButton from './FileUploadButton';

/**
 * file upload drop zone component with drag and drop support
 * displays the cute worm character and handles pdf file validation
 *
 * props:
 * - onFileSelect: callback when a valid file is selected
 * - disabled: whether the drop zone is disabled
 * - maxSizeMB: maximum file size in megabytes
 */

interface FileUploadDropZoneProps {
  onFileSelect: (file: File | File[]) => void;
  disabled?: boolean;
  maxSizeMB?: number;
  multiple?: boolean;
}

export default function FileUploadDropZone({
  onFileSelect,
  disabled = false,
  maxSizeMB = 12,
  multiple = false,
}: FileUploadDropZoneProps) {
  // drag state for visual feedback
  const [isDragging, setIsDragging] = useState(false);
  // error message to display
  const [error, setError] = useState<string | null>(null);
  // reference to hidden file input element
  const fileInputRef = useRef<HTMLInputElement>(null);
  // gif key to force reload/replay
  const [gifKey, setGifKey] = useState(0);

  // validate file type and size
  const validateFile = (file: File): string | null => {
    // check if file is pdf
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF file';
    }
    // check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }
    return null;
  };

  // handle file selection and validation
  const handleFile = (file: File | FileList) => {
    if (file instanceof FileList) {
      // Handle multiple files
      const files = Array.from(file);
      const validFiles: File[] = [];

      for (const f of files) {
        const validationError = validateFile(f);
        if (validationError) {
          setError(`${f.name}: ${validationError}`);
          return;
        }
        validFiles.push(f);
      }

      setError(null);
      onFileSelect(validFiles);
      setGifKey(prev => prev + 1);
    } else {
      // Handle single file
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      onFileSelect(file);
      // restart the gif animation
      setGifKey(prev => prev + 1);
    }
  };

  // drag and drop event handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (multiple) {
        handleFile(files);
      } else {
        handleFile(files[0]);
      }
    }
  };

  // handle file input change
  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (multiple) {
        handleFile(files);
      } else {
        handleFile(files[0]);
      }
    }
  };

  // trigger hidden file input click
  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="relative w-full pt-16">
      {/* worm character - positioned above the container */}
      <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
        <img
          key={gifKey}
          src={`/assets/fileupload/eating.gif?autoplay=1&loop=1&t=${gifKey}`}
          alt="WordWyrm eating"
          width={150}
          height={150}
          className="object-contain"
          loading="eager"
        />
      </div>

      {/* container with brown border and cream background */}
      <div className="bg-[#fffcf8] border-[#473025] border-3 rounded-2xl p-4 shadow-[0px_2px_2px_0px_rgba(0,0,0,0.25)]">
        {/* drop zone with dashed border - changes color when dragging */}
        <div
          className={`
            bg-[#fff6e8] border-2 border-dashed rounded-xl
            transition-all duration-300 relative min-h-[140px] flex flex-col items-center justify-center pt-3
            ${isDragging ? 'border-[#96b902] bg-cream' : 'border-[#ffb554]'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleButtonClick}
        >
          {/* upload button */}
          <div className="mb-2">
            <FileUploadButton onClick={handleButtonClick} disabled={disabled} />
          </div>

          {/* helper text */}
          <p className="text-[#ff9f22] font-bold text-xs mb-2">or drop files here</p>

          {/* hidden file input - triggered by button or drop zone click */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileInput}
            disabled={disabled}
            multiple={multiple}
            className="hidden"
            aria-label="Upload PDF file"
          />
        </div>

        {/* supported format text */}
        <p className="text-[#ff9f22] font-bold text-[10px] text-center mt-2">
          Supported format: PDF (Max {maxSizeMB}MB)
        </p>

        {/* error message display */}
        {error && (
          <div className="mt-2 p-2 bg-red-100 border-2 border-error rounded-lg">
            <p className="text-error font-semibold text-[10px] text-center">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
