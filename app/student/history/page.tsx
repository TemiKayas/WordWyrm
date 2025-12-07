'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import Button from '@/components/ui/Button';
import { getStudentGameHistory } from '@/app/actions/game';

type GameSession = {
  id: string;
  gameId: string;
  gameTitle: string;
  gameMode: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: Date;
  className: string;
  teacherName: string;
  metadata: any | null;
};

export default function GameHistoryPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sessions, setSessions] = useState<GameSession[]>([]);
  const [error, setError] = useState('');

  const [studentData, setStudentData] = useState({
    name: '',
    role: 'STUDENT',
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch user session
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();

        if (sessionData?.user) {
          setStudentData({
            name: sessionData.user.name || 'Student',
            role: 'STUDENT',
          });
        }

        // Fetch game history
        const historyResult = await getStudentGameHistory();
        if (historyResult.success) {
          setSessions(historyResult.data.sessions);
        } else {
          setError(historyResult.error);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch game history:', error);
        setError('Failed to load game history');
        setIsLoading(false);
      }
    }

    fetchData();
  }, []);

  const getGameModeDisplay = (mode: string) => {
    switch (mode) {
      case 'TRADITIONAL':
        return 'Traditional Quiz';
      case 'SNAKE':
        return 'Snake';
      case 'TOWER_DEFENSE':
        return 'Tower Defense';
      default:
        return mode;
    }
  };

  const getPercentage = (session: GameSession) => {
    // Use masteryAccuracy from metadata if available (for Snake game with mastery mode)
    if (session.metadata?.masteryAccuracy !== undefined) {
      return Math.round(session.metadata.masteryAccuracy);
    }

    // Fall back to traditional calculation
    if (session.totalQuestions === 0) return 0;
    const percentage = (session.correctAnswers / session.totalQuestions) * 100;
    return Math.min(Math.round(percentage), 100); // Cap at 100%
  };

  const getPerformanceColor = (percentage: number) => {
    if (percentage >= 90) return 'text-[#00b894]';
    if (percentage >= 70) return 'text-[#96b902]';
    if (percentage >= 50) return 'text-[#ff9f22]';
    return 'text-[#ff3875]';
  };

  const getPerformanceBadge = (percentage: number) => {
    if (percentage >= 90) return { text: 'Excellent', color: 'bg-[#00b894]' };
    if (percentage >= 70) return { text: 'Good', color: 'bg-[#96b902]' };
    if (percentage >= 50) return { text: 'Fair', color: 'bg-[#ff9f22]' };
    return { text: 'Needs Practice', color: 'bg-[#ff3875]' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading game history...
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
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[36px]">
                Game History
              </h1>
              <p className="font-quicksand text-[#473025]/70 text-[16px] mt-1">
                View your past game performances
              </p>
            </div>
            <Button
              onClick={() => router.push('/student/dashboard')}
              variant="secondary"
              size="sm"
            >
              Back to Dashboard
            </Button>
          </div>

          {error && (
            <div className="bg-red-100 border-[2px] border-red-400 rounded-[15px] p-4 mb-6">
              <p className="font-quicksand text-red-700 text-[14px]">{error}</p>
            </div>
          )}

          {/* Game History List */}
          <div className="space-y-4">
            {sessions.map((session) => {
              const percentage = getPercentage(session);
              const badge = getPerformanceBadge(percentage);

              return (
                <div
                  key={session.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`View leaderboard for ${session.gameTitle}. Score: ${session.score}, Accuracy: ${percentage}%`}
                  className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => router.push(`/student/leaderboard/${session.gameId}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      router.push(`/student/leaderboard/${session.gameId}`);
                    }
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    {/* Left: Game Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-quicksand font-bold text-[#473025] text-[20px]">
                          {session.gameTitle}
                        </h3>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full ${badge.color} text-white font-quicksand font-bold text-[12px]`}>
                          {badge.text}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] font-quicksand text-[#473025]/70">
                        <span>Class: <span className="font-bold text-[#473025]">{session.className}</span></span>
                        <span>Teacher: <span className="font-bold text-[#473025]">{session.teacherName}</span></span>
                        <span>Mode: <span className="font-bold text-[#473025]">{getGameModeDisplay(session.gameMode)}</span></span>
                        <span>
                          Played: <span className="font-bold text-[#473025]">
                            {new Date(session.completedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      </div>
                    </div>

                    {/* Right: Performance Stats */}
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className={`font-quicksand font-bold text-[32px] ${getPerformanceColor(percentage)}`}>
                          {percentage}%
                        </div>
                        <div className="font-quicksand text-[#473025]/60 text-[12px]">
                          Accuracy
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-quicksand font-bold text-[#473025] text-[32px]">
                          {session.score}
                        </div>
                        <div className="font-quicksand text-[#473025]/60 text-[12px]">
                          Score
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-quicksand font-bold text-[#473025] text-[20px]">
                          {session.correctAnswers}/{session.totalQuestions}
                        </div>
                        <div className="font-quicksand text-[#473025]/60 text-[12px]">
                          Correct
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* View Leaderboard CTA */}
                  <div className="mt-4 pt-4 border-t border-[#473025]/10">
                    <span className="font-quicksand text-[#96b902] text-[14px] font-bold">
                      Click to view leaderboard →
                    </span>
                  </div>
                </div>
              );
            })}

            {sessions.length === 0 && (
              <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-12 text-center">
                <div className="text-[64px] mb-4">🎮</div>
                <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
                  No Games Played Yet
                </h3>
                <p className="font-quicksand text-[#473025]/60 text-[16px] mb-6">
                  Start playing games from your classes to see your history here!
                </p>
                <Button
                  onClick={() => router.push('/student/dashboard')}
                  variant="primary"
                  size="md"
                >
                  Browse Classes
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
