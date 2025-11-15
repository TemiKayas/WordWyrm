import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { question, options, correctAnswer, wasCorrect, studentAnswer } = await request.json();

    // Validate inputs
    if (!question || !options || !correctAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    let prompt = '';

    if (wasCorrect) {
      // Explanation for correct answer
      prompt = `You are a friendly, encouraging tutor helping a student understand a quiz question they just answered CORRECTLY.

Question: "${question}"
Options: ${options.join(', ')}
Correct Answer: "${correctAnswer}"
Student's Answer: "${studentAnswer}" (CORRECT!)

Provide a clear, concise explanation (3-4 sentences) that:
1. Praises them for getting it right
2. Explains why "${correctAnswer}" is the correct answer
3. Reinforces the key concept to solidify their understanding
4. Is encouraging and positive in tone

Keep it brief and educational.`;
    } else {
      // Explanation for wrong answer
      prompt = `You are a friendly, encouraging tutor helping a student understand a quiz question they just answered INCORRECTLY.

Question: "${question}"
Options: ${options.join(', ')}
Correct Answer: "${correctAnswer}"
Student's Answer: "${studentAnswer}" (INCORRECT)

Provide a clear, concise explanation (3-4 sentences) that:
1. Gently acknowledges their answer wasn't quite right
2. Explains why "${studentAnswer}" was incorrect
3. Explains why "${correctAnswer}" is the correct answer
4. Is encouraging and helps them learn from the mistake

Keep it brief, kind, and educational.`;
    }

    const result = await model.generateContent(prompt);
    const explanation = result.response.text();

    return NextResponse.json({ explanation });
  } catch (error) {
    console.error('Explanation generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate explanation' },
      { status: 500 }
    );
  }
}
