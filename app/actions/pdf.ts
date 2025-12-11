'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { uploadPDF } from '@/lib/blob';
import { extractTextFromPDF, validatePDF } from '@/lib/processors/pdf-processor';
import { generateQuiz, Quiz, Subject, QuizQuestion, validateContentForQuiz, Difficulty } from '@/lib/processors/ai-generator';

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
      return { success: false, error: 'You must be logged in as a teacher to upload PDFs.' };
    }

    // Get teacher profile
    const teacher = await db.teacher.findUnique({
      where: { userId: session.user.id },
    });

    if (!teacher) {
      return { success: false, error: 'Your teacher profile is not set up. Please contact support.' };
    }

    // Get and validate classId
    const classId = formData.get('classId') as string;
    if (!classId) {
      return { success: false, error: 'Please select a class before uploading a PDF.' };
    }

    // Verify class belongs to teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classExists) {
      return { success: false, error: 'This class doesn\'t exist or you don\'t have permission to upload to it.' };
    }

    // Get and validate file
    const file = formData.get('pdf') as File;
    if (!file) {
      return { success: false, error: 'Please select a PDF file to upload.' };
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

    // Extract text from PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const extractedText = await extractTextFromPDF(buffer);

    if (!extractedText || extractedText.length < 100) {
      return {
        success: false,
        error: 'Unable to extract readable text from this PDF. This may be a scanned image or password-protected file. Please try a different PDF with selectable text.',
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

    // Generate quiz using Gemini
    const quiz = await generateQuiz(extractedText, numQuestions);

    // save quiz
    const quizRecord = await db.quiz.create({
      data: {
        processedContentId: processedContent.id,
        title: file.name.replace('.pdf', ''),
        subject: subject,
        numQuestions: quiz.questions.length,
        quizJson: JSON.parse(JSON.stringify(quiz)),
      },
    });

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
          : 'We encountered an issue processing your PDF. Please ensure it\'s a valid PDF file under 25MB and try again.',
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
      return { success: false, error: 'Your teacher profile is not set up. Please contact support.' };
    }

    // Get and validate classId
    const classId = formData.get('classId') as string;
    if (!classId) {
      return { success: false, error: 'Please select a class before uploading a PDF.' };
    }

    // Verify class belongs to teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classExists) {
      return { success: false, error: 'This class doesn\'t exist or you don\'t have permission to upload to it.' };
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
        error: `Your selected files total ${(totalSize / 1024 / 1024).toFixed(2)}MB, which exceeds our ${MAX_TOTAL_SIZE_MB}MB limit. Please select fewer or smaller files.`
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

    const pdfRecords: string[] = [];
    const allQuestions: QuizQuestion[] = [];
    let firstProcessedContentId: string | null = null;

    // Process each PDF
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const numQuestionsForThisPDF = questionsPerPDF + (i < remainingQuestions ? 1 : 0);

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
          error: `Unable to extract readable text from '${file.name}'. This file may be a scanned image or empty. Please try a different PDF.`
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
        const quiz = await generateQuiz(extractedText, numQuestionsForThisPDF);
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
          error: `Unable to extract text from '${file.name}'. Please ensure this is a text-based PDF, not a scanned image.`
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
        const pdfQuiz = await generateQuiz(extractedText, numQuestionsForThisPDF);
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
        const pdfQuiz = await generateQuiz(extractedText, numQuestionsForThisPDF);
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

/**
 * Process content from text input, PDFs, or both to generate a quiz
 * Supports three modes:
 * - Text only: Just the textContent field
 * - PDF only: Just the pdfs files
 * - Text + PDF: Both textContent and pdfs
 */
export async function processContentForQuiz(
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
      return { success: false, error: 'Your teacher profile is not set up. Please contact support.' };
    }

    // Get and validate classId
    const classId = formData.get('classId') as string;
    if (!classId) {
      return { success: false, error: 'Please select a class before uploading a PDF.' };
    }

    // Verify class belongs to teacher
    const classExists = await db.class.findFirst({
      where: {
        id: classId,
        teacherId: teacher.id,
      },
    });

    if (!classExists) {
      return { success: false, error: 'This class doesn\'t exist or you don\'t have permission to upload to it.' };
    }

    // Get content inputs
    const textContent = formData.get('textContent') as string | null;
    const files = formData.getAll('pdfs') as File[];

    // Validate that at least one content source is provided
    const hasText = textContent && textContent.trim().length > 0;
    const hasPDFs = files.length > 0;

    if (!hasText && !hasPDFs) {
      return { success: false, error: 'Please either paste text content or upload at least one PDF file to generate a quiz.' };
    }

    // Get parameters
    const totalQuestions = parseInt(formData.get('numQuestions') as string) || 5;
    const subjectValue = formData.get('subject') as string;
    const subject = subjectValue && subjectValue in Subject
      ? (subjectValue as Subject)
      : Subject.GENERAL;

    // Validate total file size if PDFs provided
    if (hasPDFs) {
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
    }

    // Collect all content
    const contentParts: string[] = [];
    const pdfRecords: string[] = [];
    let firstProcessedContentId: string | null = null;

    // Add text content if provided
    if (hasText) {
      contentParts.push(textContent!.trim());
    }

    // Process PDFs and extract text
    if (hasPDFs) {
      for (const file of files) {
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
            error: `Unable to extract readable text from '${file.name}'. This PDF may be scanned or encrypted. Please upload a text-based PDF.`
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

        contentParts.push(extractedText);
      }
    }

    // Combine all content
    const combinedContent = contentParts.join('\n\n--- Content Section ---\n\n');

    // Validate content quality using AI
    const validationResult = await validateContentForQuiz(combinedContent);

    if (!validationResult.valid) {
      return {
        success: false,
        error: validationResult.reason || 'This content doesn\'t appear to contain enough educational material to generate a meaningful quiz. Please provide more detailed content or a different PDF.',
      };
    }

    // Generate quiz from combined content
    const quiz = await generateQuiz(combinedContent, totalQuestions);

    // Create quiz record
    // For text-only content, we need to create a placeholder ProcessedContent
    if (!firstProcessedContentId && hasText) {
      // Create a placeholder PDF record for text-only content
      const placeholderPdf = await db.pDF.create({
        data: {
          teacherId: teacher.id,
          classId: classId,
          filename: 'text-input.txt',
          blobUrl: '', // No blob for text-only
          fileSize: textContent!.length,
          mimeType: 'text/plain',
        },
      });

      pdfRecords.push(placeholderPdf.id);

      const processedContent = await db.processedContent.create({
        data: {
          pdfId: placeholderPdf.id,
          extractedText: textContent!,
          textLength: textContent!.length,
        },
      });

      firstProcessedContentId = processedContent.id;
    }

    // Determine quiz title
    let quizTitle: string;
    if (hasPDFs && hasText) {
      quizTitle = files.length === 1
        ? `${files[0].name.replace('.pdf', '')} + Text`
        : `Combined Quiz (${files.length} PDFs + Text)`;
    } else if (hasPDFs) {
      quizTitle = files.length === 1
        ? files[0].name.replace('.pdf', '')
        : `Combined Quiz (${files.length} PDFs)`;
    } else {
      quizTitle = 'Text-Based Quiz';
    }

    const quizRecord = await db.quiz.create({
      data: {
        processedContentId: firstProcessedContentId!,
        title: quizTitle,
        subject: subject,
        numQuestions: quiz.questions.length,
        quizJson: JSON.parse(JSON.stringify(quiz)),
      },
    });

    // Create QuizSource records to track which PDFs were used
    if (pdfRecords.length > 0) {
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
    }

    return {
      success: true,
      data: {
        quizId: quizRecord.id,
        quiz: quiz,
      },
    };
  } catch (error) {
    console.error('Content processing error:', error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to process content. Please try again.',
    };
  }
}
