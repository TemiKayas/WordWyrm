'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface BackButtonProps {
  href?: string;
  onClick?: () => void;
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'text';
  className?: string;
}

export default function BackButton({
  href,
  onClick,
  children = 'Back',
  variant = 'primary',
  className = ''
}: BackButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const baseStyles = "inline-flex items-center gap-2 font-quicksand font-bold transition-all duration-150 cursor-pointer";

  const variantStyles = {
    primary: "bg-[#fd9227] border-[3px] border-[#cc7425] shadow-[0_6px_0_0] shadow-[#cc7425] active:shadow-[0_2px_0_0] active:translate-y-1 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0] rounded-[15px] h-[38px] px-4 text-white hover:bg-[#ffa447]",
    secondary: "bg-[#473025] border-[3px] border-[#2d1f18] shadow-[0_6px_0_0] shadow-[#2d1f18] active:shadow-[0_2px_0_0] active:translate-y-1 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0] rounded-[15px] h-[38px] px-4 text-[#fffbf6] hover:bg-[#5a3d2e]",
    text: "text-[#473025]/60 hover:text-[#473025] text-[14px]"
  };

  return (
    <button
      onClick={handleClick}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      <ChevronLeft size={variant === 'text' ? 16 : 20} strokeWidth={2} />
      <span className={variant === 'text' ? 'text-[14px]' : 'text-[14px]'}>
        {children}
      </span>
    </button>
  );
}
