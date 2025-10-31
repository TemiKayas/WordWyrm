'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { Quiz } from '@/lib/processors/ai-generator';
import type { Quiz as PrismaQuiz, Game } from '@prisma/client';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Type for quiz with game info
type QuizWithGame = PrismaQuiz & {
  games: Game[];
};

// get all quizzes for the logged-in teacher
export async function getTeacherQuizzes(): Promise<
  ActionResult<{
    quizzes: Array<{
      id: string;
      title: string | null;
      numQuestions: number;
      createdAt: Date;
      quizJson: Quiz;
      hasGame: boolean;
      gameId?: string;
      shareCode?: string;
      pdfFilename?: string;
    }>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        pdfs: {
          include: {
            processedContent: {
              include: {
                quizzes: {
                  include: {
                    games: {
                      select: {
                        id: true,
                        shareCode: true,
                      },
                      take: 1,
                    },
                  },
                  orderBy: {
                    createdAt: 'desc',
                  },
                },
              },
            },
          },
          orderBy: {
            uploadedAt: 'desc',
          },
        },
      },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // flatten the nested structure to get all quizzes
    const quizzes = teacher.pdfs.flatMap((pdf) =>
      pdf.processedContent?.quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.title,
        numQuestions: quiz.numQuestions,
        createdAt: quiz.createdAt,
        quizJson: typeof quiz.quizJson === 'string'
          ? JSON.parse(quiz.quizJson)
          : (quiz.quizJson as unknown as Quiz),
        hasGame: quiz.games.length > 0,
        gameId: quiz.games[0]?.id,
        shareCode: quiz.games[0]?.shareCode,
        pdfFilename: pdf.filename,
      })) || []
    );

    return { success: true, data: { quizzes } };
  } catch (error) {
    console.error('Failed to get quizzes:', error);
    return { success: false, error: 'Failed to retrieve quizzes' };
  }
}

// get a specific quiz by ID
export async function getQuizById(
  quizId: string
): Promise<ActionResult<{ quiz: QuizWithGame }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: {
                teacher: true,
              },
            },
          },
        },
        games: true,
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // verify that this quiz belongs to the logged-in teacher
    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    return { success: true, data: { quiz } };
  } catch (error) {
    console.error('Failed to get quiz:', error);
    return { success: false, error: 'Failed to retrieve quiz' };
  }
}

// update quiz title
export async function updateQuizTitle(
  quizId: string,
  title: string
): Promise<ActionResult<{ quiz: PrismaQuiz }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify ownership
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // update the quiz
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: { title },
    });

    return { success: true, data: { quiz: updatedQuiz } };
  } catch (error) {
    console.error('Failed to update quiz:', error);
    return { success: false, error: 'Failed to update quiz' };
  }
}

// update quiz questions
export async function updateQuizQuestions(
  quizId: string,
  quizJson: Quiz
): Promise<ActionResult<{ quiz: PrismaQuiz }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify ownership
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // update the quiz questions and numQuestions
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: {
        quizJson: quizJson as unknown as object,
        numQuestions: quizJson.questions.length,
      },
    });

    return { success: true, data: { quiz: updatedQuiz } };
  } catch (error) {
    console.error('Failed to update quiz questions:', error);
    return { success: false, error: 'Failed to update quiz questions' };
  }
}

// delete a quiz (and cascade delete games)
export async function deleteQuiz(
  quizId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify ownership
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: {
                teacher: true,
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // delete the quiz (games will cascade delete due to schema)
    await db.quiz.delete({
      where: { id: quizId },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    return { success: false, error: 'Failed to delete quiz' };
  }
}

// get teacher stats for dashboard
export async function getTeacherStats(): Promise<
  ActionResult<{
    stats: {
      totalStudents: number;
      totalGames: number;
      avgScore: number;
      totalHoursPlayed: number;
    };
  }>
> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        games: {
          include: {
            gameSessions: true,
          },
        },
      },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // calculate stats
    const totalGames = teacher.games.length;
    const allSessions = teacher.games.flatMap((game) => game.gameSessions);
    const completedSessions = allSessions.filter((s) => s.completedAt);

    // unique students who have played
    const uniqueStudents = new Set(allSessions.map((s) => s.studentId));
    const totalStudents = uniqueStudents.size;

    // average score
    const scoresWithTotal = completedSessions.filter(
      (s) => s.score !== null && s.totalQuestions !== null && s.totalQuestions > 0
    );
    const avgScore =
      scoresWithTotal.length > 0
        ? Math.round(
            scoresWithTotal.reduce(
              (sum, s) => sum + ((s.score! / s.totalQuestions!) * 100),
              0
            ) / scoresWithTotal.length
          )
        : 0;

    // total hours played
    const totalSeconds = completedSessions.reduce(
      (sum, s) => sum + (s.timeSpent || 0),
      0
    );
    const totalHoursPlayed = Math.round(totalSeconds / 3600);

    return {
      success: true,
      data: {
        stats: {
          totalStudents,
          totalGames,
          avgScore,
          totalHoursPlayed,
        },
      },
    };
  } catch (error) {
    console.error('Failed to get teacher stats:', error);
    return { success: false, error: 'Failed to retrieve stats' };
  }
}
