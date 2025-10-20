// app/api/games/[code]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: { code: string } }
) {
  const game = await prisma.game.findUnique({
    where: { shareCode: params.code },
    include: {
      quiz: { select: { title: true, quizJson: true } },
    },
  });

  if (!game || !game.active) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json({
    title: game.title,
    shareCode: game.shareCode,
    maxAttempts: game.maxAttempts,
    timeLimit: game.timeLimit,
    quiz: game.quiz, // includes quizJson
  });
}
