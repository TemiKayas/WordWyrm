'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { generateUniqueShareCode } from '@/lib/utils/share-code';
import { generateGameQRCode } from '@/lib/utils/qr-code';
import { uploadGameImage, deleteGameImage } from '@/lib/blob';
import type { Game, Quiz, ProcessedContent, GameMode } from '@prisma/client';

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

// creates a new game with full settings (title, description, etc.)
export async function createGame(params: {
  quizId: string;
  title: string;
  description?: string;
}): Promise<ActionResult<{ gameId: string; shareCode: string }>> {
  try {
    const { quizId, title, description } = params;

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

    // generate QR code and upload to Vercel Blob
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrCodeUrl = await generateGameQRCode(shareCode, baseUrl);

    // create the new game record in the db
    const game = await db.game.create({
      data: {
        quizId,
        teacherId: teacher.id,
        title,
        description,
        shareCode,
        qrCodeUrl,
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
        },
      });
    }

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

// updates an existing game with new settings (title, description, image, etc.)
export async function updateGame(params: {
  gameId: string;
  title?: string;
  description?: string;
  imageFile?: File; // New image to upload
  removeImage?: boolean; // Flag to remove existing image
  isPublic?: boolean;
  gameMode?: GameMode;
}): Promise<ActionResult<{ game: Game }>> {
  try {
    const { gameId, title, description, imageFile, removeImage, isPublic, gameMode } = params;

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

    // verify that the game exists and belongs to this teacher
    const existingGame = await db.game.findUnique({
      where: { id: gameId },
    });

    if (!existingGame) {
      return { success: false, error: 'Game not found' };
    }

    if (existingGame.teacherId !== teacher.id) {
      return { success: false, error: 'You do not have permission to edit this game' };
    }

    // handle image upload/removal
    let newImageUrl = existingGame.imageUrl;

    if (removeImage && existingGame.imageUrl) {
      // delete old image from blob storage
      try {
        await deleteGameImage(existingGame.imageUrl);
        newImageUrl = null;
      } catch (error) {
        console.error('Failed to delete old image:', error);
        // continue anyway, just log the error
      }
    } else if (imageFile) {
      // upload new image
      try {
        // delete old image if exists
        if (existingGame.imageUrl) {
          await deleteGameImage(existingGame.imageUrl);
        }
        newImageUrl = await uploadGameImage(imageFile);
      } catch (error) {
        console.error('Failed to upload new image:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to upload image',
        };
      }
    }

    // build update data object (only include fields that were provided)
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (newImageUrl !== existingGame.imageUrl) updateData.imageUrl = newImageUrl;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (gameMode !== undefined) updateData.gameMode = gameMode;

    // update the game record in the database
    const updatedGame = await db.game.update({
      where: { id: gameId },
      data: updateData,
    });

    console.log(`Game ${gameId} updated successfully`);

    return { success: true, data: { game: updatedGame } };
  } catch (error) {
    console.error('Failed to update game:', error);
    return {
      success: false,
      error: 'Failed to update game. Please try again.',
    };
  }
}