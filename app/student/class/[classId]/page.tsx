'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import BackButton from '@/components/ui/BackButton';
import { getStudentClassDetails } from '@/app/actions/class';
import Image from 'next/image';

type ClassDetails = {
  id: string;
  name: string;
  description: string | null;
  teacher: {
    name: string;
    school: string | null;
  };
  games: Array<{
    id: string;
    title: string;
    shareCode: string;
    gameMode: string;
    createdAt: Date;
  }>;
};

export default function StudentClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params.classId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [classDetails, setClassDetails] = useState<ClassDetails | null>(null);
  const [error, setError] = useState('');

  const [studentData, setStudentData] = useState({
    name: '',
    role: 'STUDENT',
    photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user session
        const response = await fetch('/api/auth/session');
        const session = await response.json();

        if (session?.user) {
          setStudentData({
            name: session.user.name || 'Student',
            role: 'STUDENT',
            photo: '/assets/dashboard/avatars/instructor-profile-photo.png',
          });
        }

        // Fetch class details
        const result = await getStudentClassDetails(classId);
        if (result.success) {
          setClassDetails(result.data);
        } else {
          setError(result.error);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch class details:', error);
        setError('Failed to load class details');
        setIsLoading(false);
      }
    }

    fetchData();
  }, [classId]);

  const handlePlayGame = (shareCode: string) => {
    router.push(`/play/phaser/${shareCode}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading class...
        </div>
      </div>
    );
  }

  if (error || !classDetails) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-center">
          <div className="text-[#473025] font-quicksand font-bold text-xl mb-4">
            {error || 'Class not found'}
          </div>
          <button
            onClick={() => router.push('/student/dashboard')}
            className="bg-[#473025] text-[#fffbf6] font-quicksand font-bold px-6 py-2 rounded-[15px] hover:bg-[#5a3d2e] transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={true}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        logoHref="/student/dashboard"
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-[996px] mx-auto bg-[#fffbf6] rounded-[15px] shadow-lg border-[3px] border-[#473025]/10 min-h-screen p-4 md:p-6 lg:p-8">
            <DashboardHeader
              userName={studentData.name}
              userRole={studentData.role}
              userPhoto={studentData.photo}
            />

            {/* Class Header */}
            <div className="mt-8 mb-6">
              <BackButton href="/student/dashboard" variant="text">
                Back to My Classes
              </BackButton>
              <h2 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[32px] mt-2">
                {classDetails.name}
              </h2>
              {classDetails.description && (
                <p className="font-quicksand text-[#473025]/70 text-[16px] mt-2">
                  {classDetails.description}
                </p>
              )}
              <div className="mt-3">
                <span className="font-quicksand text-[14px] text-[#473025]/60">
                  Teacher:
                </span>
                <span className="font-quicksand font-bold text-[#473025] ml-2 text-[16px]">
                  {classDetails.teacher.name}
                </span>
                {classDetails.teacher.school && (
                  <span className="font-quicksand text-[14px] text-[#473025]/60 ml-2">
                    ({classDetails.teacher.school})
                  </span>
                )}
              </div>
            </div>

            {/* Games Section */}
            <div className="mt-8">
              <h3 className="font-quicksand font-bold text-[#473025] text-[22px] md:text-[26px] mb-5 md:mb-7">
                Available Games
              </h3>

              {classDetails.games.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  {classDetails.games.map((game) => (
                    <div
                      key={game.id}
                      className="bg-[#fffaf2] border-[3px] border-[#473025]/20 rounded-[15px] p-6 hover:border-[#473025] hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
                            {game.title}
                          </h4>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-quicksand text-[12px] text-[#473025]/60 bg-[#473025]/10 px-2 py-1 rounded-[5px]">
                              {game.gameMode === 'TOWER_DEFENSE' ? 'Tower Defense' : 'Traditional'}
                            </span>
                          </div>
                          <p className="font-quicksand text-[12px] text-[#473025]/60">
                            Created {new Date(game.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => handlePlayGame(game.shareCode)}
                        className="w-full bg-[#fd9227] border-[2px] border-[#730f11] rounded-[15px] h-[46px] flex items-center justify-center gap-2.5 hover:bg-[#e6832b] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <div className="w-[20px] h-[20px] relative flex-shrink-0">
                          <Image
                            src="/assets/dashboard/create-icon.svg"
                            alt="Play"
                            fill
                            className="object-contain brightness-0 invert"
                          />
                        </div>
                        <span className="font-quicksand font-bold text-white text-[18px]">
                          Play Game
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 md:py-20">
                  <p className="font-quicksand text-[#473025]/60 text-lg md:text-xl mb-4">
                    No games available yet.
                  </p>
                  <p className="font-quicksand text-[#473025]/40 text-[14px]">
                    Your teacher hasn&apos;t created any games for this class yet. Check back later!
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
