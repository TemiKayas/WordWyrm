'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import SlidingSidebar from './SlidingSidebar';

interface TeacherPageLayoutProps {
  children: React.ReactNode;
  showSignOut?: boolean;
}

export default function TeacherPageLayout({ children, showSignOut = true }: TeacherPageLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('TEACHER');

  // Fetch user session
  useEffect(() => {
    async function fetchUser() {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user) {
        setUserName(session.user.name || 'Teacher');
        setUserRole('TEACHER');
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={showSignOut}
        onMenuClick={() => setIsSidebarOpen(true)}
        userName={userName}
        userRole={userRole}
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
