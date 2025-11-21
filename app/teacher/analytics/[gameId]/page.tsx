/**
 * =============================================================================
 * GAME ANALYTICS DASHBOARD - REUSABLE ACROSS ALL GAME TYPES
 * =============================================================================
 *
 * This page displays analytics for any game type (Snake, Tower Defense, Traditional, etc.)
 * It uses a configuration-driven approach to automatically adapt to different game types.
 *
 * HOW IT WORKS:
 * 1. Reads the game's gameMode field from the database (e.g., "SNAKE", "TOWER_DEFENSE")
 * 2. Looks up the configuration for that game type in lib/game-types.ts
 * 3. Dynamically renders table columns based on the configuration
 * 4. Reads session.metadata JSON to display game-specific metrics
 *
 * WHEN A NEW GAME TYPE IS ADDED:
 * - No changes needed to this file!
 * - Just add the configuration to lib/game-types.ts
 * - The dashboard will automatically work
 *
 * DISPLAYS:
 * 1. Summary statistics (total players, average score, average accuracy)
 * 2. Detailed table with:
 *    - Universal columns: Student name, score, correct answers, accuracy
 *    - Dynamic columns: Game-specific metrics from the configuration
 *    - Completion date
 *
 * EXAMPLE:
 * For Snake game, displays: longestStreak, finalLength, totalQuestions
 * For Tower Defense, displays: wavesCompleted, towersBuilt, enemiesDefeated
 * All from the same code - no modifications needed!
 */

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { getGameTypeConfig } from '@/lib/game-types';
import Link from 'next/link';

export default async function GameAnalyticsPage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Ensure user is a teacher
  if (session.user.role !== 'TEACHER') {
    redirect('/student/dashboard');
  }

  // Get game with sessions and verify ownership
  const game = await db.game.findUnique({
    where: { id: gameId },
    include: {
      teacher: {
        include: {
          user: true,
        },
      },
      quiz: {
        select: {
          title: true,
          numQuestions: true,
        },
      },
      gameSessions: {
        include: {
          student: {
            include: {
              user: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          completedAt: 'desc',
        },
      },
    },
  });

  // Check if game exists
  if (!game) {
    return (
      <div className="min-h-screen bg-[#fffaf2] p-8 flex items-center justify-center">
        <div className="max-w-4xl mx-auto bg-white rounded-[20px] border-[3px] border-[#ff3875] p-8 text-center">
          <h1 className="font-quicksand font-bold text-[#473025] text-[32px] mb-4">Game Not Found</h1>
          <p className="font-quicksand text-[#473025]/70 text-[16px] mb-6">The game you&apos;re looking for doesn&apos;t exist.</p>
          <a
            href="/teacher/dashboard"
            className="inline-block bg-[#95b607] text-white font-quicksand font-bold px-6 py-3 rounded-[15px] border-[3px] border-[#006029] hover:bg-[#7a9700] transition-colors"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }

  // Verify ownership
  if (game.teacher.userId !== session.user.id) {
    redirect('/teacher/dashboard');
  }

  // ANALYTICS SYSTEM - Get game type configuration
  // This looks up the metrics definition for this game type (e.g., SNAKE, TOWER_DEFENSE)
  // from lib/game-types.ts and returns what columns to display
  const config = getGameTypeConfig(game.gameMode);

  // Calculate summary statistics
  const totalSessions = game.gameSessions.length;
  const averageScore = totalSessions > 0
    ? game.gameSessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions
    : 0;
  const averageAccuracy = totalSessions > 0
    ? game.gameSessions.reduce((sum, s) => {
        const accuracy = s.totalQuestions && s.totalQuestions > 0
          ? (s.correctAnswers || 0) / s.totalQuestions
          : 0;
        return sum + accuracy;
      }, 0) / totalSessions
    : 0;

  return (
    <div className="min-h-screen bg-[#fffaf2] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <a
            href="/teacher/dashboard"
            className="text-[#95b607] hover:text-[#7a9700] font-quicksand font-bold mb-4 inline-flex items-center gap-2 transition-colors"
          >
            <span className="text-xl">&larr;</span>
            <span>Back to Dashboard</span>
          </a>
          <h1 className="font-quicksand font-bold text-[#473025] text-[32px] md:text-[40px] mb-2 mt-4">{game.title}</h1>
          <p className="font-quicksand text-[#473025]/70 text-[16px]">
            {config.name} • {game.quiz.numQuestions} Questions • Share Code: <span className="font-bold text-[#95b607]">{game.shareCode}</span>
          </p>
        </div>

        {/* AI Class Analysis Button */}
        {game.gameSessions.length > 0 && (
          <div className="mb-6">
            <Link
              href={`/teacher/analytics/${gameId}/class-analysis`}
              className="inline-block bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Analyze Class Performance
            </Link>
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          <div className="bg-gradient-to-br from-[#96b902]/10 to-[#7a9700]/10 border-[3px] border-[#96b902] rounded-[15px] p-6 shadow-sm">
            <h3 className="font-quicksand font-bold text-[#473025]/60 text-[14px] mb-2 uppercase tracking-wide">Total Players</h3>
            <p className="font-quicksand font-bold text-[#473025] text-[36px] md:text-[40px]">{totalSessions}</p>
          </div>
          <div className="bg-gradient-to-br from-[#ff9f22]/10 to-[#fd9227]/10 border-[3px] border-[#ff9f22] rounded-[15px] p-6 shadow-sm">
            <h3 className="font-quicksand font-bold text-[#473025]/60 text-[14px] mb-2 uppercase tracking-wide">Average Score</h3>
            <p className="font-quicksand font-bold text-[#473025] text-[36px] md:text-[40px]">{Math.round(averageScore)}</p>
          </div>
          <div className="bg-gradient-to-br from-[#ff3875]/10 to-[#ff5a8f]/10 border-[3px] border-[#ff3875] rounded-[15px] p-6 shadow-sm">
            <h3 className="font-quicksand font-bold text-[#473025]/60 text-[14px] mb-2 uppercase tracking-wide">Average Accuracy</h3>
            <p className="font-quicksand font-bold text-[#473025] text-[36px] md:text-[40px]">
              {Math.round(averageAccuracy * 100)}%
            </p>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-[20px] shadow-sm border-[2px] border-[#473025]/10 overflow-hidden">
          <div className="px-6 py-5 border-b-[2px] border-[#473025]/10 bg-gradient-to-r from-[#fffaf2] to-white">
            <h2 className="font-quicksand font-bold text-[#473025] text-[24px] md:text-[28px]">Student Results</h2>
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
                    {/* ANALYTICS SYSTEM - Dynamic columns based on game type
                        Loops through config.metrics array from lib/game-types.ts
                        For Snake: Shows "Longest Streak", "Final Snake Length", etc.
                        For Tower Defense: Shows "Waves Completed", "Towers Built", etc.
                        No code changes needed when adding new game types! */}
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

                    // ANALYTICS SYSTEM - Extract game-specific metadata
                    // The metadata JSON field contains game-specific stats saved by the game
                    // e.g., { longestStreak: 12, finalLength: 25 } for Snake
                    const metadata = session.metadata as Record<string, unknown> | null;

                    return (
                      <tr key={session.id} className="hover:bg-[#fffaf2]/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {/* QUESTION ANALYTICS - Click to view detailed breakdown */}
                          <a
                            href={`/teacher/analytics/${gameId}/student/${session.id}`}
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
                        {/* ANALYTICS SYSTEM - Dynamic data extraction from metadata
                            For each metric defined in config.metrics:
                            1. Reads the value from session.metadata using the metric's key
                               e.g., metadata['longestStreak'] for Snake game
                            2. Applies optional formatter if defined
                               e.g., converts 0.85 to "85%" for accuracy
                            3. Shows 'N/A' if the value doesn't exist

                            This same code works for all game types! */}
                        {config.metrics.map((metric) => {
                          // Extract value from metadata JSON using the metric key
                          const value = metadata?.[metric.key];

                          // Apply formatter if one is defined, otherwise use raw value
                          const displayValue: string | number = metric.format && value !== undefined
                            ? metric.format(value)
                            : value !== undefined && (typeof value === 'string' || typeof value === 'number')
                            ? value
                            : 'N/A';

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
  );
}
