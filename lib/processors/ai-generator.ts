import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export enum Subject {
  ENGLISH = 'ENGLISH',
  MATH = 'MATH',
  SCIENCE = 'SCIENCE',
  HISTORY = 'HISTORY',
  LANGUAGE = 'LANGUAGE',
  GENERAL = 'GENERAL',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation?: string;
}

export interface Quiz {
  questions: QuizQuestion[];
}

export interface ContentValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Validates content to ensure it has sufficient educational value for quiz generation.
 * Checks for coherence, educational content, and testable information.
 */
export async function validateContentForQuiz(
  content: string
): Promise<ContentValidationResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are a content quality validator for an educational quiz generation system.

Analyze the following content and determine if it contains sufficient meaningful information to generate a quiz.

CONTENT TO VALIDATE:
${content.slice(0, 5000)}

Evaluate based on these criteria (NOT quantity of text, but quality):
1. COHERENCE: Is this actual meaningful content or gibberish/random characters/placeholder text?
2. EDUCATIONAL OR INFORMATIONAL VALUE: Does it contain facts, concepts, definitions, biographical details (e.g., resumes), or clearly state a topic for generation?
3. TESTABILITY: Can multiple-choice questions with definitive correct answers be formed from this?

IMPORTANT:
- Short content is acceptable if it contains testable information (e.g., vocabulary lists, formulas, key dates)
- Long content is NOT acceptable if it's incoherent or lacks educational substance
- Focus on QUALITY and TESTABILITY, not length
- Accept resumes or CVs as valid content (treat them as biographical history)
- Accept short prompts that clearly define a topic (e.g., "Math quiz for grade 3"), assuming the system can generate questions from the topic alone

Return a JSON object:
{
  "valid": true/false,
  "reason": "Brief explanation if invalid (e.g., 'Content appears to be random characters', 'No testable information found', 'Content is too vague to form questions with definitive answers')"
}

If valid, set reason to null.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const validation = JSON.parse(response) as ContentValidationResult;

    return {
      valid: validation.valid,
      reason: validation.reason || undefined,
    };
  } catch (error) {
    console.error('Content validation error:', error);
    // If validation fails, allow content through but log the error
    // Better to attempt quiz generation than block on validation error
    return { valid: true };
  }
}

/**
 * Get difficulty-specific instructions for answer choice quality
 */
function getDifficultyInstructions(difficulty: Difficulty): string {
  switch (difficulty) {
    case Difficulty.HARD:
      return `CRITICAL - Answer Choice Quality for HARD Difficulty:
- ALL four options must be SIMILAR in length (within 10-20 words of each other)
- ALL options must have the SAME level of detail and specificity
- Incorrect options must be PLAUSIBLE and based on the content (not obviously wrong)
- Avoid one long detailed correct answer with three short vague wrong answers
- Each option should follow the same format and structure
- Wrong answers should be tempting distractors that require careful reading to eliminate
- Do NOT make the correct answer obvious by making it longer or more detailed than others`;

    case Difficulty.MEDIUM:
      return `CRITICAL - Answer Choice Quality for MEDIUM Difficulty:
- Create 1 correct option
- Create 1 highly competitive distractor (very similar to the correct answer, requiring careful thought)
- Create 1 moderately plausible distractor
- Create 1 obviously incorrect option (clearly wrong, easy to eliminate)
- Ensure options are generally similar in length and format
- Do NOT make the correct answer obvious by making it longer or more detailed than others`;

    case Difficulty.EASY:
      return `CRITICAL - Answer Choice Quality for EASY Difficulty:
- Create 1 correct option
- Create 2 moderately plausible distractors
- Create 1 obviously incorrect option (very easy to eliminate)
- Ensure options are generally similar in length and format
- Do NOT make the correct answer obvious by making it longer or more detailed than others`;

    default:
      return getDifficultyInstructions(Difficulty.HARD);
  }
}

export async function generateQuiz(
  text: string,
  numQuestions: number = 5,
  difficulty: Difficulty = Difficulty.HARD
): Promise<Quiz> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const difficultyInstructions = getDifficultyInstructions(difficulty);

    const prompt = `You are an expert quiz generator. Based on the following content, create ${numQuestions} multiple-choice questions.

CONTENT:
${text.slice(0, 10000)}

Generate a JSON object with this exact structure:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "The correct option text",
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

Requirements:
- Create exactly ${numQuestions} questions
- Each question must have exactly 4 options
- The answer must be one of the options (exact match)
- Questions should test understanding, not just memorization
- Cover different parts of the content
- Keep questions clear and concise
- If the content contains multiple sections (separated by "--- Content Section ---"), draw questions from ALL sections proportionally
- For shorter content (vocabulary lists, formulas, key terms), focus on definitions, applications, and relationships between concepts

${difficultyInstructions}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const quiz = JSON.parse(response) as Quiz;

    // Validate the quiz structure
    if (!quiz.questions || quiz.questions.length === 0) {
      throw new Error('No questions generated');
    }

    return quiz;
  } catch (error) {
    console.error('Quiz generation error:', error);
    throw new Error('Failed to generate quiz. Please try again.');
  }
}
