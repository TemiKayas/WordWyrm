
import { db } from '@/lib/db';

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No 0,O,I,1

export function generateShareCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

export async function generateUniqueShareCode(): Promise<string> {
  let attempts = 0;
  while (attempts < 10) {
    const code = generateShareCode();
    const existing = await db.game.findUnique({ where: { shareCode: code } });
    if (!existing) return code;
    attempts++;
  }
  throw new Error('Failed to generate unique share code after 10 attempts.');
}
