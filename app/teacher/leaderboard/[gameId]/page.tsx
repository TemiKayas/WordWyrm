'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Navbar from '@/components/shared/Navbar';
import SlidingSidebar from '@/components/shared/SlidingSidebar';
import { getGameLeaderboard } from '@/app/actions/game';
import { getGameQuestionAnalytics, analyzeClassPerformance } from '@/app/actions/analytics';
import { BarChart3, Trophy, AlertTriangle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';

type LeaderboardEntry = {
  rank: number;
  sessionId: string;
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

type QuestionAnalytic = {
  questionText: string;
  totalAttempts: number;
  incorrectCount: number;
  uniqueStrugglingStudents: number;
  totalStudents: number;
  difficultyScore: number;
};

export default function TeacherGameResultsPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = params?.gameId as string;

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [teacherData, setTeacherData] = useState({
    name: '',
    role: 'INSTRUCTOR' as const,
  });
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'analytics'>('leaderboard');
  const [isLoading, setIsLoading] = useState(true);
  const [gameInfo, setGameInfo] = useState<GameInfo | null>(null);
  const [classLeaderboard, setClassLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [publicLeaderboard, setPublicLeaderboard] = useState<LeaderboardEntry[] | null>(null);
  const [leaderboardTab, setLeaderboardTab] = useState<'class' | 'public'>('class');
  const [questionAnalytics, setQuestionAnalytics] = useState<QuestionAnalytic[]>([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState('');
  const [summaryStats, setSummaryStats] = useState<{
    totalStudents: number;
    averageScore: number;
    averageAccuracy: number;
  } | null>(null);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const response = await fetch('/api/auth/session');
        const sessionData = await response.json();

        if (sessionData?.user) {
          setTeacherData({
            name: sessionData.user.name || 'Instructor',
            role: 'INSTRUCTOR',
          });
        }
      } catch (error) {
        console.error('Failed to fetch user session:', error);
      }
    }

    fetchUserData();
  }, []);

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
            setLeaderboardTab('public');
          }
        } else {
          setError(leaderboardResult.error);
        }

        // Fetch summary stats for class performance
        const statsResult = await analyzeClassPerformance(gameId);
        if (statsResult.success) {
          setSummaryStats({
            totalStudents: statsResult.data.totalStudents,
            averageScore: statsResult.data.averageScore,
            averageAccuracy: statsResult.data.averageAccuracy,
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
        setError('Failed to load game results');
        setIsLoading(false);
      }
    }

    fetchData();
  }, [gameId]);

  // Fetch analytics when analytics tab is selected
  useEffect(() => {
    async function fetchAnalytics() {
      if (activeTab !== 'analytics' || questionAnalytics.length > 0) {
        return; // Only fetch once when tab is first opened
      }

      setAnalyticsLoading(true);
      try {
        const analyticsResult = await getGameQuestionAnalytics(gameId);
        if (analyticsResult.success) {
          setQuestionAnalytics(analyticsResult.data.questionAnalytics);
        } else {
          console.error('Failed to fetch analytics:', analyticsResult.error);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    fetchAnalytics();
  }, [activeTab, gameId, questionAnalytics.length]);

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

  const currentLeaderboard = leaderboardTab === 'class' ? classLeaderboard : publicLeaderboard || [];

  return (
    <div className="min-h-screen bg-[#fffaf2]">
      <Navbar
        showSignOut={true}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        logoHref="/teacher/dashboard"
        userName={teacherData.name}
        userRole={teacherData.role}
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
        <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
          {/* Back Button */}
          <div className="mb-6">
            <Button
              onClick={() => router.push('/teacher/dashboard')}
              variant="secondary"
              size="sm"
            >
              ← Back to Dashboard
            </Button>
          </div>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-quicksand font-bold text-[#473025] text-3xl md:text-4xl mb-2">
              Game Results
            </h1>
            {gameInfo && (
              <div className="flex flex-wrap gap-3 text-sm text-[#a7613c]">
                <span className="font-semibold">{gameInfo.title}</span>
                <span>•</span>
                <span>{gameInfo.className}</span>
                <span>•</span>
                <span>{getGameModeDisplay(gameInfo.gameMode)}</span>
                {gameInfo.isPublic && (
                  <>
                    <span>•</span>
                    <span className="text-[#95b607] font-semibold">Public</span>
                  </>
                )}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
              <p className="text-red-800 font-quicksand">{error}</p>
            </div>
          )}

          {/* Summary Stats Cards */}
          {summaryStats && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Total Students */}
              <div className="bg-gradient-to-br from-[#FFD700]/20 to-[#FFA500]/20 border-3 border-[#FFD700] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-quicksand font-bold text-[#473025] text-sm uppercase tracking-wide">
                    Total Players
                  </h3>
                  <span className="text-3xl">👥</span>
                </div>
                <p className="font-quicksand font-bold text-[#473025] text-4xl">
                  {summaryStats.totalStudents}
                </p>
              </div>

              {/* Average Score */}
              <div className="bg-gradient-to-br from-[#96b902]/20 to-[#7a9700]/20 border-3 border-[#96b902] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-quicksand font-bold text-[#473025] text-sm uppercase tracking-wide">
                    Average Score
                  </h3>
                  <span className="text-3xl">🎯</span>
                </div>
                <p className="font-quicksand font-bold text-[#473025] text-4xl">
                  {summaryStats.averageScore}
                </p>
              </div>

              {/* Average Accuracy */}
              <div className="bg-gradient-to-br from-[#ff9f22]/20 to-[#ff8800]/20 border-3 border-[#ff9f22] rounded-xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-quicksand font-bold text-[#473025] text-sm uppercase tracking-wide">
                    Average Accuracy
                  </h3>
                  <span className="text-3xl">📊</span>
                </div>
                <p className="font-quicksand font-bold text-[#473025] text-4xl">
                  {summaryStats.averageAccuracy}%
                </p>
              </div>
            </div>
          )}

          {/* AI Class Insights Button */}
          {summaryStats && summaryStats.totalStudents > 0 && (
            <div className="mb-6">
              <button
                onClick={() => router.push(`/teacher/analytics/${gameId}/class-analysis`)}
                className="w-full bg-gradient-to-r from-[#95b607] to-[#7a9700] hover:from-[#7a9700] hover:to-[#6a8600] text-white font-quicksand font-bold py-4 px-6 rounded-[15px] transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3"
              >
                <Sparkles size={24} />
                <span className="text-lg">Get AI Class Insights</span>
                <span className="text-sm opacity-90">✨ Powered by AI</span>
              </button>
            </div>
          )}

          {/* Main Tabs */}
          <div className="mb-6 border-b-2 border-[#473025]/20">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`flex items-center gap-2 px-6 py-3 font-quicksand font-bold text-sm transition-all ${
                  activeTab === 'leaderboard'
                    ? 'text-[#473025] border-b-4 border-[#95b607]'
                    : 'text-[#a7613c] hover:text-[#473025]'
                }`}
              >
                <Trophy size={18} />
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`flex items-center gap-2 px-6 py-3 font-quicksand font-bold text-sm transition-all ${
                  activeTab === 'analytics'
                    ? 'text-[#473025] border-b-4 border-[#95b607]'
                    : 'text-[#a7613c] hover:text-[#473025]'
                }`}
              >
                <BarChart3 size={18} />
                Question Analysis
              </button>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === 'leaderboard' && (
            <div>
              {/* Leaderboard Sub-tabs */}
              {publicLeaderboard && (
                <div className="mb-6 flex gap-3">
                  <button
                    onClick={() => setLeaderboardTab('class')}
                    className={`px-4 py-2 rounded-lg font-quicksand font-semibold text-sm transition-all ${
                      leaderboardTab === 'class'
                        ? 'bg-[#95b607] text-white'
                        : 'bg-white border-2 border-[#473025]/20 text-[#473025] hover:border-[#95b607]'
                    }`}
                  >
                    Class Only
                  </button>
                  <button
                    onClick={() => setLeaderboardTab('public')}
                    className={`px-4 py-2 rounded-lg font-quicksand font-semibold text-sm transition-all ${
                      leaderboardTab === 'public'
                        ? 'bg-[#95b607] text-white'
                        : 'bg-white border-2 border-[#473025]/20 text-[#473025] hover:border-[#95b607]'
                    }`}
                  >
                    Public Leaderboard
                  </button>
                </div>
              )}

              {/* Leaderboard Table */}
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#95b607]"></div>
                  <p className="mt-4 text-[#a7613c] font-quicksand">Loading results...</p>
                </div>
              ) : currentLeaderboard.length === 0 ? (
                <div className="bg-white border-2 border-[#473025]/20 rounded-lg p-8 text-center">
                  <p className="text-[#a7613c] font-quicksand">
                    {leaderboardTab === 'class'
                      ? 'No students from your class have completed this game yet.'
                      : 'No public plays recorded yet.'}
                  </p>
                </div>
              ) : (
                <div className="bg-white border-3 border-[#473025] rounded-xl overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-[#fff6e8]">
                      <tr>
                        <th className="px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-sm">Rank</th>
                        <th className="px-4 py-3 text-left font-quicksand font-bold text-[#473025] text-sm">Student</th>
                        <th className="px-4 py-3 text-right font-quicksand font-bold text-[#473025] text-sm">Score</th>
                        <th className="px-4 py-3 text-right font-quicksand font-bold text-[#473025] text-sm">Accuracy</th>
                        <th className="px-4 py-3 text-right font-quicksand font-bold text-[#473025] text-sm">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentLeaderboard.map((entry) => {
                        // Use masteryAccuracy from metadata if available, otherwise calculate
                        const accuracy = entry.metadata?.masteryAccuracy !== undefined
                          ? Math.round(entry.metadata.masteryAccuracy)
                          : entry.totalQuestions > 0
                          ? Math.round((entry.correctAnswers / entry.totalQuestions) * 100)
                          : 0;

                        return (
                          <tr
                            key={`${entry.studentName}-${entry.rank}`}
                            onClick={() => router.push(`/teacher/analytics/${gameId}/student/${entry.sessionId}`)}
                            className="border-t-2 border-[#473025]/10 hover:bg-[#96b902]/10 transition-colors cursor-pointer group"
                          >
                            <td className="px-4 py-3">
                              <span className={`font-quicksand font-bold text-lg ${getRankColor(entry.rank)}`}>
                                {getMedalEmoji(entry.rank)}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-quicksand text-[#473025] group-hover:text-[#96b902] transition-colors">
                              {entry.studentName}
                              <span className="ml-2 text-xs text-[#96b902] opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details →
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-quicksand font-bold text-[#473025]">{entry.score}</td>
                            <td className="px-4 py-3 text-right font-quicksand text-[#473025]">
                              {accuracy}% ({entry.correctAnswers}/{entry.totalQuestions})
                            </td>
                            <td className="px-4 py-3 text-right font-quicksand text-[#a7613c] text-sm">
                              {new Date(entry.completedAt).toLocaleDateString()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Info Footer */}
              <div className="mt-6 p-4 bg-[#fff6e8] border-2 border-[#473025]/20 rounded-lg">
                <p className="text-sm text-[#a7613c] font-quicksand">
                  <strong>Note:</strong> Only students who completed the mastery phase appear on the leaderboard.
                  {publicLeaderboard && leaderboardTab === 'class' && ' Switch to "Public Leaderboard" to see all players.'}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div>
              {analyticsLoading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#95b607]"></div>
                  <p className="mt-4 text-[#a7613c] font-quicksand">Loading analytics...</p>
                </div>
              ) : questionAnalytics.length === 0 ? (
                <div className="bg-white border-2 border-[#473025]/20 rounded-lg p-8 text-center">
                  <BarChart3 size={48} className="mx-auto text-[#a7613c] mb-4" />
                  <p className="text-[#a7613c] font-quicksand text-lg">
                    No analytics available yet. Students need to play this game first!
                  </p>
                </div>
              ) : (
                <div>
                  <div className="mb-6 p-4 bg-[#fff6e8] border-2 border-[#473025]/20 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={20} className="text-[#ff9800]" />
                      <h3 className="font-quicksand font-bold text-[#473025]">Problem Areas</h3>
                    </div>
                    <p className="text-sm text-[#a7613c] font-quicksand">
                      Questions are ranked by difficulty. Focus on the top items to help students where they need it most.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {questionAnalytics.map((question, index) => {
                      const getDifficultyColor = (score: number) => {
                        if (score >= 70) return 'bg-red-500';
                        if (score >= 50) return 'bg-orange-500';
                        if (score >= 30) return 'bg-yellow-500';
                        return 'bg-green-500';
                      };

                      const getDifficultyLabel = (score: number) => {
                        if (score >= 70) return 'Very Hard';
                        if (score >= 50) return 'Hard';
                        if (score >= 30) return 'Moderate';
                        return 'Easy';
                      };

                      return (
                        <div
                          key={index}
                          className="bg-white border-3 border-[#473025] rounded-xl p-5 hover:shadow-lg transition-shadow"
                        >
                          {/* Question Text */}
                          <div className="mb-4">
                            <div className="flex items-start justify-between gap-4">
                              <h4 className="font-quicksand font-bold text-[#473025] text-lg flex-1">
                                {question.questionText}
                              </h4>
                              <span className={`px-3 py-1 rounded-full text-xs font-bold text-white ${
                                question.difficultyScore >= 70 ? 'bg-red-500' :
                                question.difficultyScore >= 50 ? 'bg-orange-500' :
                                question.difficultyScore >= 30 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}>
                                {getDifficultyLabel(question.difficultyScore)}
                              </span>
                            </div>
                          </div>

                          {/* Difficulty Bar */}
                          <div className="mb-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-quicksand text-[#a7613c]">Difficulty</span>
                              <span className="text-sm font-quicksand font-bold text-[#473025]">
                                {question.difficultyScore.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className={`h-full transition-all ${getDifficultyColor(question.difficultyScore)}`}
                                style={{ width: `${question.difficultyScore}%` }}
                              />
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="flex flex-wrap gap-4 text-sm font-quicksand text-[#a7613c]">
                            <div>
                              <span className="font-bold text-[#473025]">{question.uniqueStrugglingStudents}</span>
                              {' '}of{' '}
                              <span className="font-bold text-[#473025]">{question.totalStudents}</span>
                              {' '}students struggled
                            </div>
                            <div>•</div>
                            <div>
                              <span className="font-bold text-[#473025]">{question.incorrectCount}</span>
                              {' '}incorrect attempts out of{' '}
                              <span className="font-bold text-[#473025]">{question.totalAttempts}</span>
                              {' '}total
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
