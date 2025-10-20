"use server";

import { prisma } from "@/lib/prisma";
import { generateUniqueShareCode } from "@/lib/shareCode";
import { auth } from "@/lib/auth";

function getBaseUrl() {
  // Public base URL for links/QR; supports local + Vercel
  const envPublic = process.env.NEXT_PUBLIC_BASE_URL;
  if (envPublic) return envPublic;

  const vercel = process.env.VERCEL_URL;
  if (vercel) return vercel.startsWith("http") ? vercel : `https://${vercel}`;

  return "http://localhost:3000";
}

export async function createGameFromQuiz(params: {
  quizId: string;
  title: string;
  description?: string;
  maxAttempts?: number;
  timeLimit?: number; // seconds
}) {
  // 1) Ensure user is authenticated & is a teacher
  const session = await auth?.();
  if (!session?.user?.id) throw new Error("Not authenticated");

  const teacher = await prisma.teacher.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!teacher) throw new Error("Teacher profile not found");

  // 2) Validate the quiz exists (optional: also check ownership)
  const quiz = await prisma.quiz.findUnique({
    where: { id: params.quizId },
    select: { id: true },
  });
  if (!quiz) throw new Error("Quiz not found");

  // 3) Generate a unique share code (e.g., ABC3F9)
  const shareCode = await generateUniqueShareCode(6);

  // 4) Create the Game
  const game = await prisma.game.create({
    data: {
      quizId: quiz.id,
      teacherId: teacher.id,
      title: params.title,
      description: params.description ?? null,
      shareCode,
      maxAttempts: params.maxAttempts ?? 1,
      timeLimit: params.timeLimit ?? null,
      active: true,
    },
    select: { id: true, title: true, shareCode: true },
  });

  // 5) Build the public URL (used for QR)
  const shareUrl = `${getBaseUrl()}/play/${game.shareCode}`;

  return { ...game, shareUrl };
}
