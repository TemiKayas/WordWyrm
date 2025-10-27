'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadPDF } from '@/lib/blob';
import { extractTextFromPDF, validatePDF } from '@/lib/processors/pdf-processor';
import { generateQuiz, Quiz } from '@/lib/processors/ai-generator';
import { generateUniqueShareCode } from '@/lib/utils/share-code';
import { generateGameQRCode } from '@/lib/utils/qr-code';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function uploadAndProcessPDF(
  formData: FormData
): Promise<ActionResult<{ quizId: string; quiz: Quiz; gameId: string; shareCode: string }>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    // Get teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Teacher profile not found' };
    }

    // Get and validate file
    const file = formData.get('pdf') as File;
    if (!file) {
      return { success: false, error: 'No file provided' };
    }

    const validation = validatePDF(file);
    if (!validation.valid) {
      return { success: false, error: validation.error! };
    }

    // Get number of questions (default 5)
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 5;

    // Upload to Vercel Blob
    console.log('Uploading PDF to Vercel Blob...');
    const blobUrl = await uploadPDF(file);

    // Save PDF record
    console.log('Saving PDF record to database...');
    const pdfRecord = await db.pDF.create({
      data: {
        teacherId: teacher.id,
        filename: file.name,
        blobUrl,
        fileSize: file.size,
        mimeType: file.type,
      },
    });

    // Extract text from PDF
    console.log('Extracting text from PDF...');
    console.log('File details:', { name: file.name, size: file.size, type: file.type });

    const arrayBuffer = await file.arrayBuffer();
    console.log('ArrayBuffer size:', arrayBuffer.byteLength);

    const buffer = Buffer.from(arrayBuffer);
    console.log('Buffer created, size:', buffer.length, 'isBuffer:', Buffer.isBuffer(buffer));

    const extractedText = await extractTextFromPDF(buffer);

    if (!extractedText || extractedText.length < 100) {
      return {
        success: false,
        error: 'Could not extract enough text from PDF. Please try a different file.',
      };
    }

    // Save processed content
    console.log('Saving processed content...');
    const processedContent = await db.processedContent.create({
      data: {
        pdfId: pdfRecord.id,
        extractedText,
        textLength: extractedText.length,
      },
    });

    // Generate quiz using Gemini
    console.log('Generating quiz with Gemini AI...');
    const quiz = await generateQuiz(extractedText, numQuestions);

    // save quiz
    console.log('Saving quiz to database...');
    const quizRecord = await db.quiz.create({
      data: {
        processedContentId: processedContent.id,
        title: file.name.replace('.pdf', ''),
        numQuestions: quiz.questions.length,
        quizJson: JSON.parse(JSON.stringify(quiz)),
      },
    });

    // Automatically create a Tower Defense game from the quiz
    console.log('Creating Tower Defense game...');
    const shareCode = await generateUniqueShareCode();
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const qrCodeUrl = await generateGameQRCode(shareCode, baseUrl);

    const game = await db.game.create({
      data: {
        quizId: quizRecord.id,
        teacherId: teacher.id,
        title: file.name.replace('.pdf', ''),
        shareCode,
        qrCodeUrl,
      },
    });

    console.log('Game created successfully with shareCode:', shareCode);

    return {
      success: true,
      data: {
        quizId: quizRecord.id,
        quiz: quiz,
        gameId: game.id,
        shareCode: shareCode,
      },
    };
  } catch (error) {
    console.error('PDF processing error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process PDF. Please try again.',
    };
  }
}
