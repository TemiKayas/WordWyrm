'use client';

import Link from 'next/link';
import TeacherPageLayout from '@/components/shared/TeacherPageLayout';

// Serializable metric interface (no functions)
interface SerializedGameMetric {
  key: string;
  label: string;
  type: 'number' | 'string' | 'boolean';
  formatType?: 'percentage' | 'seconds';  // Use format type instead of function
}

interface SerializedGameTypeConfig {
  name: string;
  description: string;
  metrics: SerializedGameMetric[];
}

interface GameSession {
  id: string;
  score: number | null;
  correctAnswers: number | null;
  totalQuestions: number | null;
  completedAt: Date | null;
  guestName: string | null;
  metadata: Record<string, unknown> | null;
  student: {
    user: {
      name: string | null;
      email: string;
    };
  } | null;
}

interface GameData {
  id: string;
  title: string;
  shareCode: string;
  className: string;
  quiz: {
    title: string | null;
    numQuestions: number;
  };
  gameSessions: GameSession[];
}

interface GameAnalyticsContentProps {
  game: GameData;
  config: SerializedGameTypeConfig;
  totalSessions: number;
  averageScore: number;
  averageAccuracy: number;
}

// Format value based on format type
function formatMetricValue(value: unknown, formatType?: 'percentage' | 'seconds'): string | number {
  if (value === undefined || value === null) return 'N/A';

  if (formatType === 'percentage' && typeof value === 'number') {
    return `${Math.round(value * 100)}%`;
  }

  if (formatType === 'seconds' && typeof value === 'number') {
    return `${Math.round(value)}s`;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    return value;
  }

  return 'N/A';
}

export default function GameAnalyticsContent({
  game,
  config,
  totalSessions,
  averageScore,
  averageAccuracy,
}: GameAnalyticsContentProps) {
  return (
    <TeacherPageLayout>
      <div className="p-6 md:p-8 pt-20 md:pt-24">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="mb-6">
            <a
              href="/teacher/dashboard"
              className="inline-flex items-center gap-2 text-[#473025] hover:text-[#95b607] font-quicksand font-bold text-[14px] mb-4 transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Back to Dashboard
            </a>
            <h1 className="font-quicksand font-bold text-[#473025] text-[26px] md:text-[30px] lg:text-[34px]">
              {game.className} - Analytics
            </h1>
          </div>

          {/* Game Info Card */}
          <div className="mb-8">
            <div className="bg-white border-[3px] border-[#473025] rounded-[20px] p-6 md:p-8 shadow-lg">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px] mb-2">{game.title}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="inline-flex items-center gap-2 bg-[#473025] text-white px-3 py-1.5 rounded-full font-quicksand font-bold text-[13px]">
                      {config.name}
                    </span>
                    <span className="inline-flex items-center gap-2 bg-[#96b902]/10 border-2 border-[#96b902] text-[#473025] px-3 py-1.5 rounded-full font-quicksand font-bold text-[13px]">
                      {game.quiz.numQuestions} Questions
                    </span>
                    <span className="inline-flex items-center gap-2 bg-[#ff9f22]/10 border-2 border-[#ff9f22] text-[#473025] px-3 py-1.5 rounded-full font-quicksand font-bold text-[13px]">
                      Code: <span className="text-[#ff9f22]">{game.shareCode}</span>
                    </span>
                  </div>
                </div>

                {/* AI Class Analysis Button */}
                {game.gameSessions.length > 0 && (
                  <Link
                    href={`/teacher/analytics/${game.id}/class-analysis`}
                    className="inline-flex items-center gap-2 bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold px-5 py-3 rounded-[12px] border-[3px] border-[#006029] shadow-[0_4px_0_0_#006029] hover:shadow-[0_6px_0_0_#006029] active:shadow-[0_2px_0_0_#006029] hover:-translate-y-0.5 active:translate-y-1 transition-all"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    AI Class Analysis
                  </Link>
                )}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
            <div className="bg-white border-[3px] border-[#96b902] rounded-[20px] p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#96b902] rounded-[12px] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-quicksand font-bold text-[#473025]/70 text-[14px] uppercase tracking-wide">Total Players</h3>
              </div>
              <p className="font-quicksand font-bold text-[#473025] text-[48px] leading-none">{totalSessions}</p>
            </div>
            <div className="bg-white border-[3px] border-[#ff9f22] rounded-[20px] p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#ff9f22] rounded-[12px] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-quicksand font-bold text-[#473025]/70 text-[14px] uppercase tracking-wide">Average Score</h3>
              </div>
              <p className="font-quicksand font-bold text-[#473025] text-[48px] leading-none">{Math.round(averageScore)}</p>
            </div>
            <div className="bg-white border-[3px] border-[#ff3875] rounded-[20px] p-6 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-[#ff3875] rounded-[12px] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M22 4L12 14.01l-3-3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="font-quicksand font-bold text-[#473025]/70 text-[14px] uppercase tracking-wide">Average Accuracy</h3>
              </div>
              <p className="font-quicksand font-bold text-[#473025] text-[48px] leading-none">
                {Math.round(averageAccuracy * 100)}%
              </p>
            </div>
          </div>

          {/* Sessions Table */}
          <div className="bg-white rounded-[20px] shadow-lg border-[3px] border-[#473025]/20 overflow-hidden">
            <div className="px-6 py-5 border-b-[3px] border-[#473025]/10 bg-gradient-to-r from-[#fffaf2] to-white flex items-center justify-between">
              <h2 className="font-quicksand font-bold text-[#473025] text-[22px] md:text-[26px]">Student Results</h2>
              <span className="bg-[#473025] text-white px-3 py-1.5 rounded-full font-quicksand font-bold text-[13px]">
                {game.gameSessions.length} {game.gameSessions.length === 1 ? 'student' : 'students'}
              </span>
            </div>

            {game.gameSessions.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <p className="font-quicksand text-[#473025]/60 text-[18px]">No students have played this game yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#473025]/10">
                  <thead className="bg-gradient-to-r from-[#fffaf2] to-[#fff5e9]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-quicksand font-bold text-[#473025]/70 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-quicksand font-bold text-[#473025]/70 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-quicksand font-bold text-[#473025]/70 uppercase tracking-wider">
                        Correct Answers
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-quicksand font-bold text-[#473025]/70 uppercase tracking-wider">
                        Accuracy
                      </th>
                      {config.metrics.map((metric) => (
                        <th
                          key={metric.key}
                          className="px-6 py-4 text-left text-xs font-quicksand font-bold text-[#473025]/70 uppercase tracking-wider"
                        >
                          {metric.label}
                        </th>
                      ))}
                      <th className="px-6 py-4 text-left text-xs font-quicksand font-bold text-[#473025]/70 uppercase tracking-wider">
                        Completed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#473025]/10">
                    {game.gameSessions.map((session) => {
                      const accuracy = session.totalQuestions && session.totalQuestions > 0
                        ? ((session.correctAnswers || 0) / session.totalQuestions) * 100
                        : 0;

                      const metadata = session.metadata;

                      return (
                        <tr key={session.id} className="hover:bg-[#fffaf2]/50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a
                              href={`/teacher/analytics/${game.id}/student/${session.id}`}
                              className="block hover:bg-[#fff5e9] p-2 -m-2 rounded transition-colors"
                            >
                              <div className="font-quicksand font-bold text-[#95b607] hover:text-[#7a9700] text-[14px] hover:underline">
                                {session.student ? session.student.user.name : (session.guestName || 'Guest Player')} →
                              </div>
                              <div className="font-quicksand text-[#473025]/60 text-[12px]">
                                {session.student ? session.student.user.email : 'Guest (not logged in)'}
                              </div>
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-quicksand font-bold text-[#95b607] text-[16px]">
                              {session.score || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-quicksand text-[#473025] text-[14px]">
                              {session.correctAnswers || 0} / {session.totalQuestions || 0}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-quicksand font-bold text-[#473025] text-[14px]">
                              {Math.round(accuracy)}%
                            </div>
                          </td>
                          {config.metrics.map((metric) => {
                            const value = metadata?.[metric.key];
                            const displayValue = formatMetricValue(value, metric.formatType);

                            return (
                              <td key={metric.key} className="px-6 py-4 whitespace-nowrap">
                                <div className="font-quicksand text-[#473025] text-[14px]">{displayValue}</div>
                              </td>
                            );
                          })}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-quicksand text-[#473025]/60 text-[13px]">
                              {session.completedAt
                                ? new Date(session.completedAt).toLocaleDateString()
                                : 'In Progress'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherPageLayout>
  );
}
