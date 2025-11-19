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
  content: string,
  subject: Subject = Subject.GENERAL
): Promise<ContentValidationResult> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const prompt = `You are a content quality validator for an educational quiz generation system.

Analyze the following content and determine if it contains sufficient meaningful information to generate a quiz for the subject: ${subject}.

CONTENT TO VALIDATE:
${content.slice(0, 5000)}

Evaluate based on these criteria (NOT quantity of text, but quality):
1. COHERENCE: Is this actual meaningful content or gibberish/random characters/placeholder text?
2. EDUCATIONAL VALUE: Does it contain facts, concepts, definitions, processes, or information that can be tested?
3. TESTABILITY: Can multiple-choice questions with definitive correct answers be formed from this?

IMPORTANT:
- Short content is acceptable if it contains testable information (e.g., vocabulary lists, formulas, key dates)
- Long content is NOT acceptable if it's incoherent or lacks educational substance
- Focus on QUALITY and TESTABILITY, not length

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
 * Get subject-specific instructions for quiz generation
 */
function getSubjectSpecificInstructions(subject: Subject): string {
  switch (subject) {
    case Subject.ENGLISH:
      return `Focus on:
- Reading comprehension and analysis
- Literary devices (metaphors, similes, imagery, etc.)
- Grammar, syntax, and vocabulary usage
- Theme identification and character analysis
- Writing techniques and author's purpose
- Ensure questions test deep understanding of the text, not just recall`;

    case Subject.MATH:
      return `Focus on:
- Problem-solving and mathematical reasoning
- Application of formulas and theorems
- Step-by-step solution processes
- Mathematical concepts and principles
- Include numerical problems when relevant
- Ensure answer options are mathematically distinct and plausible`;

    case Subject.SCIENCE:
      return `Focus on:
- Scientific concepts, theories, and principles
- Cause-and-effect relationships
- Experimental methods and observations
- Scientific terminology and definitions
- Real-world applications of concepts
- Ensure questions require scientific reasoning, not just memorization`;

    case Subject.HISTORY:
      return `Focus on:
- Historical events, dates, and timelines
- Cause-and-effect relationships in historical contexts
- Key figures, their roles, and contributions
- Historical significance and impact
- Connections between past and present
- Ensure questions test analytical thinking about historical context`;

    case Subject.LANGUAGE:
      return `Focus on:
- Vocabulary and word meanings
- Grammar rules and sentence structure
- Language usage and idiomatic expressions
- Translation and comprehension (if applicable)
- Cultural context of language use
- Ensure questions test practical language understanding`;

    case Subject.GENERAL:
    default:
      return `Focus on:
- Key concepts and main ideas from the text
- Important details and supporting information
- Logical reasoning and comprehension
- Practical application of the content
- Ensure questions cover different sections of the material`;
  }
}

export async function generateQuiz(
  text: string,
  numQuestions: number = 5,
  subject: Subject = Subject.GENERAL
): Promise<Quiz> {
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const subjectInstructions = getSubjectSpecificInstructions(subject);

    const prompt = `You are an expert quiz generator specializing in ${subject} education. Based on the following content, create ${numQuestions} multiple-choice questions.

CONTENT:
${text.slice(0, 10000)}

SUBJECT-SPECIFIC GUIDELINES:
${subjectInstructions}

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
- Follow the subject-specific guidelines above
- If the content contains multiple sections (separated by "--- Content Section ---"), draw questions from ALL sections proportionally
- For shorter content (vocabulary lists, formulas, key terms), focus on definitions, applications, and relationships between concepts

CRITICAL - Answer Choice Quality:
- ALL four options must be SIMILAR in length (within 10-20 words of each other)
- ALL options must have the SAME level of detail and specificity
- Incorrect options must be PLAUSIBLE and based on the content (not obviously wrong)
- Avoid one long detailed correct answer with three short vague wrong answers
- Each option should follow the same format and structure
- Wrong answers should be tempting distractors that require careful reading to eliminate
- Do NOT make the correct answer obvious by making it longer or more detailed than others`;

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
