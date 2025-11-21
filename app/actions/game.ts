'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueShareCode } from '@/lib/utils/share-code';
import { generateGameQRCode } from '@/lib/utils/qr-code';
import type { Game, Quiz, ProcessedContent, PDF, Subject } from '@prisma/client';
import { GameMode, Prisma } from '@prisma/client';

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

// Access state for games
type GameAccessState =
  | 'allowed'           // User can play and will be tracked (class member or teacher)
  | 'allowed_no_track'  // User can play but won't be tracked (not in class)
  | 'private_denied'    // Game is private and user doesn't have access
  | 'prompt_login';     // Game is public but user isn't logged in - show login prompt

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
// returns ActionResult with game data and access state
export async function getGameWithQuiz(
  idOrShareCode: string
): Promise<ActionResult<{ game: GameWithQuiz; accessState: GameAccessState; isAuthenticated: boolean }>> {
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

    // Check if game is active
    if (!game.active) {
      return { success: false, error: 'This game is no longer active' };
    }

    // Determine access state based on game visibility and user auth
    let accessState: GameAccessState;

    // Track if user is authenticated
    const isAuthenticated = !!session?.user;

    // Check if user is authenticated
    if (session?.user) {
      // If user is the teacher who created the game, always allow full access
      if (session.user.role === 'TEACHER' && game.teacher.userId === session.user.id) {
        return { success: true, data: { game, accessState: 'allowed', isAuthenticated } };
      }

      // Check if user is a class member
      const membership = await db.classMembership.findUnique({
        where: {
          classId_userId: {
            classId: game.classId,
            userId: session.user.id,
          },
        },
      });

      if (membership) {
        // Class member - will be tracked
        accessState = 'allowed';
      } else if (game.isPublic) {
        // Public game but not a class member - won't be tracked
        accessState = 'allowed_no_track';
      } else {
        // Private game and not a class member - denied
        return { success: true, data: { game, accessState: 'private_denied', isAuthenticated } };
      }
    } else {
      // User is not logged in
      if (game.isPublic) {
        // Public game - prompt to login (they can still play as guest)
        accessState = 'prompt_login';
      } else {
        // Private game and not logged in - denied
        return { success: true, data: { game, accessState: 'private_denied', isAuthenticated } };
      }
    }

    return { success: true, data: { game, accessState, isAuthenticated } };
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

/**
 * =============================================================================
 * SAVE GAME SESSION - ANALYTICS SYSTEM
 * =============================================================================
 *
 * This function saves or updates a student's game session with their performance data.
 * It's used by all game types to record student progress and enable analytics.
 *
 * UNIVERSAL FIELDS (same for all game types):
 * - score: The final score the student achieved
 * - correctAnswers: Number of questions answered correctly
 * - totalQuestions: Total number of questions in the quiz
 * - timeSpent: Time in seconds the student spent playing (optional)
 *
 * GAME-SPECIFIC FIELDS (stored in metadata):
 * - metadata: A flexible JSON object for game-specific statistics
 *   Examples:
 *   - Snake: { longestStreak: 12, finalLength: 25 }
 *   - Tower Defense: { wavesCompleted: 15, towersBuilt: 8, enemiesDefeated: 250 }
 *   - Traditional: { accuracy: 0.85, averageTimePerQuestion: 12 }
 *
 * HOW TO USE IN YOUR GAME:
 *
 * 1. Import the function:
 *    import { saveGameSession } from '@/app/actions/game';
 *
 * 2. Call it when the game ends:
 *    const result = await saveGameSession({
 *      gameId: 'your-game-id',
 *      score: 1000,
 *      correctAnswers: 8,
 *      totalQuestions: 10,
 *      timeSpent: 180,  // 3 minutes
 *      metadata: {
 *        // Your game-specific stats (must match keys in lib/game-types.ts)
 *        customMetric1: value1,
 *        customMetric2: value2
 *      }
 *    });
 *
 *    if (result.success) {
 *      console.log('Session saved!', result.data.sessionId);
 *    }
 *
 * IMPORTANT NOTES:
 * - Uses upsert: If student played this game before, it updates their session
 * - Requires authentication: Student must be logged in
 * - The metadata object should match the metrics defined in lib/game-types.ts
 * - The analytics dashboard automatically reads these values to display stats
 */
export async function saveGameSession(params: {
  gameId: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeSpent?: number;
  metadata?: Record<string, unknown>;  // Game-specific statistics (flexible JSON)
  questionResponses?: Record<string, unknown>;  // QUESTION ANALYTICS - Individual question data
}): Promise<ActionResult<{ sessionId: string }>> {
  try {
    const { gameId, score, correctAnswers, totalQuestions, timeSpent, metadata, questionResponses } = params;

    // Get current user session
    const session = await auth();
    let studentId: string | null = null;
    let isClassMember = false;

    // Get the game to check class membership
    const game = await db.game.findUnique({
      where: { id: gameId },
      select: { classId: true },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // If user is logged in, try to get their student profile and check class membership
    if (session?.user) {
      const student = await db.student.findUnique({
        where: { userId: session.user.id },
      });

      if (student) {
        studentId = student.id;

        // Check if student is in the same class as the game
        const membership = await db.classMembership.findUnique({
          where: {
            classId_userId: {
              classId: game.classId,
              userId: session.user.id,
            },
          },
        });

        isClassMember = !!membership;
      }
    }

    // Only save analytics for class members
    // Anyone can play via QR code/link, but only class members get tracked
    if (!isClassMember) {
      // Not a class member - don't track analytics
      // Return success so the game doesn't show an error
      return { success: true, data: { sessionId: 'not-tracked' } };
    }

    // Create or update game session for class member
    // Find existing session or create new one
    const existingSession = await db.gameSession.findFirst({
      where: {
        gameId,
        studentId,
      },
    });

    if (existingSession) {
      // Update existing session
      const gameSession = await db.gameSession.update({
        where: { id: existingSession.id },
        data: {
          score,
          correctAnswers,
          totalQuestions,
          timeSpent,
          metadata: metadata as Prisma.InputJsonValue | undefined,
          questionResponses: questionResponses as Prisma.InputJsonValue | undefined,  // QUESTION ANALYTICS
          completedAt: new Date(),
        },
      });

      return { success: true, data: { sessionId: gameSession.id } };
    } else {
      // Create new session
      const gameSession = await db.gameSession.create({
        data: {
          gameId,
          studentId,
          score,
          correctAnswers,
          totalQuestions,
          timeSpent,
          metadata: metadata as Prisma.InputJsonValue | undefined,
          questionResponses: questionResponses as Prisma.InputJsonValue | undefined,  // QUESTION ANALYTICS
          completedAt: new Date(),
        },
      });

      return { success: true, data: { sessionId: gameSession.id } };
    }
  } catch (error) {
    console.error('Failed to save game session:', error);
    return {
      success: false,
      error: 'Failed to save your score. Please try again.',
    };
  }
}
