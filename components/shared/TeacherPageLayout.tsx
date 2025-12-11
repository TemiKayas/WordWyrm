'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import SlidingSidebar from './SlidingSidebar';
import OnboardingModal from './OnboardingModal';
import { checkOnboardingStatus, markOnboardingComplete } from '@/app/actions/onboarding';

interface TeacherPageLayoutProps {
  children: React.ReactNode;
  showSignOut?: boolean;
  defaultSidebarOpen?: boolean;
}

export default function TeacherPageLayout({ children, showSignOut = true, defaultSidebarOpen = false }: TeacherPageLayoutProps) {
  // On mobile, always start with sidebar closed
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState<'TEACHER' | 'STUDENT'>('TEACHER');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasCheckedOnboarding, setHasCheckedOnboarding] = useState(false);

  // Fetch user session and check onboarding status
  useEffect(() => {
    async function fetchUser() {
      const response = await fetch('/api/auth/session');
      const session = await response.json();
      if (session?.user) {
        setUserName(session.user.name || 'Teacher');
        setUserRole('TEACHER');

        // Check if user has completed onboarding
        if (!hasCheckedOnboarding) {
          const result = await checkOnboardingStatus();
          if (result.success && !result.data.completed) {
            setShowOnboarding(true);
          }
          setHasCheckedOnboarding(true);
        }
      }
    }
    fetchUser();
  }, [hasCheckedOnboarding]);

  // Ensure sidebar is closed on mobile when window is resized
  useEffect(() => {
    const handleResize = () => {
      // Close sidebar on mobile (below md breakpoint: 768px)
      if (window.innerWidth < 768 && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Run once on mount to check initial size
    handleResize();

    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  const handleOnboardingClose = async () => {
    await markOnboardingComplete();
    setShowOnboarding(false);
  };

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={showSignOut}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        userName={userName}
        userRole={userRole}
      />

      <SlidingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onHelpClick={() => setShowOnboarding(true)}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingClose}
        userRole={userRole}
      />

      <main
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'md:ml-[240px] lg:ml-[278px]' : 'ml-0'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
