'use client';

import { useEffect } from 'react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, type, onClose, duration = 3000 }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const toastStyles = {
    info: 'bg-[#ff9f22] border-[3px] border-[#730f11] text-white',
    success: 'bg-[#96b902] border-[3px] border-[#006029] text-white',
    warning: 'bg-[#fd9227] border-[3px] border-[#730f11] text-white',
    error: 'bg-[#ff3875] border-[3px] border-[#730f11] text-white',
  }[type];

  return (
    <div className="toast toast-center toast-top z-[9999]">
      <div className={`${toastStyles} shadow-lg min-w-[300px] max-w-[90vw] md:max-w-[500px] rounded-[15px] px-6 py-4`}>
        <span className="font-quicksand font-bold text-sm break-words">{message}</span>
      </div>
    </div>
  );
}
