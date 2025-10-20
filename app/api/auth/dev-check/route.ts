import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const latest = await prisma.game.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, shareCode: true, active: true, createdAt: true },
  });
  return NextResponse.json({ latest });
}
