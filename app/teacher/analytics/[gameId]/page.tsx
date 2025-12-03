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
import GameAnalyticsContent from '@/components/analytics/GameAnalyticsContent';

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
      class: {
        select: {
          name: true,
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
  const rawConfig = getGameTypeConfig(game.gameMode);

  // Serialize config for client component (remove functions, use formatType instead)
  const config = {
    name: rawConfig.name,
    description: rawConfig.description,
    metrics: rawConfig.metrics.map((metric) => {
      // Determine formatType based on metric key
      let formatType: 'percentage' | 'seconds' | undefined = undefined;
      if (metric.format) {
        if (metric.key === 'accuracy') {
          formatType = 'percentage';
        } else if (metric.key === 'averageTimePerQuestion') {
          formatType = 'seconds';
        }
      }
      return {
        key: metric.key,
        label: metric.label,
        type: metric.type,
        formatType,
      };
    }),
  };

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

  // Transform game data for client component
  const gameData = {
    id: game.id,
    title: game.title,
    shareCode: game.shareCode,
    className: game.class.name,
    quiz: {
      title: game.quiz.title,
      numQuestions: game.quiz.numQuestions,
    },
    gameSessions: game.gameSessions.map((s) => ({
      id: s.id,
      score: s.score,
      correctAnswers: s.correctAnswers,
      totalQuestions: s.totalQuestions,
      completedAt: s.completedAt,
      guestName: s.guestName,
      metadata: s.metadata as Record<string, unknown> | null,
      student: s.student
        ? {
            user: {
              name: s.student.user.name,
              email: s.student.user.email,
            },
          }
        : null,
    })),
  };

  return (
    <GameAnalyticsContent
      game={gameData}
      config={config}
      totalSessions={totalSessions}
      averageScore={averageScore}
      averageAccuracy={averageAccuracy}
    />
  );
}
