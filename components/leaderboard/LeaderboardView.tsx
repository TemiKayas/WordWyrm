'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { getGameLeaderboard } from '@/app/actions/game';

type LeaderboardEntry = {
  rank: number;
  studentName: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  completedAt: Date;
  isCurrentUser: boolean;
  metadata: any | null;
};

type GameInfo = {
  title: string;
  gameMode: string;
  isPublic: boolean;
  className: string;
};

interface LeaderboardViewProps {
  gameId: string;
  userRole: 'STUDENT' | 'TEACHER' | 'INSTRUCTOR';
  backButtonPath: string;
  backButtonLabel: string;
}

export default function LeaderboardView({
  gameId,
  userRole,
  backButtonPath,
  backButtonLabel
}: LeaderboardViewProps) {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [publicLeaderboard, setPublicLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [activeTab, setActiveTab] = useState<'class' | 'public'>('class');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const leaderboardResult = await getGameLeaderboard(gameId);
        if (leaderboardResult.success) {
          setGameInfo(leaderboardResult.data.gameInfo);
          setClassLeaderboard(leaderboardResult.data.classLeaderboard);
          setPublicLeaderboard(leaderboardResult.data.publicLeaderboard);

          // Default to public tab if available
          if (leaderboardResult.data.publicLeaderboard) {
            setActiveTab('public');
          }
        } else {
          setError(leaderboardResult.error);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setError('Failed to load leaderboard');
        setIsLoading(false);
      }
    }

    fetchData();
  }, [gameId]);

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

  const getMedalEmoji = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'text-[#FFD700]';
    if (rank === 2) return 'text-[#C0C0C0]';
    if (rank === 3) return 'text-[#CD7F32]';
    return 'text-[#473025]';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center">
        <div className="text-[#473025] font-quicksand font-bold text-xl">
          Loading leaderboard...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#fffaf2] flex items-center justify-center p-4">
        <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 p-8 max-w-md text-center">
          <div className="text-[48px] mb-4">⚠️</div>
          <h2 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
            Error Loading Leaderboard
          </h2>
          <p className="font-quicksand text-[#473025]/70 text-[16px] mb-6">
            {error}
          </p>
          <Button
            onClick={() => router.push(backButtonPath)}
            variant="primary"
            size="md"
          >
            {backButtonLabel}
          </Button>
        </div>
      </div>
    );
  }

  if (!gameInfo) {
    return null;
  }

  const currentLeaderboard = activeTab === 'class' ? classLeaderboard : publicLeaderboard || [];

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <Button
          onClick={() => router.push(backButtonPath)}
          variant="secondary"
          size="sm"
        >
          {backButtonLabel}
        </Button>
      </div>

      {/* Game Info Card */}
      <div className="bg-gradient-to-br from-[#96b902]/20 to-[#7a9700]/20 border-[3px] border-[#96b902] rounded-[20px] p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-quicksand font-bold text-[#473025] text-[28px] md:text-[36px] mb-2">
              {gameInfo.title}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-[14px] font-quicksand text-[#473025]/70">
              <span>Class: <span className="font-bold text-[#473025]">{gameInfo.className}</span></span>
              <span>Mode: <span className="font-bold text-[#473025]">{getGameModeDisplay(gameInfo.gameMode)}</span></span>
              {gameInfo.isPublic && (
                <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#96b902] text-white font-bold text-[12px]">
                  Public Game
                </span>
              )}
            </div>
          </div>
          <div className="text-[64px]">🏆</div>
        </div>
      </div>

      {/* Tabs (if public leaderboard exists) */}
      {publicLeaderboard && (
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('class')}
            className={`flex-1 py-3 px-6 rounded-[15px] font-quicksand font-bold text-[16px] transition-all ${
              activeTab === 'class'
                ? 'bg-[#96b902] text-white shadow-md'
                : 'bg-white text-[#473025] border-[2px] border-[#473025]/10 hover:border-[#96b902]'
            }`}
          >
            Class Leaderboard ({classLeaderboard.length})
          </button>
          <button
            onClick={() => setActiveTab('public')}
            className={`flex-1 py-3 px-6 rounded-[15px] font-quicksand font-bold text-[16px] transition-all ${
              activeTab === 'public'
                ? 'bg-[#ff9f22] text-white shadow-md'
                : 'bg-white text-[#473025] border-[2px] border-[#473025]/10 hover:border-[#ff9f22]'
            }`}
          >
            Public Leaderboard ({publicLeaderboard.length})
          </button>
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 overflow-hidden">
        {currentLeaderboard.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-[64px] mb-4">🎯</div>
            <h3 className="font-quicksand font-bold text-[#473025] text-[24px] mb-2">
              No Scores Yet
            </h3>
            <p className="font-quicksand text-[#473025]/60 text-[16px]">
              {userRole === 'STUDENT'
                ? "Be the first to play this game and set a high score!"
                : "Students haven't played this game yet. Share the code to get started!"
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#473025]/5">
                <tr>
                  <th className="px-6 py-4 text-left font-quicksand font-bold text-[#473025] text-[14px]">
                    Rank
                  </th>
                  <th className="px-6 py-4 text-left font-quicksand font-bold text-[#473025] text-[14px]">
                    Player
                  </th>
                  <th className="px-6 py-4 text-center font-quicksand font-bold text-[#473025] text-[14px]">
                    Score
                  </th>
                  <th className="px-6 py-4 text-center font-quicksand font-bold text-[#473025] text-[14px]">
                    Accuracy
                  </th>
                  <th className="px-6 py-4 text-center font-quicksand font-bold text-[#473025] text-[14px]">
                    Completed
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentLeaderboard.map((entry, index) => {
                  // Use masteryAccuracy from metadata if available, otherwise calculate
                  const percentage = entry.metadata?.masteryAccuracy !== undefined
                    ? Math.round(entry.metadata.masteryAccuracy)
                    : entry.totalQuestions > 0
                    ? Math.round((entry.correctAnswers / entry.totalQuestions) * 100)
                    : 0;

                  return (
                    <tr
                      key={index}
                      className={`border-t border-[#473025]/10 ${
                        entry.isCurrentUser
                          ? 'bg-[#96b902]/10'
                          : index % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#473025]/[0.02]'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`font-quicksand font-bold text-[20px] ${getRankColor(entry.rank)}`}>
                          {getMedalEmoji(entry.rank)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`font-quicksand ${entry.isCurrentUser ? 'font-bold' : ''} text-[#473025] text-[16px]`}>
                            {entry.studentName}
                          </span>
                          {entry.isCurrentUser && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-[#96b902] text-white font-quicksand font-bold text-[10px]">
                              YOU
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-quicksand font-bold text-[#473025] text-[18px]">
                          {entry.score}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-quicksand font-bold text-[#473025] text-[16px]">
                            {percentage}%
                          </span>
                          <span className="font-quicksand text-[#473025]/60 text-[12px]">
                            {entry.correctAnswers}/{entry.totalQuestions}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-quicksand text-[#473025]/70 text-[14px]">
                          {new Date(entry.completedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Info Footer */}
      {publicLeaderboard && (
        <div className="mt-6 bg-[#ff9f22]/10 border-[2px] border-[#ff9f22]/30 rounded-[15px] p-4">
          <p className="font-quicksand text-[#473025]/70 text-[14px]">
            <span className="font-bold text-[#473025]">Note:</span> The public leaderboard shows all players who have completed this game,
            while the class leaderboard only shows students from your class. Public leaderboards persist even if the game is made private.
          </p>
        </div>
      )}
    </main>
  );
}
