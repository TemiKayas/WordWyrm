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

// get all quizzes for the logged-in teacher, optionally filtered by classId
export async function getTeacherQuizzes(classId?: string): Promise<
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
      qrCodeUrl?: string | null;
      imageUrl?: string | null;
      gameMode?: string;
      classId?: string;
    }>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'You must be logged in as a teacher to view quizzes.' };
    }

    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
      include: {
        pdfs: {
          where: classId ? { classId } : undefined,
          include: {
            processedContent: {
              include: {
                quizzes: {
                  include: {
                    games: {
                      select: {
                        id: true,
                        shareCode: true,
                        qrCodeUrl: true,
                        imageUrl: true,
                        title: true,
                        gameMode: true,
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
      return { success: false, error: 'Your teacher profile is not set up. Please contact support.' };
    }

    // flatten the nested structure to get all quizzes
    const quizzes = teacher.pdfs.flatMap((pdf) =>
      pdf.processedContent?.quizzes.map((quiz) => ({
        id: quiz.id,
        title: quiz.games[0]?.title || quiz.title,
        numQuestions: quiz.numQuestions,
        createdAt: quiz.createdAt,
        quizJson: typeof quiz.quizJson === 'string'
          ? JSON.parse(quiz.quizJson)
          : (quiz.quizJson as unknown as Quiz),
        hasGame: quiz.games.length > 0,
        gameId: quiz.games[0]?.id,
        shareCode: quiz.games[0]?.shareCode,
        qrCodeUrl: quiz.games[0]?.qrCodeUrl || null,
        imageUrl: quiz.games[0]?.imageUrl || null,
        pdfFilename: pdf.filename,
        gameMode: quiz.games[0]?.gameMode,
        classId: pdf.classId,
      })) || []
    );

    return { success: true, data: { quizzes } };
  } catch (error) {
    console.error('Failed to get quizzes:', error);
    return { success: false, error: 'We couldn\'t load your quizzes. Please refresh the page and try again.' };
  }
}

// get a specific quiz by ID
export async function getQuizById(
  quizId: string
): Promise<ActionResult<{ quiz: QuizWithGame }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'You must be logged in as a teacher to view quizzes.' };
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
      return { success: false, error: 'This quiz doesn\'t exist or has been deleted.' };
    }

    // verify that this quiz belongs to the logged-in teacher
    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'You don\'t have permission to modify this quiz.' };
    }

    return { success: true, data: { quiz } };
  } catch (error) {
    console.error('Failed to get quiz:', error);
    return { success: false, error: 'We couldn\'t load this quiz. Please refresh the page and try again.' };
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
      return { success: false, error: 'You must be logged in as a teacher to view quizzes.' };
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
      return { success: false, error: 'This quiz doesn\'t exist or has been deleted.' };
    }

    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'You don\'t have permission to modify this quiz.' };
    }

    // update the quiz
    const updatedQuiz = await db.quiz.update({
      where: { id: quizId },
      data: { title },
    });

    return { success: true, data: { quiz: updatedQuiz } };
  } catch (error) {
    console.error('Failed to update quiz:', error);
    return { success: false, error: 'We couldn\'t save your quiz changes. Please try again.' };
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
      return { success: false, error: 'You must be logged in as a teacher to view quizzes.' };
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
      return { success: false, error: 'This quiz doesn\'t exist or has been deleted.' };
    }

    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'You don\'t have permission to modify this quiz.' };
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
    return { success: false, error: 'We couldn\'t save your question changes. Please try again.' };
  }
}

// delete a quiz (and cascade delete games)
export async function deleteQuiz(
  quizId: string
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'You must be logged in as a teacher to view quizzes.' };
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
      return { success: false, error: 'This quiz doesn\'t exist or has been deleted.' };
    }

    if (quiz.processedContent.pdf.teacher.userId !== session.user.id) {
      return { success: false, error: 'You don\'t have permission to modify this quiz.' };
    }

    // delete the quiz (games will cascade delete due to schema)
    await db.quiz.delete({
      where: { id: quizId },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Failed to delete quiz:', error);
    return { success: false, error: 'We couldn\'t delete this quiz. It may be in use by an active game. Please try again later.' };
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
      return { success: false, error: 'You must be logged in as a teacher to view quizzes.' };
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
      return { success: false, error: 'Your teacher profile is not set up. Please contact support.' };
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
