import { GameMode } from '@prisma/client';

/**
 * =============================================================================
 * GAME TYPE ANALYTICS CONFIGURATION
 * =============================================================================
 *
 * This file defines the analytics metrics for each game type in the WordWyrm platform.
 * It uses a configuration-driven approach to make the analytics dashboard reusable
 * across all game modes without requiring code changes to the dashboard itself.
 *
 * HOW IT WORKS:
 * 1. Each game type (SNAKE, TOWER_DEFENSE, etc.) defines what metrics it tracks
 * 2. When a game ends, it saves those metrics in the GameSession.metadata JSON field
 * 3. The analytics dashboard reads this config to know what columns to display
 * 4. The dashboard automatically renders the metrics based on the game's gameMode
 *
 * ADDING A NEW GAME TYPE:
 * 1. Add your game mode to the Prisma schema GameMode enum (if not already there)
 * 2. Add a configuration object to GAME_TYPES below
 * 3. In your game code, call saveGameSession() with your metadata when the game ends
 * 4. The analytics dashboard will automatically work - no changes needed!
 *
 * EXAMPLE:
 * If you're creating a "Memory Match" game, you would:
 * 1. Add to this file:
 *    MEMORY_MATCH: {
 *      name: 'Memory Match',
 *      description: 'Match pairs of cards',
 *      metrics: [
 *        { key: 'matchesFound', label: 'Matches Found', type: 'number' },
 *        { key: 'totalMoves', label: 'Total Moves', type: 'number' }
 *      ]
 *    }
 *
 * 2. In your game code when game ends:
 *    await saveGameSession({
 *      gameId,
 *      score: finalScore,
 *      correctAnswers: matches,
 *      totalQuestions: totalPairs,
 *      metadata: {
 *        matchesFound: matches,
 *        totalMoves: moves
 *      }
 *    });
 */

/**
 * Defines a single metric that a game type tracks
 */
export interface GameMetric {
  key: string;           // The key in the metadata JSON object (e.g., 'longestStreak')
  label: string;         // Display label in the analytics table (e.g., 'Longest Streak')
  type: 'number' | 'string' | 'boolean';  // Data type of the metric
  format?: (value: any) => string;  // Optional formatter for display (e.g., converting 0.85 to "85%")
}

/**
 * Configuration for a game type's analytics
 */
export interface GameTypeConfig {
  name: string;          // Display name of the game type
  description: string;   // Brief description of how the game works
  metrics: GameMetric[]; // Array of metrics this game type tracks
}

/**
 * Configuration registry for all game types
 * Maps each GameMode enum value to its analytics configuration
 */
export const GAME_TYPES: Record<GameMode, GameTypeConfig> = {
  // =============================================================================
  // SNAKE QUIZ GAME
  // =============================================================================
  // Tracks: streak performance, snake growth, and question accuracy
  // Implemented in: lib/phaser/SnakeScene.ts
  SNAKE: {
    name: 'Snake Quiz',
    description: 'Navigate the snake to collect correct answers while avoiding incorrect ones',
    metrics: [
      {
        key: 'longestStreak',          // Saved in SnakeScene.ts (metadata.longestStreak)
        label: 'Longest Streak',       // Maximum consecutive correct answers achieved
        type: 'number'
      }
    ]
  },

  // =============================================================================
  // TOWER DEFENSE GAME
  // =============================================================================
  // TODO: Update these metrics based on actual tower defense implementation
  // For the developer working on tower defense:
  //   1. Update the metrics below to match what you actually track
  //   2. When game ends, call saveGameSession() with your metadata
  //   3. The dashboard will automatically display your metrics
  TOWER_DEFENSE: {
    name: 'Tower Defense Quiz',
    description: 'Answer questions to build towers and defend against waves of enemies',
    metrics: [
      // EXAMPLE METRICS - Replace with your actual tracked metrics
      {
        key: 'wavesCompleted',         // e.g., metadata.wavesCompleted = 15
        label: 'Waves Completed',
        type: 'number'
      },
      {
        key: 'towersBuilt',            // e.g., metadata.towersBuilt = 8
        label: 'Towers Built',
        type: 'number'
      },
      {
        key: 'enemiesDefeated',        // e.g., metadata.enemiesDefeated = 250
        label: 'Enemies Defeated',
        type: 'number'
      }
      // Add more metrics as needed for your game!
    ]
  },

  // =============================================================================
  // TRADITIONAL QUIZ
  // =============================================================================
  // Standard multiple-choice quiz with time tracking
  TRADITIONAL: {
    name: 'Traditional Quiz',
    description: 'Standard quiz format with multiple choice questions',
    metrics: [
      {
        key: 'accuracy',               // Calculated as correctAnswers / totalQuestions
        label: 'Accuracy',
        type: 'number',
        format: (value: number) => `${Math.round(value * 100)}%`  // Formats 0.85 as "85%"
      },
      {
        key: 'averageTimePerQuestion',
        label: 'Avg Time/Question',
        type: 'number',
        format: (value: number) => `${Math.round(value)}s`  // Formats 12.5 as "13s"
      }
    ]
  }
};

/**
 * Get configuration for a specific game type
 */
export function getGameTypeConfig(gameMode: GameMode): GameTypeConfig {
  return GAME_TYPES[gameMode];
}

/**
 * Get all available game types
 */
export function getAllGameTypes(): GameTypeConfig[] {
  return Object.values(GAME_TYPES);
}
