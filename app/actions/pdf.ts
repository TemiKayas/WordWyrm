'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadPDF } from '@/lib/blob';
import { extractTextFromPDF, validatePDF } from '@/lib/processors/pdf-processor';
import { generateQuiz, Quiz, Subject, QuizQuestion } from '@/lib/processors/ai-generator';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const MAX_TOTAL_SIZE_MB = 25;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

export async function uploadAndProcessPDF(
  formData: FormData
): Promise<ActionResult<{ quizId: string; quiz: Quiz }>> {
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

    // Get and validate classId
    const classId = formData.get('classId') as string;
    if (!classId) {
      return { success: false, error: 'Class ID is required' };
    }

    // Verify class belongs to teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classExists) {
      return { success: false, error: 'Invalid class or unauthorized' };
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

    // Get subject (default GENERAL if not provided)
    const subjectValue = formData.get('subject') as string;
    const subject = subjectValue && subjectValue in Subject
      ? (subjectValue as Subject)
      : Subject.GENERAL;

    // Upload to Vercel Blob
    console.log('Uploading PDF to Vercel Blob...');
    const blobUrl = await uploadPDF(file);

    // Save PDF record
    console.log('Saving PDF record to database...');
    const pdfRecord = await db.pDF.create({
      data: {
        teacherId: teacher.id,
        classId: classId,
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
    console.log(`Generating quiz with Gemini AI (Subject: ${subject})...`);
    const quiz = await generateQuiz(extractedText, numQuestions, subject);

    // save quiz
    console.log('Saving quiz to database...');
    const quizRecord = await db.quiz.create({
      data: {
        processedContentId: processedContent.id,
        title: file.name.replace('.pdf', ''),
        subject: subject,
        numQuestions: quiz.questions.length,
        quizJson: JSON.parse(JSON.stringify(quiz)),
      },
    });

    console.log('Quiz created successfully. Ready for game settings.');

    return {
      success: true,
      data: {
        quizId: quizRecord.id,
        quiz: quiz,
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

/**
 * Upload and process multiple PDFs, combining their questions into a single quiz
 */
export async function uploadAndProcessMultiplePDFs(
  formData: FormData
): Promise<ActionResult<{ quizId: string; quiz: Quiz }>> {
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

    // Get and validate classId
    const classId = formData.get('classId') as string;
    if (!classId) {
      return { success: false, error: 'Class ID is required' };
    }

    // Verify class belongs to teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classExists) {
      return { success: false, error: 'Invalid class or unauthorized' };
    }

    // Get all PDF files
    const files = formData.getAll('pdfs') as File[];
    if (files.length === 0) {
      return { success: false, error: 'No files provided' };
    }

    // Validate total file size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return {
        success: false,
        error: `Total file size (${(totalSize / 1024 / 1024).toFixed(2)}MB) exceeds ${MAX_TOTAL_SIZE_MB}MB limit`
      };
    }

    // Validate each file
    for (const file of files) {
      const validation = validatePDF(file);
      if (!validation.valid) {
        return { success: false, error: `${file.name}: ${validation.error}` };
      }
    }

    // Get parameters
    const totalQuestions = parseInt(formData.get('numQuestions') as string) || 5;
    const subjectValue = formData.get('subject') as string;
    const subject = subjectValue && subjectValue in Subject
      ? (subjectValue as Subject)
      : Subject.GENERAL;

    // Calculate questions per PDF (distribute evenly)
    const questionsPerPDF = Math.floor(totalQuestions / files.length);
    const remainingQuestions = totalQuestions % files.length;

    console.log(`Processing ${files.length} PDFs with ${totalQuestions} total questions`);
    console.log(`Base questions per PDF: ${questionsPerPDF}, Remaining: ${remainingQuestions}`);

    const pdfRecords: string[] = [];
    const allQuestions: QuizQuestion[] = [];
    let firstProcessedContentId: string | null = null;

    // Process each PDF
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const numQuestionsForThisPDF = questionsPerPDF + (i < remainingQuestions ? 1 : 0);

      console.log(`Processing ${file.name} (${i + 1}/${files.length}) - ${numQuestionsForThisPDF} questions`);

      // Upload to Vercel Blob
      const blobUrl = await uploadPDF(file);

      // Save PDF record
      const pdfRecord = await db.pDF.create({
        data: {
          teacherId: teacher.id,
          classId: classId,
          filename: file.name,
          blobUrl,
          fileSize: file.size,
          mimeType: file.type,
        },
      });

      pdfRecords.push(pdfRecord.id);

      // Extract text from PDF
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extractedText = await extractTextFromPDF(buffer);

      if (!extractedText || extractedText.length < 100) {
        return {
          success: false,
          error: `Could not extract enough text from ${file.name}. Please try a different file.`,
        };
      }

      // Save processed content
      const processedContent = await db.processedContent.create({
        data: {
          pdfId: pdfRecord.id,
          extractedText,
          textLength: extractedText.length,
        },
      });

      // Store first processed content ID for quiz reference
      if (!firstProcessedContentId) {
        firstProcessedContentId = processedContent.id;
      }

      // Generate questions for this PDF
      if (numQuestionsForThisPDF > 0) {
        const quiz = await generateQuiz(extractedText, numQuestionsForThisPDF, subject);
        allQuestions.push(...quiz.questions);
      }
    }

    if (!firstProcessedContentId) {
      return { success: false, error: 'Failed to process PDFs' };
    }

    // Create combined quiz
    const combinedQuiz: Quiz = { questions: allQuestions };
    const quizTitle = files.length === 1
      ? files[0].name.replace('.pdf', '')
      : `Combined Quiz (${files.length} PDFs)`;

    const quizRecord = await db.quiz.create({
      data: {
        processedContentId: firstProcessedContentId,
        title: quizTitle,
        subject: subject,
        numQuestions: allQuestions.length,
        quizJson: JSON.parse(JSON.stringify(combinedQuiz)),
      },
    });

    // Create QuizSource records to track which PDFs were used
    await Promise.all(
      pdfRecords.map((pdfId) =>
        db.quizSource.create({
          data: {
            quizId: quizRecord.id,
            pdfId,
          },
        })
      )
    );

    console.log(`Quiz created successfully with ${allQuestions.length} questions from ${files.length} PDFs`);

    return {
      success: true,
      data: {
        quizId: quizRecord.id,
        quiz: combinedQuiz,
      },
    };
  } catch (error) {
    console.error('Multiple PDF processing error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process PDFs. Please try again.',
    };
  }
}

/**
 * Get all source PDFs for a quiz
 */
export async function getQuizSourcePDFs(
  quizId: string
): Promise<ActionResult<{ pdfs: Array<{ id: string; filename: string; fileSize: number; uploadedAt: Date }> }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const quizSources = await db.quizSource.findMany({
      where: { quizId },
      include: {
        pdf: {
          select: {
            id: true,
            filename: true,
            fileSize: true,
            uploadedAt: true,
          },
        },
      },
    });

    const pdfs = quizSources.map(qs => qs.pdf);

    return { success: true, data: { pdfs } };
  } catch (error) {
    console.error('Get quiz source PDFs error:', error);
    return {
      success: false,
      error: 'Failed to retrieve PDFs',
    };
  }
}

/**
 * Remove a PDF from a quiz's sources (keeps the questions)
 */
export async function removePDFFromQuiz(params: {
  quizId: string;
  pdfId: string;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const { quizId, pdfId } = params;

    // Verify quiz belongs to teacher
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: {
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz || quiz.processedContent?.pdf?.teacher?.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Delete the QuizSource record
    await db.quizSource.delete({
      where: {
        quizId_pdfId: {
          quizId,
          pdfId,
        },
      },
    });

    return { success: true, data: { success: true } };
  } catch (error) {
    console.error('Remove PDF from quiz error:', error);
    return {
      success: false,
      error: 'Failed to remove PDF',
    };
  }
}

/**
 * Add new PDFs to a quiz and generate questions from them
 */
export async function addPDFsToQuiz(params: {
  quizId: string;
  formData: FormData;
}): Promise<ActionResult<{ addedQuestions: number }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const { quizId, formData } = params;

    // Get and validate quiz
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        processedContent: {
          include: {
            pdf: {
              include: {
                teacher: {
                  include: { user: true },
                },
                class: true,
              },
            },
          },
        },
      },
    });

    if (!quiz || quiz.processedContent?.pdf?.teacher?.userId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const teacherId = quiz.processedContent.pdf.teacher.id;
    const classId = quiz.processedContent.pdf.classId;
    const subject = quiz.subject as Subject;

    // Get new PDF files
    const files = formData.getAll('pdfs') as File[];
    if (files.length === 0) {
      return { success: false, error: 'No files provided' };
    }

    // Validate total file size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_TOTAL_SIZE_BYTES) {
      return {
        success: false,
        error: `Total file size exceeds ${MAX_TOTAL_SIZE_MB}MB limit`
      };
    }

    // Validate each file
    for (const file of files) {
      const validation = validatePDF(file);
      if (!validation.valid) {
        return { success: false, error: `${file.name}: ${validation.error}` };
      }
    }

    // Get number of questions to generate for new PDFs
    const numQuestions = parseInt(formData.get('numQuestions') as string) || 5;
    const questionsPerPDF = Math.floor(numQuestions / files.length);
    const remainingQuestions = numQuestions % files.length;

    const newQuestions: QuizQuestion[] = [];
    const pdfRecords: string[] = [];

    // Process each new PDF
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const numQuestionsForThisPDF = questionsPerPDF + (i < remainingQuestions ? 1 : 0);

      // Upload to Vercel Blob
      const blobUrl = await uploadPDF(file);

      // Save PDF record
      const pdfRecord = await db.pDF.create({
        data: {
          teacherId,
          classId,
          filename: file.name,
          blobUrl,
          fileSize: file.size,
          mimeType: file.type,
        },
      });

      pdfRecords.push(pdfRecord.id);

      // Extract text
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const extractedText = await extractTextFromPDF(buffer);

      if (!extractedText || extractedText.length < 100) {
        return {
          success: false,
          error: `Could not extract enough text from ${file.name}`,
        };
      }

      // Save processed content
      await db.processedContent.create({
        data: {
          pdfId: pdfRecord.id,
          extractedText,
          textLength: extractedText.length,
        },
      });

      // Generate questions for this PDF
      if (numQuestionsForThisPDF > 0) {
        const pdfQuiz = await generateQuiz(extractedText, numQuestionsForThisPDF, subject);
        newQuestions.push(...pdfQuiz.questions);
      }
    }

    // Get existing quiz questions
    const existingQuiz = typeof quiz.quizJson === 'string'
      ? JSON.parse(quiz.quizJson)
      : (quiz.quizJson as unknown as Quiz);

    const allQuestions = [...existingQuiz.questions, ...newQuestions];

    // Update quiz with combined questions
    await db.quiz.update({
      where: { id: quizId },
      data: {
        quizJson: JSON.parse(JSON.stringify({ questions: allQuestions })),
        numQuestions: allQuestions.length,
      },
    });

    // Create QuizSource records for new PDFs
    await Promise.all(
      pdfRecords.map((pdfId) =>
        db.quizSource.create({
          data: {
            quizId,
            pdfId,
          },
        })
      )
    );

    return {
      success: true,
      data: { addedQuestions: newQuestions.length },
    };
  } catch (error) {
    console.error('Add PDFs to quiz error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to add PDFs',
    };
  }
}

/**
 * Regenerate all questions for a quiz from its source PDFs
 */
export async function regenerateQuizQuestions(params: {
  quizId: string;
  numQuestions: number;
}): Promise<ActionResult<{ numQuestions: number }>> {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== 'TEACHER') {
      return { success: false, error: 'Unauthorized' };
    }

    const { quizId, numQuestions } = params;

    // Get quiz and its source PDFs
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        quizSources: {
          include: {
            pdf: {
              include: {
                processedContent: true,
                teacher: {
                  include: { user: true },
                },
              },
            },
          },
        },
      },
    });

    if (!quiz) {
      return { success: false, error: 'Quiz not found' };
    }

    // Verify ownership
    const ownerId = quiz.quizSources[0]?.pdf?.teacher?.userId;
    if (ownerId !== session.user.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const sourcePDFs = quiz.quizSources.map(qs => qs.pdf);
    if (sourcePDFs.length === 0) {
      return { success: false, error: 'No source PDFs found' };
    }

    const subject = quiz.subject as Subject;

    // Calculate questions per PDF
    const questionsPerPDF = Math.floor(numQuestions / sourcePDFs.length);
    const remainingQuestions = numQuestions % sourcePDFs.length;

    const allNewQuestions: QuizQuestion[] = [];

    // Generate questions from each PDF
    for (let i = 0; i < sourcePDFs.length; i++) {
      const pdf = sourcePDFs[i];
      const numQuestionsForThisPDF = questionsPerPDF + (i < remainingQuestions ? 1 : 0);

      if (!pdf.processedContent) {
        return { success: false, error: `No processed content for ${pdf.filename}` };
      }

      const extractedText = pdf.processedContent.extractedText;

      if (numQuestionsForThisPDF > 0) {
        const pdfQuiz = await generateQuiz(extractedText, numQuestionsForThisPDF, subject);
        allNewQuestions.push(...pdfQuiz.questions);
      }
    }

    // Update quiz with new questions
    await db.quiz.update({
      where: { id: quizId },
      data: {
        quizJson: JSON.parse(JSON.stringify({ questions: allNewQuestions })),
        numQuestions: allNewQuestions.length,
      },
    });

    return {
      success: true,
      data: { numQuestions: allNewQuestions.length },
    };
  } catch (error) {
    console.error('Regenerate quiz questions error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to regenerate questions',
    };
  }
}
