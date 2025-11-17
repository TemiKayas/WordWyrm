import React from 'react';
import { COLORS } from '@/lib/constants/colors';

type ButtonVariant =
  | 'primary'      // Brown button
  | 'secondary'    // White/cream with brown border
  | 'success'      // Green button
  | 'play'         // Green play button (alias for success)
  | 'create'       // Red/pink create button
  | 'orange'       // Orange button
  | 'outline'      // Transparent with brown border
  | 'danger'       // Red button for delete actions
  | 'text'         // Transparent text button
  | 'back';        // Back button variant

type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled,
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}: ButtonProps) {
  const baseClasses = 'font-quicksand font-bold rounded-[15px] transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 shadow-[0_6px_0_0] active:shadow-[0_2px_0_0] active:translate-y-1 hover:-translate-y-0.5 hover:shadow-[0_8px_0_0]';

  const variantClasses = {
    primary: 'bg-[#473025] border-[3px] border-[#2d1f18] shadow-[#2d1f18] hover:bg-[#5a3d2e] text-white',
    secondary: 'bg-[#fffcf8] border-[3px] border-[#473025] shadow-[#473025] hover:bg-[#fff5e8] text-[#473025]',
    success: 'bg-[#95b607] border-[3px] border-[#006029] shadow-[#006029] hover:bg-[#a8cc00] text-white',
    play: 'bg-[#95b607] border-[3px] border-[#006029] shadow-[#006029] hover:bg-[#a8cc00] text-white',
    create: 'bg-[#ff3875] border-[3px] border-[#730f11] shadow-[#730f11] hover:bg-[#ff5a8f] text-white',
    orange: 'bg-[#fd9227] border-[3px] border-[#cc7425] shadow-[#cc7425] hover:bg-[#ffa447] text-white',
    outline: 'bg-transparent border-[3px] border-[#473025] shadow-[#473025] hover:bg-[#fff5e8] text-[#473025]',
    danger: 'bg-[#ff4880] border-[3px] border-[#730f11] shadow-[#730f11] hover:bg-[#ff6b9a] text-white',
    text: 'bg-transparent border-[3px] border-transparent shadow-transparent hover:bg-[#d1d5db] text-[#473025]',
    back: 'bg-[#fd9227] border-[3px] border-[#cc7425] shadow-[#cc7425] hover:bg-[#e6832b] text-white',
  };

  const sizeClasses = {
    sm: 'h-[38px] text-[14px] px-4',
    md: 'h-[50px] text-[16px] px-6',
    lg: 'h-[57px] text-[18px] md:text-[20px] px-8',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  const content = (
    <>
      {!isLoading && icon && iconPosition === 'left' && icon}
      {isLoading ? (
        <>
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <span>{children}</span>
      )}
      {!isLoading && icon && iconPosition === 'right' && icon}
    </>
  );

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {content}
    </button>
  );
}
