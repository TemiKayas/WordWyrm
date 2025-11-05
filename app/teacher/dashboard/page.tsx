'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ClassTabs from '@/components/dashboard/ClassTabs';
import ClassStatistics from '@/components/dashboard/ClassStatistics';
import StudentsTable from '@/components/dashboard/StudentsTable';
import GamesView from '@/components/dashboard/GamesView';
import { getTeacherStats } from '@/app/actions/quiz';

export default function TeacherDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Games');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default to expanded

  // real data from backend
  const [teacherData, setTeacherData] = useState({
    name: '',
    role: 'INSTRUCTOR',
    photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
  });

  const [stats, setStats] = useState({
    averageScore: 67,
    completionData: {
      allAssignments: 12,
      someAssignments: 4,
      noAssignments: 1,
    },
  });

  // fetch teacher data and stats on mount
  useEffect(() => {
    async function fetchData() {
      try {
        // fetch user session to get name
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session?.user) {
          setTeacherData({
            name: session.user.name || 'Instructor',
            role: 'INSTRUCTOR',
            photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
          });
        }

        // fetch stats (keeping dummy data for now since we don't have real student data)
        const statsResult = await getTeacherStats();
        if (statsResult.success) {
          // use dummy data since we don't have real student completion data yet
          setStats({
            averageScore: 67, // dummy data
            completionData: {
              allAssignments: 12,
              someAssignments: 4,
              noAssignments: 1,
            },
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const handleCreateClick = () => {
    router.push('/teacher/upload');
  };

  const handlePlayClick = () => {
    router.push('/teacher/games');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-brown font-quicksand font-bold text-xl">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      {/* Navbar with menu button */}
      <Navbar
        showSignOut={true}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        logoHref="/teacher/dashboard"
      />

      {/* Sliding Sidebar */}
      <SlidingSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      {/* Main Content Area with transition */}
      <div
        className={`transition-all duration-200 ease-in-out ${
          isSidebarOpen ? 'md:ml-[240px] lg:ml-[278px]' : 'ml-0'
        }`}
      >
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Main Content Container */}
          <div className="max-w-[996px] mx-auto bg-[#fffbf6] rounded-[15px] shadow-lg border-[3px] border-[#473025]/10 min-h-screen p-4 md:p-6 lg:p-8">
            {/* Header */}
            <DashboardHeader
              userName={teacherData.name}
              userRole={teacherData.role}
              userPhoto={teacherData.photo}
            />

            {/* Class Tabs */}
            <ClassTabs onClassChange={setActiveTab} selectedClass={activeTab} />

            {/* Content based on active tab */}
            {activeTab === 'Games' ? (
              /* Games View */
              <GamesView onCreateGame={handleCreateClick} />
            ) : (
              <>
                {/* Class Statistics Section */}
                <ClassStatistics
                  averageScore={stats.averageScore}
                  completionData={stats.completionData}
                />

                {/* Students Table */}
                <StudentsTable />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
