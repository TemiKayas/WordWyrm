'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import LeaderboardView from '@/components/leaderboard/LeaderboardView';

export default function StudentLeaderboardPage() {
  const params = useParams();
  const gameId = params?.gameId as string;

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [studentData, setStudentData] = useState({
    name: '',
    role: 'STUDENT' as const,
  });

  useEffect(() => {
    // Handle sidebar initial state based on screen size
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    async function fetchUserData() {
      try {
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();

        if (sessionData?.user) {
          setStudentData({
            name: sessionData.user.name || 'Student',
            role: 'STUDENT',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
      }
    }

    fetchUserData();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={true}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        logoHref="/student/dashboard"
        userName={studentData.name}
        userRole={studentData.role}
      />

      <SlidingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <div
        className={`transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'md:ml-[240px] lg:ml-[278px]' : 'ml-0'
        }`}
      >
        <LeaderboardView
          gameId={gameId}
          userRole="STUDENT"
          backButtonPath="/student/history"
          backButtonLabel="← Back to History"
        />
      </div>
    </div>
  );
}
