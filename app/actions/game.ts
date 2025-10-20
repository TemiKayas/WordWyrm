'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueShareCode } from '@/lib/utils/share-code';

//type of server action results, success or fail, T is the type of return.
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

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

    // gen a unique 6-character code for sharing the game
    const shareCode = await generateUniqueShareCode();

    // create the new game record in the db linking it to the quiz and teacher
    const game = await db.game.create({
      data: {
        quizId,
        teacherId: teacher.id,
        title,
        shareCode,
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

// gets specific game with associated quiz, loads all info for student to play the game
// returns ActionResult with game data or err msg on fail
export async function getGameWithQuiz(
  gameId: string
): Promise<ActionResult<{ game: any }>> { // using any for now to avoid complex type issues
  try {
    // fetch the game from the db and the related quiz and its source content
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        quiz: {
          include: {
            processedContent: true, // includes the original text from which the quiz was generated
          },
        },
      },
    });

    // if the game is not found, return an error.
    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // return game data on success.
    return { success: true, data: { game } };
  } catch (error) {
    // log the error and return a generic err msg
    console.error('Failed to get game:', error);
    return { success: false, error: 'Failed to retrieve game data.' };
  }
}