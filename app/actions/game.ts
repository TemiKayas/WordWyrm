'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueShareCode } from '@/lib/utils/share-code';
import { generateGameQRCode } from '@/lib/utils/qr-code';
import type { Game, Quiz, ProcessedContent, PDF, Subject } from '@prisma/client';
import { GameMode } from '@prisma/client';

//type of server action results, success or fail, T is the type of return.
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Type for game with related quiz data
type GameWithQuiz = Game & {
  quiz: Quiz & {
    processedContent: ProcessedContent;
  };
};

// creates a new game with full settings (title, description, game mode, etc.)
export async function createGame(params: {
  quizId: string;
  title: string;
  description?: string;
  gameMode?: GameMode;
}): Promise<ActionResult<{ gameId: string; shareCode: string }>> {
  try {
    const { quizId, title, description, gameMode } = params;

    // ensure user is a teacher
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify that the teacher has a profile in db
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Get quiz to find the classId from its PDF
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: true,
          },
        },
      },
    });

    if (!quiz || !quiz.processedContent?.pdf) {
      return { success: false, error: 'Quiz or PDF not found' };
    }

    const classId = quiz.processedContent.pdf.classId;

    // gen a unique 6-character code for sharing the game
    const shareCode = await generateUniqueShareCode();

    // generate QR code and upload to Vercel Blob
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrCodeUrl = await generateGameQRCode(shareCode, baseUrl);

    // create the new game record in the db
    const game = await db.game.create({
      data: {
        quizId,
        teacherId: teacher.id,
        classId,
        title,
        description,
        shareCode,
        qrCodeUrl,
        gameMode: gameMode || GameMode.TRADITIONAL,
      },
    });

    // return new game info on success
    return { success: true, data: { gameId: game.id, shareCode: game.shareCode } };
  } catch (error) {
    // log the err for debugging and return generic err
    console.error('Failed to create game:', error);
    return {
      success: false,
      error: 'Failed to create game. Please try again.',
    };
  }
}

// creates a new game from generated quiz, restricted to teachers.
// ActionResult return with the new games ID on success or err otherwise.
export async function createGameFromQuiz(
  quizId: string,
  title: string
): Promise<ActionResult<{ gameId: string }>> {
  try {
    // ensure user is a teacher
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify that the teacher has a profile in db
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Get quiz to find the classId from its PDF
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: true,
          },
        },
      },
    });

    if (!quiz || !quiz.processedContent?.pdf) {
      return { success: false, error: 'Quiz or PDF not found' };
    }

    const classId = quiz.processedContent.pdf.classId;

    // gen a unique 6-character code for sharing the game
    const shareCode = await generateUniqueShareCode();

    // generate QR code and upload to Vercel Blob
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrCodeUrl = await generateGameQRCode(shareCode, baseUrl);

    // create the new game record in the db linking it to the quiz and teacher
    const game = await db.game.create({
      data: {
        quizId,
        teacherId: teacher.id,
        classId,
        title,
        shareCode,
        qrCodeUrl,
      },
    });

    // return new games id on success
    return { success: true, data: { gameId: game.id } };
  } catch (error) {
    // log the err for debugging and return generic err
    console.error('Failed to create game:', error);
    return {
      success: false,
      error: 'Failed to create game. Please try again.',
    };
  }
}

// gets specific game with associated quiz by ID or share code
// returns ActionResult with game data or err msg on fail
export async function getGameWithQuiz(
  idOrShareCode: string
): Promise<ActionResult<{ game: GameWithQuiz }>> {
  try {
    const session = await auth();

    // try to find game by share code first (more common for students)
    // if it's a long string (cuid), it's probably an ID
    let game;

    if (idOrShareCode.length === 6) {
      // likely a share code
      game = await db.game.findUnique({
        where: { shareCode: idOrShareCode },
        include: {
          quiz: {
            include: {
              processedContent: true,
            },
          },
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });
    } else {
      // likely a game ID
      game = await db.game.findUnique({
        where: { id: idOrShareCode },
        include: {
          quiz: {
            include: {
              processedContent: true,
            },
          },
          teacher: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    // if the game is not found, return an error.
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // If game is public and active, allow access to anyone
    if (game.isPublic && game.active) {
      return { success: true, data: { game } };
    }

    // For private games, check authentication and membership
    if (session?.user) {
      // If user is the teacher who created the game, allow access
      if (session.user.role === 'TEACHER' && game.teacher.userId === session.user.id) {
        return { success: true, data: { game } };
      }

      // For students (or other teachers), check class membership
      const membership = await db.classMembership.findUnique({
        where: {
          classId_userId: {
            classId: game.classId,
            userId: session.user.id,
          },
        },
      });

      if (!membership) {
        return {
          success: false,
          error: 'You must be a member of this class to access this game. Please join the class first.'
        };
      }
    } else {
      // If no session, require login
      return {
        success: false,
        error: 'Please log in to access this game.'
      };
    }

    // return game data on success.
    return { success: true, data: { game } };
  } catch (error) {
    // log the error and return a generic err msg
    console.error('Failed to get game:', error);
    return { success: false, error: 'Failed to retrieve game data.' };
  }
}

// updates game details (title, description, active status, public visibility, game mode)
export async function updateGame(params: {
  gameId: string;
  title?: string;
  description?: string;
  active?: boolean;
  isPublic?: boolean;
  gameMode?: GameMode;
  maxAttempts?: number;
  timeLimit?: number | null;
}): Promise<ActionResult<{ game: Game }>> {
  try {
    const { gameId, ...updateData } = params;

    // ensure user is a teacher
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify game exists and belongs to teacher
    const existingGame = await db.game.findUnique({
      where: { id: gameId },
      include: {
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existingGame) {
      return { success: false, error: 'Game not found' };
    }

    if (existingGame.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // update the game
    const updatedGame = await db.game.update({
      where: { id: gameId },
      data: updateData,
    });

    return { success: true, data: { game: updatedGame } };
  } catch (error) {
    console.error('Failed to update game:', error);
    return {
      success: false,
      error: 'Failed to update game. Please try again.',
    };
  }
}

export async function getGameQuizzes(
  gameId: string
): Promise<
  ActionResult<{
    quizzes: Array<{
      id: string;
      quiz: Quiz & { processedContent: ProcessedContent & { pdf: PDF } };
    }>;
  }>
> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify game exists and belongs to the teacher
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        teacher: {
          include: { user: true },
        },
        quiz: {
          include: {
            processedContent: {
              include: {
                pdf: true,
              },
            },
          },
        },
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // The current schema supports a single quiz per game. Return that quiz as an array
    // to satisfy the UI which expects an array of attached "quizzes".
    const quizzes: Array<{
      id: string;
      quiz: Quiz & { processedContent: ProcessedContent & { pdf: PDF } };
    }> = [];
    if (game.quiz) {
      quizzes.push({ id: game.id, quiz: game.quiz });
    }

    return { success: true, data: { quizzes } };
  } catch (error) {
    console.error('Failed to get game quizzes:', error);
    return { success: false, error: 'Failed to retrieve game quizzes' };
  }
}

export async function addQuizToGame(params: {
  gameId: string;
  quizId: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { gameId, quizId } = params;

    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // verify ownership of the game
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: { teacher: { include: { user: true } } },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // verify the quiz exists and belongs to the teacher who owns the game
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: { teacher: { include: { user: true } } },
            },
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // processedContent.pdf.teacher.userId should match session user
    if (quiz.processedContent?.pdf?.teacher?.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    await db.game.update({ where: { id: gameId }, data: { quizId } });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Failed to add quiz to game:', error);
    return { success: false, error: 'Failed to add quiz to game' };
  }
}

// remove a quiz from a game.
// here we delete the game when removing its quiz (the UI prevents removing the only PDF client-side),
export async function removeQuizFromGame(params: {
  gameId: string;
  quizId: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const { gameId, quizId } = params;

    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const game = await db.game.findUnique({
      where: { id: gameId },
      include: { teacher: { include: { user: true } } },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    if (game.teacher.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    if (game.quizId !== quizId) {
      return { success: false, error: 'Quiz is not attached to this game' };
    }

    // delete the game record to remove the association, this follows current schema constraints.
    await db.game.delete({ where: { id: gameId } });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Failed to remove quiz from game:', error);
    return { success: false, error: 'Failed to remove quiz from game' };
  }
}

// Filters for public games discovery
export interface PublicGameFilters {
  subject?: Subject;
  gameMode?: GameMode;
  search?: string;
  sortBy?: 'newest' | 'mostPlayed';
}

// Get public games for discovery page
export async function getPublicGames(
  filters?: PublicGameFilters
): Promise<
  ActionResult<{
    games: Array<{
      id: string;
      title: string;
      description: string | null;
      gameMode: GameMode;
      shareCode: string;
      imageUrl: string | null;
      createdAt: Date;
      teacher: {
        name: string;
        school: string | null;
      };
      quiz: {
        subject: Subject;
        numQuestions: number;
      };
      _count: {
        gameSessions: number;
      };
    }>;
  }>
> {
  try {
    // Build where clause
    const where: Record<string, unknown> = {
      isPublic: true,
      active: true,
    };

    // Apply filters
    if (filters?.subject) {
      where.quiz = {
        subject: filters.subject,
      };
    }

    if (filters?.gameMode) {
      where.gameMode = filters.gameMode;
    }

    if (filters?.search) {
      where.title = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Build orderBy
    const orderBy: Record<string, unknown>[] = filters?.sortBy === 'mostPlayed'
      ? [{ gameSessions: { _count: 'desc' } }]
      : [{ createdAt: 'desc' }];

    // Fetch public games
    const games = await db.game.findMany({
      where,
      include: {
        teacher: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
        },
        quiz: {
          select: {
            subject: true,
            numQuestions: true,
          },
        },
        _count: {
          select: {
            gameSessions: true,
          },
        },
      },
      orderBy,
      take: 50, // Limit to 50 games
    });

    console.log('[Public Games Query]', {
      totalFound: games.length,
      games: games.map(g => ({
        id: g.id,
        title: g.title,
        gameMode: g.gameMode,
        active: g.active,
        isPublic: g.isPublic,
      }))
    });

    // Transform data
    const transformedGames = games.map((game) => ({
      id: game.id,
      title: game.title,
      description: game.description,
      gameMode: game.gameMode,
      shareCode: game.shareCode,
      imageUrl: game.imageUrl,
      createdAt: game.createdAt,
      teacher: {
        name: game.teacher.user.name,
        school: game.teacher.school,
      },
      quiz: {
        subject: game.quiz.subject,
        numQuestions: game.quiz.numQuestions,
      },
      _count: {
        gameSessions: game._count.gameSessions,
      },
    }));

    return { success: true, data: { games: transformedGames } };
  } catch (error) {
    console.error('Failed to get public games:', error);
    return { success: false, error: 'Failed to retrieve public games' };
  }
}
