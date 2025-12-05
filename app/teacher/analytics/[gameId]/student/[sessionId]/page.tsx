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
      questionAttempts: {
        orderBy: {
          createdAt: 'asc',
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

  // Group question attempts by question text to show attempt history
  const questionMap = new Map<string, Array<{
    attemptNumber: number;
    selectedAnswer: string;
    correctAnswer: string;
    wasCorrect: boolean;
    createdAt: Date;
  }>>();

  gameSession.questionAttempts.forEach(attempt => {
    if (!questionMap.has(attempt.questionText)) {
      questionMap.set(attempt.questionText, []);
    }
    questionMap.get(attempt.questionText)!.push({
      attemptNumber: attempt.attemptNumber,
      selectedAnswer: attempt.selectedAnswer,
      correctAnswer: attempt.correctAnswer,
      wasCorrect: attempt.wasCorrect,
      createdAt: attempt.createdAt,
    });
  });

  // Convert to array for rendering
  const questions = Array.from(questionMap.entries()).map(([questionText, attempts]) => ({
    questionText,
    attempts: attempts.sort((a, b) => a.attemptNumber - b.attemptNumber),
    finalResult: attempts[attempts.length - 1]?.wasCorrect || false,
  }));

  return (
    <div className="min-h-screen bg-[#fffaf2] p-8">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link
          href={`/teacher/leaderboard/${gameId}`}
          className="text-[#95b607] hover:underline mb-6 inline-block font-quicksand font-semibold"
        >
          ← Back to Game Results
        </Link>

        {/* Header */}
        <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 p-6 mb-6">
          <h1 className="text-3xl font-bold text-[#473025] mb-2 font-quicksand">
            {studentName}&apos;s Performance
          </h1>
          <p className="text-[#473025]/70 font-quicksand mb-4">
            {gameSession.game.title}
            {studentEmail && ` • ${studentEmail}`}
          </p>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#fffaf2] rounded-[15px] border-2 border-[#473025]/10 p-4">
              <p className="text-sm text-[#473025]/70 font-quicksand font-semibold">Score</p>
              <p className="text-2xl font-bold text-[#473025] font-quicksand">{gameSession.score || 0}</p>
            </div>
            <div className="bg-[#fffaf2] rounded-[15px] border-2 border-[#473025]/10 p-4">
              <p className="text-sm text-[#473025]/70 font-quicksand font-semibold">Correct Answers</p>
              <p className="text-2xl font-bold text-[#473025] font-quicksand">
                {gameSession.correctAnswers || 0} / {gameSession.totalQuestions || 0}
              </p>
            </div>
            <div className="bg-[#fffaf2] rounded-[15px] border-2 border-[#473025]/10 p-4">
              <p className="text-sm text-[#473025]/70 font-quicksand font-semibold">Accuracy</p>
              <p className="text-2xl font-bold text-[#473025] font-quicksand">{Math.round(accuracy)}%</p>
            </div>
          </div>

          {/* AI Analysis Button */}
          <div className="mt-6">
            <Link
              href={`/teacher/analytics/${gameId}/student/${sessionId}/analysis`}
              className="inline-block bg-[#95b607] hover:bg-[#7a9700] text-white font-quicksand font-bold px-6 py-3 rounded-[15px] transition-colors"
            >
              Get AI Analysis →
            </Link>
          </div>
        </div>

        {/* Question Breakdown */}
        <div className="bg-white rounded-[20px] border-2 border-[#473025]/10 p-6">
          <h2 className="text-xl font-semibold text-[#473025] mb-4 font-quicksand">
            Question-by-Question Breakdown
          </h2>

          {questions.length === 0 ? (
            <p className="text-[#473025]/70 font-quicksand">
              No detailed question data available for this session.
            </p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-[15px] border-2 ${
                    question.finalResult
                      ? 'border-[#00b894]/30 bg-[#00b894]/5'
                      : 'border-[#ff6b6b]/30 bg-[#ff6b6b]/5'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkmark or X based on final result */}
                    <div className="flex-shrink-0 mt-1">
                      {question.finalResult ? (
                        <span className="text-2xl text-[#00b894]">✓</span>
                      ) : (
                        <span className="text-2xl text-[#ff6b6b]">✗</span>
                      )}
                    </div>

                    {/* Question Content */}
                    <div className="flex-1">
                      <p className="font-semibold text-[#473025] mb-3 font-quicksand">
                        Question {index + 1}: {question.questionText}
                      </p>

                      {/* Attempt History */}
                      <div className="space-y-2">
                        {question.attempts.map((attempt, attemptIdx) => (
                          <div
                            key={attemptIdx}
                            className={`p-3 rounded-[10px] border-2 ${
                              attempt.wasCorrect
                                ? 'border-[#00b894] bg-[#00b894]/10'
                                : 'border-[#ff6b6b] bg-[#ff6b6b]/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-semibold text-[#473025]/70 font-quicksand">
                                Attempt {attempt.attemptNumber}
                              </span>
                              {attempt.wasCorrect ? (
                                <span className="text-xs text-[#00b894] font-bold">✓ Correct</span>
                              ) : (
                                <span className="text-xs text-[#ff6b6b] font-bold">✗ Incorrect</span>
                              )}
                            </div>
                            <p className="text-sm font-quicksand">
                              <span className="text-[#473025]/70">Answer: </span>
                              <span className={`font-semibold ${
                                attempt.wasCorrect ? 'text-[#00b894]' : 'text-[#ff6b6b]'
                              }`}>
                                {attempt.selectedAnswer}
                              </span>
                            </p>
                            {!attempt.wasCorrect && (
                              <p className="text-sm font-quicksand">
                                <span className="text-[#473025]/70">Correct Answer: </span>
                                <span className="font-semibold text-[#00b894]">
                                  {attempt.correctAnswer}
                                </span>
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Summary if multiple attempts */}
                      {question.attempts.length > 1 && (
                        <p className="text-xs text-[#473025]/60 mt-2 font-quicksand italic">
                          {question.attempts.length} total attempts •
                          Final result: {question.finalResult ? 'Correct' : 'Incorrect'}
                        </p>
                      )}
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
