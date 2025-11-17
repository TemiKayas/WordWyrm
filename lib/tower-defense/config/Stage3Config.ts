import { PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { STAGE_CONFIG } from './GameConfig';

/**
 * Stage 3 Configuration (Rounds 41+)
 * Burned warzone map with complex looping path
 * Inspired by stage3.png - dramatic curves with center loop
 */
export class Stage3Config {
  /**
   * Get the path points for Stage 3
   * Returns an array of paths (Stage 3 has only one path with a loop)
   * Complex path with a circular loop in the middle
   */
  static getPathPoints(gameWidth: number, height: number): PathPoint[][] {
    const topY = height * 0.2;
    const midY = height * 0.5;
    const bottomY = height * 0.75;
    const loopCenterX = gameWidth * 0.5;
    const loopCenterY = height * 0.45;
    const loopRadius = height * 0.15;

    const singlePath: PathPoint[] = [
      // Start from left bottom
      { x: 0, y: bottomY },

      // Curve up to top
      { x: gameWidth * 0.15, y: bottomY - height * 0.15 },
      { x: gameWidth * 0.25, y: topY },
      { x: gameWidth * 0.35, y: topY + height * 0.05 },

      // Approach the loop from top-left
      { x: loopCenterX - loopRadius * 0.7, y: loopCenterY - loopRadius },

      // Create circular loop (8 points for smooth circle)
      { x: loopCenterX - loopRadius, y: loopCenterY - loopRadius * 0.5 },
      { x: loopCenterX - loopRadius, y: loopCenterY },
      { x: loopCenterX - loopRadius, y: loopCenterY + loopRadius * 0.5 },
      { x: loopCenterX - loopRadius * 0.5, y: loopCenterY + loopRadius },
      { x: loopCenterX, y: loopCenterY + loopRadius },
      { x: loopCenterX + loopRadius * 0.5, y: loopCenterY + loopRadius },
      { x: loopCenterX + loopRadius, y: loopCenterY + loopRadius * 0.5 },
      { x: loopCenterX + loopRadius, y: loopCenterY },
      { x: loopCenterX + loopRadius, y: loopCenterY - loopRadius * 0.5 },
      { x: loopCenterX + loopRadius * 0.5, y: loopCenterY - loopRadius },

      // Exit loop and curve down
      { x: loopCenterX + loopRadius * 0.3, y: loopCenterY - loopRadius },
      { x: gameWidth * 0.65, y: midY },
      { x: gameWidth * 0.75, y: bottomY - height * 0.1 },
      { x: gameWidth * 0.85, y: bottomY },

      // Final stretch to end
      { x: gameWidth - STAGE_CONFIG.PATH_END_OFFSET, y: bottomY + height * 0.05 }
    ];

    return [singlePath]; // Return array with single path
  }

  /**
   * Get the path color for Stage 3
   */
  static getPathColor(): number {
    return 0x757575; // Gray ash path (good contrast with dark burned bg)
  }

  /**
   * Get the path width for Stage 3
   */
  static getPathWidth(): number {
    return STAGE_CONFIG.PATH_WIDTH;
  }
}
