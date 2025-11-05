import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'success' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  isLoading?: boolean;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const baseClasses = 'font-quicksand font-bold rounded-[11px] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantClasses = {
    primary: 'bg-[#473025] border-[1.5px] border-[#473025] hover:bg-[#5a3d2e] hover:shadow-md text-white',
    secondary: 'bg-[#fffcf8] border-[3px] border-[#473025] hover:bg-[#fff5e8] hover:shadow-md text-[#473025]',
    success: 'bg-[#95b607] border-[1.5px] border-[#006029] hover:bg-[#7a9700] hover:shadow-md text-white',
    outline: 'bg-transparent border-[3px] border-[#473025] hover:bg-[#fff5e8] text-[#473025]',
  };

  const sizeClasses = {
    sm: 'h-[45px] text-[16px] px-4',
    md: 'h-[55px] text-[18px] px-6',
    lg: 'h-[76px] text-[24px] px-8',
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
