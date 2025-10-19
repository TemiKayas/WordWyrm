// lib/shareCode.ts
import crypto from "crypto";
import { prisma } from "@/lib/prisma"; // your prisma singleton

// Uppercase letters and digits without confusing chars (no 0/O, 1/I)
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export async function generateUniqueShareCode(length = 6): Promise<string> {
  while (true) {
    const code = randomCode(length);
    const existing = await prisma.game.findUnique({ where: { shareCode: code } });
    if (!existing) return code;
  }
}