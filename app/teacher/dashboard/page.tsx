'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import ClassTabs from '@/components/dashboard/ClassTabs';
import ClassStatistics from '@/components/dashboard/ClassStatistics';
import StudentsTable from '@/components/dashboard/StudentsTable';
import GamesView from '@/components/dashboard/GamesView';
import { getTeacherStats } from '@/app/actions/quiz';

export default function TeacherDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('My Classes');

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
      <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9] flex items-center justify-center">
        <div className="text-brown font-quicksand font-bold text-xl">
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9]">
      {/* Sidebar Navigation */}
      <Sidebar onPlayClick={handlePlayClick} onCreateClick={handleCreateClick} />

      {/* Main Content Area */}
      <div className="ml-[200px] md:ml-[240px] lg:ml-[278px] min-h-screen">
        {/* Main Content Container */}
        <div className="max-w-[996px] mx-auto bg-[#fffbf6] rounded-[15px] shadow-sm min-h-screen p-4 md:p-6 lg:p-8">
          {/* Header */}
          <DashboardHeader
            userName={teacherData.name}
            userRole={teacherData.role}
            userPhoto={teacherData.photo}
          />

          {/* Class Tabs */}
          <ClassTabs onClassChange={setActiveTab} selectedClass={activeTab} />

          {/* Content based on active tab */}
          {activeTab === 'My Classes' ? (
            <>
              {/* Class Statistics Section */}
              <ClassStatistics
                averageScore={stats.averageScore}
                completionData={stats.completionData}
              />

              {/* Students Table */}
              <StudentsTable />
            </>
          ) : (
            /* Games View */
            <GamesView onCreateGame={handleCreateClick} />
          )}
        </div>
      </div>
    </div>
  );
}
