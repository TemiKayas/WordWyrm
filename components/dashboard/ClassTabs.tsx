'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ClassTabsProps {
  classes?: string[];
  selectedClass?: string;
  onClassChange?: (className: string) => void;
}

export default function ClassTabs({
  classes = ['Games', 'My Classes'],
  selectedClass,
  onClassChange,
}: ClassTabsProps) {
  const [activeTab, setActiveTab] = useState(selectedClass || classes[0]);

  const handleTabClick = (className: string) => {
    setActiveTab(className);
    onClassChange?.(className);
  };

  return (
    <div className="mb-6 md:mb-8">
      {/* Tab Navigation */}
      <div className="relative bg-[#fffbf6] border-[3px] border-[#473025] rounded-[250px] h-[40px] md:h-[45px] flex items-center overflow-hidden p-[6px]">
        {/* Active Tab Indicator */}
        <div
          className="absolute bg-[#473025] h-[28px] md:h-[33px] rounded-[300px] transition-all duration-300 ease-in-out"
          style={{
            left: '6px',
            width: `calc(50% - 9px)`,
            transform: `translateX(${classes.indexOf(activeTab) === 0 ? '0' : 'calc(100% + 6px)'})`,
          }}
        />

        {/* Tab Buttons */}
         {classes.map((className) => (
          <button
            key={className}
            onClick={() => handleTabClick(className)}
            className={`relative z-10 flex-1 font-quicksand font-bold text-[14px] md:text-[16px] text-center transition-colors px-2 ${
              activeTab === className ? 'text-[#faf4ed]' : 'text-[#473025]'
            }`}
          >
            {className}
          </button>
        ))}
      </div>

      {/* Class Selector (only show on My Classes tab) */}
      {activeTab === 'My Classes' && (
        <div className="mt-4 md:mt-6 flex items-center justify-center gap-2 md:gap-3">
          <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] lg:text-[32px]">
            Class 1
          </h2>
          <button className="w-3 h-2 md:w-4 md:h-2 relative">
            <Image
              src="/assets/dashboard/dropdown-arrow-down.svg"
              alt="Dropdown"
              fill
              className="object-contain"
            />
          </button>
        </div>
      )}
    </div>
  );
}