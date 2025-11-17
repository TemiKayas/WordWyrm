import { PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { STAGE_CONFIG } from './GameConfig';

/**
 * Stage 1 Configuration (Rounds 1-20)
 * Original grass map with step-pattern path
 */
export class Stage1Config {
  /**
   * Get the path points for Stage 1
   * Returns an array of paths (Stage 1 has only one path)
   * Original step-like path: right -> up -> right -> down -> right
   */
  static getPathPoints(gameWidth: number, height: number): PathPoint[][] {
    const pathY1 = height * 0.65;
    const pathY2 = height * 0.25;
    const pathY3 = height * 0.72;

    const singlePath: PathPoint[] = [
      { x: 0, y: pathY1 },
      { x: gameWidth * 0.285, y: pathY1 },
      { x: gameWidth * 0.285, y: pathY2 },
      { x: gameWidth * 0.73, y: pathY2 },
      { x: gameWidth * 0.73, y: pathY3 },
      { x: 1825, y: pathY3 } // Extend to match background path end
    ];

    return [singlePath]; // Return array with single path
  }

  /**
   * Get the path color for Stage 1
   */
  static getPathColor(): number {
    return 0x5d4037; // Dark brown path (good contrast with green bg)
  }

  /**
   * Get the path width for Stage 1
   */
  static getPathWidth(): number {
    return STAGE_CONFIG.PATH_WIDTH;
  }
}
