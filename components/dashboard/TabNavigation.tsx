'use client';

import { useState } from 'react';

/**
 * tab switcher for dashboard views
 */

interface TabNavigationProps {
  tabs: string[];
  onTabChange?: (tab: string) => void;
  defaultTab?: string;
}

export default function TabNavigation({ tabs, onTabChange, defaultTab }: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return (
    <div className="bg-[#f1e8d9] rounded-[100px] h-auto sm:h-[51px] w-full flex flex-wrap sm:flex-nowrap items-center justify-center sm:justify-around gap-2 p-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabClick(tab)}
          className={`
            font-quicksand font-bold text-xs sm:text-sm lg:text-base px-4 sm:px-6 lg:px-8 py-2 rounded-[100px] transition-all whitespace-nowrap
            ${activeTab === tab
              ? 'bg-[#fffdf8] text-brown shadow-sm'
              : 'text-brown hover:bg-[#fffdf8]/50'
            }
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
