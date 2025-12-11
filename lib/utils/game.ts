import { GameMode } from '@prisma/client';

/**
 * Get the default thumbnail image URL for a game based on its game mode
 * @param gameMode - The game mode (TRADITIONAL, SNAKE, TOWER_DEFENSE)
 * @returns The URL path to the default thumbnail image
 */
export function getDefaultGameThumbnail(gameMode: GameMode): string {
  switch (gameMode) {
    case 'SNAKE':
      return '/assets/snake-thumbnail.png';
    case 'TOWER_DEFENSE':
      return '/assets/td-thumbnail.png';
    case 'TRADITIONAL':
    default:
      // For traditional quiz games, we can use a quiz-themed thumbnail
      // or return null to show the default icon fallback
      return '/assets/game-preview/game-thumbnail.png';
  }
}
