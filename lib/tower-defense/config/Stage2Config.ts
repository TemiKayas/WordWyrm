import { PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { STAGE_CONFIG } from './GameConfig';

/**
 * Stage 2 Configuration (Rounds 21-40)
 * Damaged/destroyed map with wavy serpentine path
 * Inspired by stage2.png - smooth horizontal waves
 */
export class Stage2Config {
  /**
   * Get the path points for Stage 2
   * Returns TWO paths that form a helix pattern
   * Paths: start separate -> converge -> circle (helix) -> converge -> separate
   */
  static getPathPoints(gameWidth: number, height: number): PathPoint[][] {
    const centerY = height * 0.5;
    const separation = height * 0.15; // Vertical separation when paths split
    const circleRadius = height * 0.12; // Radius of the helix circle

    // PATH 1 (starts top, goes through top of circle)
    const path1: PathPoint[] = [
      // Start top-left
      { x: 0, y: centerY - separation },

      // Converge toward center
      { x: gameWidth * 0.15, y: centerY - separation * 0.7 },
      { x: gameWidth * 0.25, y: centerY - separation * 0.3 },
      { x: gameWidth * 0.3, y: centerY }, // Meet at center

      // Circle top half (clockwise)
      { x: gameWidth * 0.35, y: centerY - circleRadius * 0.7 },
      { x: gameWidth * 0.4, y: centerY - circleRadius },
      { x: gameWidth * 0.45, y: centerY - circleRadius * 0.7 },
      { x: gameWidth * 0.5, y: centerY }, // Cross center
      { x: gameWidth * 0.55, y: centerY + circleRadius * 0.7 },
      { x: gameWidth * 0.6, y: centerY + circleRadius },
      { x: gameWidth * 0.65, y: centerY + circleRadius * 0.7 },
      { x: gameWidth * 0.7, y: centerY }, // Exit circle at center

      // Diverge toward top exit
      { x: gameWidth * 0.75, y: centerY - separation * 0.3 },
      { x: gameWidth * 0.85, y: centerY - separation * 0.7 },
      { x: gameWidth - STAGE_CONFIG.PATH_END_OFFSET, y: centerY - separation }
    ];

    // PATH 2 (starts bottom, goes through bottom of circle - mirrored)
    const path2: PathPoint[] = [
      // Start bottom-left
      { x: 0, y: centerY + separation },

      // Converge toward center
      { x: gameWidth * 0.15, y: centerY + separation * 0.7 },
      { x: gameWidth * 0.25, y: centerY + separation * 0.3 },
      { x: gameWidth * 0.3, y: centerY }, // Meet at center

      // Circle bottom half (clockwise - mirrored)
      { x: gameWidth * 0.35, y: centerY + circleRadius * 0.7 },
      { x: gameWidth * 0.4, y: centerY + circleRadius },
      { x: gameWidth * 0.45, y: centerY + circleRadius * 0.7 },
      { x: gameWidth * 0.5, y: centerY }, // Cross center
      { x: gameWidth * 0.55, y: centerY - circleRadius * 0.7 },
      { x: gameWidth * 0.6, y: centerY - circleRadius },
      { x: gameWidth * 0.65, y: centerY - circleRadius * 0.7 },
      { x: gameWidth * 0.7, y: centerY }, // Exit circle at center

      // Diverge toward bottom exit
      { x: gameWidth * 0.75, y: centerY + separation * 0.3 },
      { x: gameWidth * 0.85, y: centerY + separation * 0.7 },
      { x: gameWidth - STAGE_CONFIG.PATH_END_OFFSET, y: centerY + separation }
    ];

    return [path1, path2]; // Return both paths
  }

  /**
   * Get the path color for Stage 2
   */
  static getPathColor(): number {
    return 0x3e2723; // Very dark brown (good contrast with damaged bg)
  }

  /**
   * Get the path width for Stage 2
   */
  static getPathWidth(): number {
    return STAGE_CONFIG.PATH_WIDTH;
  }
}
