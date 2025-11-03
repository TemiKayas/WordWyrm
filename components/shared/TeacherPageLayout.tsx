'use client';

import { useState } from 'react';
import Navbar from './Navbar';
import SlidingSidebar from './SlidingSidebar';

interface TeacherPageLayoutProps {
  children: React.ReactNode;
  showSignOut?: boolean;
}

export default function TeacherPageLayout({ children, showSignOut = true }: TeacherPageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={showSignOut}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <SlidingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <main
        className={`transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'md:ml-[240px] lg:ml-[278px]' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
