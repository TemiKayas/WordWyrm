/**
 * =============================================================================
 * ANALYTICS SERVER ACTIONS - AI-POWERED PERFORMANCE ANALYSIS
 * =============================================================================
 *
 * This file contains server actions for analyzing student performance using
 * Google Gemini AI. Provides insights for both individual students and entire
 * classes based on question-by-question data.
 */

'use server';

import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { GoogleGenerativeAI } from '@google/generative-ai';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * Analyze an individual student's performance on a game session
 * Uses AI to identify strengths, weaknesses, patterns, and recommendations
 */
export async function analyzeStudentPerformance(
  sessionId: string
): Promise<ActionResult<{
  studentName: string;
  score: number;
  accuracy: number;
  analysis: {
    strengths: string;
    weaknesses: string;
    patterns: string;
    recommendations: string[];
  };
}>> {
  try {
    const session = await auth();

    // Must be logged in as teacher
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

    // Get game session with all details
    const gameSession = await db.gameSession.findUnique({
      where: { id: sessionId },
      include: {
        student: {
          include: {
            user: {
              select: {
                name: true,
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
      },
    });

    if (!gameSession) {
      return { success: false, error: 'Session not found' };
    }

    // Verify teacher owns this game
    if (gameSession.game.teacherId !== teacher.id) {
      return { success: false, error: 'Unauthorized' };
    }

    // Get student name
    const studentName = gameSession.student?.user.name || gameSession.guestName || 'Guest Player';

    // Calculate accuracy
    const accuracy = gameSession.totalQuestions && gameSession.totalQuestions > 0
      ? ((gameSession.correctAnswers || 0) / gameSession.totalQuestions) * 100
      : 0;

    // Get question responses
    const questionResponses = gameSession.questionResponses as Record<string, {
      questionText: string;
      selectedAnswer: string;
      correctAnswer: string;
      correct: boolean;
    }> | null;

    if (!questionResponses || Object.keys(questionResponses).length === 0) {
      return {
        success: false,
        error: 'No detailed question data available for analysis'
      };
    }

    // Prepare data for AI analysis
    const responsesList = Object.entries(questionResponses).map(([key, response]) => ({
      questionNumber: parseInt(key.replace('q', '')) + 1,
      ...response
    })).sort((a, b) => a.questionNumber - b.questionNumber);

    const correctQuestions = responsesList.filter(r => r.correct);
    const incorrectQuestions = responsesList.filter(r => !r.correct);

    // Call Gemini API
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Analyze this student's quiz performance and provide educational insights.

Student: ${studentName}
Score: ${gameSession.score || 0}
Correct: ${gameSession.correctAnswers || 0} / ${gameSession.totalQuestions || 0} (${Math.round(accuracy)}%)

Questions Answered Correctly:
${correctQuestions.map(q => `- Q${q.questionNumber}: ${q.questionText}`).join('\n') || 'None'}

Questions Answered Incorrectly:
${incorrectQuestions.map(q =>
  `- Q${q.questionNumber}: ${q.questionText}
  Student selected: ${q.selectedAnswer}
  Correct answer: ${q.correctAnswer}`
).join('\n') || 'None'}

Provide a JSON response with this structure:
{
  "strengths": "A paragraph describing what topics/concepts the student understands well based on correct answers",
  "weaknesses": "A paragraph describing what topics the student struggled with based on incorrect answers",
  "patterns": "A paragraph identifying any patterns in mistakes or learning style (e.g., rushes through, confuses similar concepts, etc.)",
  "recommendations": ["Specific recommendation 1", "Specific recommendation 2", "Specific recommendation 3"]
}

Focus on being:
- Specific and actionable
- Educational and constructive
- Based on the actual questions they got right/wrong
- Helpful for the teacher to provide targeted support`;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();
    const analysis = JSON.parse(analysisText);

    return {
      success: true,
      data: {
        studentName,
        score: gameSession.score || 0,
        accuracy: Math.round(accuracy),
        analysis,
      },
    };
  } catch (error) {
    console.error('Error analyzing student performance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze performance'
    };
  }
}

/**
 * Analyze entire class performance on a game
 * Uses AI to identify difficult questions, common mistakes, and teaching recommendations
 */
export async function analyzeClassPerformance(
  gameId: string
): Promise<ActionResult<{
  totalStudents: number;
  averageScore: number;
  averageAccuracy: number;
  analysis: {
    summary: string;
    difficultQuestions: Array<{
      question: string;
      successRate: number;
      commonWrongAnswer: string;
    }>;
    studentsNeedingHelp: string[];
    topPerformers: string[];
    recommendations: string[];
  };
}>> {
  try {
    const session = await auth();

    // Must be logged in as teacher
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

    // Get game with all sessions
    const game = await db.game.findUnique({
      where: { id: gameId },
      include: {
        gameSessions: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!game) {
      return { success: false, error: 'Game not found' };
    }

    // Verify teacher owns this game
    if (game.teacherId !== teacher.id) {
      return { success: false, error: 'Unauthorized' };
    }

    const sessions = game.gameSessions;

    if (sessions.length === 0) {
      return { success: false, error: 'No students have played this game yet' };
    }

    // Calculate summary stats
    const totalStudents = sessions.length;
    const averageScore = sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalStudents;
    const averageAccuracy = sessions.reduce((sum, s) => {
      const acc = s.totalQuestions && s.totalQuestions > 0
        ? (s.correctAnswers || 0) / s.totalQuestions
        : 0;
      return sum + acc;
    }, 0) / totalStudents;

    // Aggregate question performance
    const questionStats: Record<string, {
      question: string;
      correctCount: number;
      totalAttempts: number;
      wrongAnswers: string[];
    }> = {};

    sessions.forEach(session => {
      const responses = session.questionResponses as Record<string, {
        questionText: string;
        selectedAnswer: string;
        correctAnswer: string;
        correct: boolean;
      }> | null;

      if (responses) {
        Object.entries(responses).forEach(([qId, response]) => {
          if (!questionStats[qId]) {
            questionStats[qId] = {
              question: response.questionText,
              correctCount: 0,
              totalAttempts: 0,
              wrongAnswers: [],
            };
          }

          questionStats[qId].totalAttempts++;
          if (response.correct) {
            questionStats[qId].correctCount++;
          } else {
            questionStats[qId].wrongAnswers.push(response.selectedAnswer);
          }
        });
      }
    });

    // Find most difficult questions
    const difficultQuestions = Object.entries(questionStats)
      .map(([qId, stats]) => ({
        question: stats.question,
        successRate: (stats.correctCount / stats.totalAttempts) * 100,
        commonWrongAnswer: getMostCommon(stats.wrongAnswers) || 'Various',
      }))
      .sort((a, b) => a.successRate - b.successRate)
      .slice(0, 5);

    // Identify struggling students and top performers
    const sortedByScore = [...sessions].sort((a, b) => (b.score || 0) - (a.score || 0));
    const topPerformers = sortedByScore
      .slice(0, 3)
      .map(s => s.student?.user.name || s.guestName || 'Guest');

    const studentsNeedingHelp = sortedByScore
      .slice(-3)
      .reverse()
      .map(s => s.student?.user.name || s.guestName || 'Guest');

    // Call Gemini for insights
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `Analyze this class's quiz performance and provide teaching insights.

Game: ${game.title}
Total Students: ${totalStudents}
Average Score: ${Math.round(averageScore)}
Average Accuracy: ${Math.round(averageAccuracy * 100)}%

Most Difficult Questions:
${difficultQuestions.map((q, i) =>
  `${i + 1}. "${q.question}" - ${Math.round(q.successRate)}% success rate
  Most common wrong answer: ${q.commonWrongAnswer}`
).join('\n')}

Top Performers: ${topPerformers.join(', ')}
Students Needing Extra Help: ${studentsNeedingHelp.join(', ')}

Provide a JSON response with this structure:
{
  "summary": "A paragraph summarizing overall class performance and key trends",
  "recommendations": [
    "Specific teaching recommendation 1",
    "Specific teaching recommendation 2",
    "Specific teaching recommendation 3",
    "Specific teaching recommendation 4"
  ]
}

Focus on:
- What concepts to review in class
- Specific teaching strategies for difficult questions
- How to support struggling students
- Enrichment suggestions for top performers`;

    const result = await model.generateContent(prompt);
    const analysisText = result.response.text();
    const aiAnalysis = JSON.parse(analysisText);

    return {
      success: true,
      data: {
        totalStudents,
        averageScore: Math.round(averageScore),
        averageAccuracy: Math.round(averageAccuracy * 100),
        analysis: {
          summary: aiAnalysis.summary,
          difficultQuestions,
          studentsNeedingHelp,
          topPerformers,
          recommendations: aiAnalysis.recommendations,
        },
      },
    };
  } catch (error) {
    console.error('Error analyzing class performance:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to analyze performance'
    };
  }
}

/**
 * Helper function to find the most common item in an array
 */
function getMostCommon(arr: string[]): string | null {
  if (arr.length === 0) return null;

  const counts: Record<string, number> = {};
  arr.forEach(item => {
    counts[item] = (counts[item] || 0) + 1;
  });

  let maxCount = 0;
  let mostCommon = null;

  for (const [item, count] of Object.entries(counts)) {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = item;
    }
  }

  return mostCommon;
}
