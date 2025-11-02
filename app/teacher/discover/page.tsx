'use client';

import Sidebar from '@/components/dashboard/Sidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function DiscoverPage() {
  const router = useRouter();
  const [teacherData, setTeacherData] = useState({
    name: '',
    role: 'INSTRUCTOR',
    photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session?.user) {
          setTeacherData({
            name: session.user.name || 'Instructor',
            role: 'INSTRUCTOR',
            photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
          });
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
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

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#fffaf2] to-[#fff5e9]">
      <Sidebar onPlayClick={handlePlayClick} onCreateClick={handleCreateClick} />

      <div className="ml-[200px] md:ml-[240px] lg:ml-[278px] min-h-screen">
        <div className="max-w-[996px] mx-auto bg-[#fffbf6] rounded-[15px] shadow-sm min-h-screen p-4 md:p-6 lg:p-8">
          <DashboardHeader
            userName={teacherData.name}
            userRole={teacherData.role}
            userPhoto={teacherData.photo}
          />

          <div className="mt-8">
            <h2 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[32px] mb-6">
              Discover
            </h2>
            <div className="bg-white border-[3px] border-[#473025] rounded-[15px] p-8 text-center">
              <p className="font-quicksand text-[#a7613c] text-lg">
                Coming soon! Discover games and quizzes from other teachers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
