#!/usr/bin/env tsx

/**
 * Update all existing games to have proper thumbnails based on their game mode
 */

import { PrismaClient } from '@prisma/client';
import { getDefaultGameThumbnail } from '@/lib/utils/game';

const db = new PrismaClient();

async function updateGameThumbnails() {
  console.log('\n🖼️  Updating game thumbnails...\n');

  try {
    // Find all games without imageUrl or with null imageUrl
    const games = await db.game.findMany({
      where: {
        OR: [
          { imageUrl: null },
          { imageUrl: '' },
        ],
      },
      select: {
        id: true,
        title: true,
        gameMode: true,
        imageUrl: true,
      },
    });

    console.log(`Found ${games.length} games without thumbnails\n`);

    if (games.length === 0) {
      console.log('✅ All games already have thumbnails!\n');
      return;
    }

    let updated = 0;

    for (const game of games) {
      const thumbnailUrl = getDefaultGameThumbnail(game.gameMode);

      await db.game.update({
        where: { id: game.id },
        data: { imageUrl: thumbnailUrl },
      });

      console.log(`✓ Updated "${game.title}" (${game.gameMode}) -> ${thumbnailUrl}`);
      updated++;
    }

    console.log(`\n✅ Successfully updated ${updated} games with thumbnails!\n`);
  } catch (error) {
    console.error('❌ Error updating thumbnails:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

// Run the script
updateGameThumbnails();
