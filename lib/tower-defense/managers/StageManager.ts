import * as Phaser from 'phaser';
import { PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { Stage1Config } from '../config/Stage1Config';
import { Stage2Config } from '../config/Stage2Config';
import { Stage3Config } from '../config/Stage3Config';

/**
 * StageManager handles map transitions between stages
 * Stage 1: Rounds 1-20 (grass map)
 * Stage 2: Rounds 21-40 (damaged/destroyed map)
 * Stage 3: Rounds 41+ (burned warzone map)
 */
export class StageManager {
  private scene: Phaser.Scene;
  private currentStage: number = 1;
  private pathGraphics?: Phaser.GameObjects.Graphics;
  private backgroundImage?: Phaser.GameObjects.Image;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Get the current stage number based on wave
   */
  getCurrentStage(waveNumber: number): number {
    if (waveNumber <= 20) return 1;
    if (waveNumber <= 40) return 2;
    return 3;
  }

  /**
   * Check if a stage transition should occur after this wave
   */
  shouldTransition(waveNumber: number): boolean {
    return waveNumber === 20 || waveNumber === 40 || waveNumber === 60;
  }

  /**
   * Get the path points for a specific stage (returns array of paths)
   */
  getPathPoints(stage: number, gameWidth: number, height: number): PathPoint[][] {
    switch (stage) {
      case 1:
        return Stage1Config.getPathPoints(gameWidth, height);
      case 2:
        return Stage2Config.getPathPoints(gameWidth, height);
      case 3:
        return Stage3Config.getPathPoints(gameWidth, height);
      default:
        return Stage1Config.getPathPoints(gameWidth, height);
    }
  }

  /**
   * Get the path color for a specific stage
   */
  getPathColor(stage: number): number {
    switch (stage) {
      case 1:
        return Stage1Config.getPathColor();
      case 2:
        return Stage2Config.getPathColor();
      case 3:
        return Stage3Config.getPathColor();
      default:
        return Stage1Config.getPathColor();
    }
  }

  /**
   * Get the background key for a specific stage
   */
  getBackgroundKey(stage: number): string {
    switch (stage) {
      case 1:
        return 'stage1_bg';
      case 2:
        return 'stage2_bg';
      case 3:
        return 'stage3_bg';
      default:
        return 'stage1_bg';
    }
  }

  /**
   * Draw all paths for a stage (returns array of graphics, one per path)
   */
  drawPaths(allPaths: PathPoint[][], stage: number, alpha: number = 1): Phaser.GameObjects.Graphics[] {
    const pathColor = this.getPathColor(stage);
    const graphicsArray: Phaser.GameObjects.Graphics[] = [];

    // Draw each path
    for (const pathPoints of allPaths) {
      const graphics = this.scene.add.graphics();
      graphics.lineStyle(70, pathColor, alpha);
      graphics.beginPath();
      graphics.moveTo(pathPoints[0].x, pathPoints[0].y);
      for (let i = 1; i < pathPoints.length; i++) {
        graphics.lineTo(pathPoints[i].x, pathPoints[i].y);
      }
      graphics.strokePath();
      graphicsArray.push(graphics);
    }

    return graphicsArray;
  }

  /**
   * Perform the stage transition cutscene
   * Returns a promise that resolves when transition is complete
   */
  async transitionToStage(
    newStage: number,
    gameWidth: number,
    height: number,
    oldPathGraphicsArray: Phaser.GameObjects.Graphics[],
    oldBackground?: Phaser.GameObjects.Image
  ): Promise<{pathPoints: PathPoint[][], pathGraphics: Phaser.GameObjects.Graphics[], background: Phaser.GameObjects.Image}> {
    const FADE_DURATION = 1500; // 1.5 seconds for fade out, 1.5 for fade in = 3 total

    return new Promise((resolve) => {
      // Get new stage data
      const newPathPoints = this.getPathPoints(newStage, gameWidth, height);
      const newBgKey = this.getBackgroundKey(newStage);

      // Phase 1: Fade out old paths only (background stays visible)
      for (const oldPathGraphics of oldPathGraphicsArray) {
        this.scene.tweens.add({
          targets: oldPathGraphics,
          alpha: 0,
          duration: FADE_DURATION,
          ease: 'Power2'
        });
      }

      // Keep background visible - no fade out for GrassMap

      // Wait for fade out to complete, then fade in new stage
      this.scene.time.delayedCall(FADE_DURATION, () => {
        // Destroy all old graphics
        for (const oldPathGraphics of oldPathGraphicsArray) {
          oldPathGraphics.destroy();
        }
        // Keep existing background (GrassMap) - don't destroy or replace it
        // The background remains persistent across all stages

        // Create new paths (full alpha, will use object alpha for fading)
        const newPathGraphicsArray = this.drawPaths(newPathPoints, newStage, 1);
        for (const graphics of newPathGraphicsArray) {
          graphics.setDepth(-1);
          graphics.setAlpha(0); // Start invisible
        }

        // Phase 2: Fade in new paths only (background stays the same)
        // No background fade needed - GrassMap persists

        this.scene.tweens.add({
          targets: newPathGraphicsArray,
          alpha: 1,
          duration: FADE_DURATION,
          ease: 'Power2',
          onComplete: () => {
            // Transition complete
            this.currentStage = newStage;
            resolve({
              pathPoints: newPathPoints,
              pathGraphics: newPathGraphicsArray,
              background: oldBackground! // Keep the same GrassMap background
            });
          }
        });
      });
    });
  }

  /**
   * Get the current stage number
   */
  getStage(): number {
    return this.currentStage;
  }

  /**
   * Set the current stage (for initialization)
   */
  setStage(stage: number): void {
    this.currentStage = stage;
  }
}
