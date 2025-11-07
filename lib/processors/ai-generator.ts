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

    const prompt = `You are an expert quiz generator specializing in ${subject} education. Based on the following text, create ${numQuestions} multiple-choice questions.

TEXT:
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
- Cover different parts of the text
- Keep questions clear and concise
- Follow the subject-specific guidelines above`;

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
