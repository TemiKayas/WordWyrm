import React from 'react';

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Avatar({ name, size = 'md', className = '' }: AvatarProps) {
  const sizeClasses = {
    sm: 'w-[32px] h-[32px] text-[14px]',
    md: 'w-[40px] h-[40px] text-[18px]',
    lg: 'w-[48px] h-[48px] text-[22px]',
  };

  // Get first letter of the name
  const initial = name.charAt(0).toUpperCase();

  // Generate a consistent color based on the name
  const getColorFromName = (name: string) => {
    const colors = [
      'bg-[#96b902]', // green
      'bg-[#2b7fff]', // blue
      'bg-[#ff9f22]', // orange
      'bg-[#ff4880]', // pink
      'bg-[#de3ca8]', // purple
      'bg-[#473025]', // brown
    ];

    // Simple hash function based on name
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    return colors[Math.abs(hash) % colors.length];
  };

  const bgColor = getColorFromName(name);

  return (
    <div
      className={`${sizeClasses[size]} rounded-full ${bgColor} border-[3px] border-[#473025] flex items-center justify-center ${className}`}
    >
      <span className="font-quicksand font-bold text-white">
        {initial}
      </span>
    </div>
  );
}
