/**
 * =============================================================================
 * STUDENT DETAIL PAGE - QUESTION-BY-QUESTION BREAKDOWN
 * =============================================================================
 *
 * This page shows a detailed view of an individual student's performance
 * on a specific game session, including every question they answered.
 *
 * DISPLAYS:
 * - Student name and overall stats (score, accuracy)
 * - Question-by-question breakdown showing:
 *   - ✓ or ✗ for correct/incorrect
 *   - The question text
 *   - What answer the student selected
 *   - What the correct answer was (if wrong)
 * - Button to get AI analysis of student's performance
 */

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ gameId: string; sessionId: string }>;
}) {
  const { gameId, sessionId } = await params;
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  // Ensure user is a teacher
  if (session.user.role !== 'TEACHER') {
    redirect('/student/dashboard');
  }

  // Get teacher profile
  const teacher = await db.teacher.findUnique({
    where: { userId: session.user.id },
  });

  if (!teacher) {
    redirect('/teacher/dashboard');
  }

  // Get game session with student and game details
  const gameSession = await db.gameSession.findUnique({
    where: { id: sessionId },
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
      game: {
        select: {
          title: true,
          teacherId: true,
        },
      },
    },
  });

  if (!gameSession) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Session Not Found</h1>
          <p className="text-gray-600">This game session doesn&apos;t exist.</p>
        </div>
      </div>
    );
  }

  // Verify teacher owns this game
  if (gameSession.game.teacherId !== teacher.id) {
    redirect('/teacher/dashboard');
  }

  // Get student name (handle guest players)
  const studentName = gameSession.student?.user.name || gameSession.guestName || 'Guest Player';
  const studentEmail = gameSession.student?.user.email;

  // Calculate accuracy
  const accuracy = gameSession.totalQuestions && gameSession.totalQuestions > 0
    ? ((gameSession.correctAnswers || 0) / gameSession.totalQuestions) * 100
    : 0;

  // Get question responses from JSON field
  const questionResponses = gameSession.questionResponses as Record<string, {
    questionText: string;
    selectedAnswer: string;
    correctAnswer: string;
    correct: boolean;
  }> | null;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href={`/teacher/analytics/${gameId}`}
          className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
        >
          ← Back to Analytics
        </Link>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 font-quicksand">
            {studentName}&apos;s Performance
          </h1>
          <p className="text-gray-600 font-quicksand mb-4">
            {gameSession.game.title}
            {studentEmail && ` • ${studentEmail}`}
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 font-quicksand font-semibold">Score</p>
              <p className="text-2xl font-bold text-gray-900 font-quicksand">{gameSession.score || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 font-quicksand font-semibold">Correct Answers</p>
              <p className="text-2xl font-bold text-gray-900 font-quicksand">
                {gameSession.correctAnswers || 0} / {gameSession.totalQuestions || 0}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500 font-quicksand font-semibold">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900 font-quicksand">{Math.round(accuracy)}%</p>
            </div>
          </div>

          {/* AI Analysis Button */}
          <div className="mt-6">
            <Link
              href={`/teacher/analytics/${gameId}/student/${sessionId}/analysis`}
              className="inline-block bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold px-6 py-3 rounded-lg transition-colors"
            >
              Get AI Analysis →
            </Link>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 font-quicksand">
            Question-by-Question Breakdown
          </h2>

          {!questionResponses || Object.keys(questionResponses).length === 0 ? (
            <p className="text-gray-500 font-quicksand">
              No detailed question data available for this session.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(questionResponses)
                .sort((a, b) => {
                  // Sort by question number (q0, q1, q2, etc.)
                  const numA = parseInt(a[0].replace('q', ''));
                  const numB = parseInt(b[0].replace('q', ''));
                  return numA - numB;
                })
                .map(([questionId, response], index) => (
                  <div
                    key={questionId}
                    className={`p-4 rounded-lg border-2 ${
                      response.correct
                        ? 'border-green-200 bg-green-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkmark or X */}
                      <div className="flex-shrink-0 mt-1">
                        {response.correct ? (
                          <span className="text-2xl text-green-600">✓</span>
                        ) : (
                          <span className="text-2xl text-red-600">✗</span>
                        )}
                      </div>

                      {/* Question Content */}
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900 mb-2 font-quicksand">
                          Question {index + 1}: {response.questionText}
                        </p>

                        <div className="space-y-1">
                          <p className="text-sm font-quicksand">
                            <span className="text-gray-600">Student&apos;s Answer: </span>
                            <span className={`font-semibold ${
                              response.correct ? 'text-green-700' : 'text-red-700'
                            }`}>
                              {response.selectedAnswer}
                            </span>
                          </p>

                          {!response.correct && (
                            <p className="text-sm font-quicksand">
                              <span className="text-gray-600">Correct Answer: </span>
                              <span className="font-semibold text-green-700">
                                {response.correctAnswer}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
