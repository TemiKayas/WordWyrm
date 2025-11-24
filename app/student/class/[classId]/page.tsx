'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
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

  useEffect(() => {
    async function fetchData() {
      try {
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-6 md:p-8">
            {/* Class Header */}
            <div className="mb-6">
              <BackButton href="/student/dashboard" variant="text">
                Back to My Classes
              </BackButton>
              <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[40px] mt-4">
                {classDetails.name}
              </h1>
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
              <h2 className="font-quicksand font-bold text-[#473025] text-[20px] md:text-[24px] mb-6">
                Available Games
              </h2>

              {classDetails.games.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classDetails.games.map((game, index) => {
                    // Rotate through different color schemes
                    const colorSchemes = [
                      { bg: 'from-[#96b902]/10 to-[#7a9700]/10', border: 'border-[#96b902]', accent: 'bg-[#96b902]', button: 'bg-[#96b902] border-[#006029] hover:bg-[#7a9700]' },
                      { bg: 'from-[#ff9f22]/10 to-[#fd9227]/10', border: 'border-[#ff9f22]', accent: 'bg-[#ff9f22]', button: 'bg-[#fd9227] border-[#cc7425] hover:bg-[#e6832b]' },
                      { bg: 'from-[#ff3875]/10 to-[#ff5a8f]/10', border: 'border-[#ff3875]', accent: 'bg-[#ff3875]', button: 'bg-[#ff3875] border-[#730f11] hover:bg-[#e6326a]' },
                    ];
                    const scheme = colorSchemes[index % colorSchemes.length];

                    return (
                      <div
                        key={game.id}
                        className={`bg-gradient-to-br ${scheme.bg} border-[3px] ${scheme.border} rounded-[15px] p-6 hover:shadow-lg hover:scale-[1.02] transition-all`}
                      >
                        <div className="flex items-start gap-3 mb-4">
                          <div className={`w-12 h-12 ${scheme.accent} rounded-[10px] flex items-center justify-center flex-shrink-0`}>
                            <span className="font-quicksand font-bold text-white text-[20px]">
                              {game.title.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h3 className="font-quicksand font-bold text-[#473025] text-[18px] mb-2">
                              {game.title}
                            </h3>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-quicksand text-[12px] text-[#473025]/70 bg-white/50 px-2 py-1 rounded-[5px]">
                                {game.gameMode === 'TOWER_DEFENSE' ? 'Tower Defense' : game.gameMode === 'SNAKE' ? 'Snake' : 'Traditional'}
                              </span>
                            </div>
                            <p className="font-quicksand text-[12px] text-[#473025]/60">
                              Created {new Date(game.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handlePlayGame(game.shareCode)}
                          className={`w-full ${scheme.button} border-[3px] rounded-[15px] h-[46px] flex items-center justify-center gap-2.5 hover:shadow-md active:scale-[0.98] transition-all cursor-pointer`}
                        >
                          <div className="w-[20px] h-[20px] relative flex-shrink-0">
                            <Image
                              src="/assets/dashboard/play-icon.svg"
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
                    );
                  })}
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
