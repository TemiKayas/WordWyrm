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

  const baseStyles = "inline-flex items-center gap-2 font-quicksand font-bold transition-all cursor-pointer";

  const variantStyles = {
    primary: "bg-[#fd9227] border-[1.5px] border-[#730f11] rounded-[8px] h-[38px] px-4 text-white hover:bg-[#e6832b]",
    secondary: "bg-[#473025] border-[3px] border-[#473025] rounded-[15px] py-2 px-4 text-[#fffbf6] hover:bg-[#5a3d2e]",
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
