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
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Game Not Found</h1>
          <p className="text-gray-600">The game you&apos;re looking for doesn&apos;t exist.</p>
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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <a
            href="/teacher/dashboard"
            className="text-[#95b607] hover:underline mb-4 inline-block"
          >
            &larr; Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{game.title}</h1>
          <p className="text-gray-600">
            {config.name} • {game.quiz.numQuestions} Questions • Share Code: {game.shareCode}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Total Players</h3>
            <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Score</h3>
            <p className="text-3xl font-bold text-gray-900">{Math.round(averageScore)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Average Accuracy</h3>
            <p className="text-3xl font-bold text-gray-900">
              {Math.round(averageAccuracy * 100)}%
            </p>
          </div>
        </div>

        {/* Sessions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Student Results</h2>
          </div>

          {game.gameSessions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">No students have played this game yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Correct Answers
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {metric.label}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {game.gameSessions.map((session) => {
                    const accuracy = session.totalQuestions && session.totalQuestions > 0
                      ? ((session.correctAnswers || 0) / session.totalQuestions) * 100
                      : 0;

                    // ANALYTICS SYSTEM - Extract game-specific metadata
                    // The metadata JSON field contains game-specific stats saved by the game
                    // e.g., { longestStreak: 12, finalLength: 25 } for Snake
                    const metadata = session.metadata as Record<string, unknown> | null;

                    return (
                      <tr key={session.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {session.student.user.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {session.student.user.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {session.score || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {session.correctAnswers || 0} / {session.totalQuestions || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
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
                              <div className="text-sm text-gray-900">{displayValue}</div>
                            </td>
                          );
                        })}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
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
