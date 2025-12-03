import * as Phaser from 'phaser';
import { Tower, PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { TOWER_SPRITE_SCALES } from '@/lib/tower-defense/config/GameConfig';

/**
 * TowerManager
 *
 * Responsibilities:
 * - Define and provide tower statistics
 * - Validate tower placement (path and tower proximity checks)
 * - Create tower visuals (sprites/containers)
 * - Calculate tower buffs (Training Camp, boss buffs)
 *
 * Does NOT handle:
 * - Tower purchase/quiz gates (scene handles this)
 * - Tower upgrades UI (scene handles this)
 * - Gold management (scene handles this)
 */

export interface TowerStats {
  range: number;
  fireRate: number;
  damage: number;
  cost: number;
  size: number;  // Collision hitbox size
  spriteScale: number;  // Visual sprite scale
  color: number;
}

export interface BuffCalculation {
  damageMultiplier: number;
  fireRateMultiplier: number;
}

export class TowerManager {
  private scene: Phaser.Scene;
  private towers: Tower[] = [];
  private path: PathPoint[]; // Single path

  // Tower base stats configuration
  private static readonly TOWER_STATS: Record<'basic' | 'sniper' | 'melee' | 'fact' | 'wizard', TowerStats> = {
    basic: {
      range: 150,
      fireRate: 500,
      damage: 12.5,
      cost: 50,
      size: 1.0,
      spriteScale: TOWER_SPRITE_SCALES.ballista,
      color: 0x3498db
    },
    sniper: {
      range: 300,
      fireRate: 2000,
      damage: 50,
      cost: 75,
      size: 1.2,
      spriteScale: TOWER_SPRITE_SCALES.trebuchet,
      color: 0xff9800
    },
    melee: {
      range: 100,
      fireRate: 250,
      damage: 5,
      cost: 25,
      size: 0.85,
      spriteScale: TOWER_SPRITE_SCALES.knight,
      color: 0xf44336
    },
    fact: {
      range: 200,  // Buff radius, not attack range
      fireRate: 0,  // Doesn't attack
      damage: 0,  // Doesn't deal damage
      cost: 40,
      size: 1.0,
      spriteScale: TOWER_SPRITE_SCALES.trainingCamp,
      color: 0x3498db
    },
    wizard: {
      range: 170,
      fireRate: 1000,
      damage: 30,
      cost: 100,
      size: 1.0,
      spriteScale: TOWER_SPRITE_SCALES.archmage,
      color: 0x9c27b0
    }
  };

  constructor(scene: Phaser.Scene, path: PathPoint[]) {
    this.scene = scene;
    this.path = path;
  }

  /**
   * Get base stats for a tower type
   */
  getTowerStats(type: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard'): TowerStats {
    return { ...TowerManager.TOWER_STATS[type] };
  }

  /**
   * Check if position is too close to path (40px clearance)
   */
  isTooCloseToPath(x: number, y: number): boolean {
    // Check distance to path
    return this.path.some((point, i) => {
      if (i === 0) return false;
      const prev = this.path[i - 1];
      const distToSegment = this.pointToSegmentDistance(x, y, prev.x, prev.y, point.x, point.y);
      return distToSegment < 40;
    });
  }

  /**
   * Check if position is too close to existing towers
   */
  isTooCloseToTowers(x: number, y: number, newTowerSize: number): boolean {
    const BASE_RADIUS = 20;
    const newTowerRadiusWithBuffer = BASE_RADIUS * newTowerSize * 1.1;

    return this.towers.some(tower => {
      const existingTowerRadiusWithBuffer = BASE_RADIUS * tower.size * 1.1;
      const minDistance = newTowerRadiusWithBuffer + existingTowerRadiusWithBuffer;

      const dx = tower.x - x;
      const dy = tower.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      return distance < minDistance;
    });
  }

  /**
   * Create tower graphics based on type
   */
  createTowerGraphics(
    x: number,
    y: number,
    type: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard',
    stats: TowerStats
  ): Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Container {
    if (type === 'fact') {
      // Training Camp uses rectangle style (no sprite asset)
      const rect = this.scene.add.rectangle(x, y, 40, 40, stats.color);
      rect.setScale(stats.spriteScale);
      rect.setStrokeStyle(0);
      rect.setInteractive({ useHandCursor: true });
      return rect;
    } else if (type === 'melee' || type === 'wizard') {
      // Layered towers (Knight and Archmage) - use back and front sprites
      const container = this.scene.add.container(x, y);

      const backKey = type === 'melee' ? 'tower_melee_back' : 'tower_wizard_back';
      const frontKey = type === 'melee' ? 'tower_melee_front' : 'tower_wizard_front';

      const backSprite = this.scene.add.image(0, 0, backKey);
      const frontSprite = this.scene.add.image(0, 0, frontKey);

      backSprite.setScale(stats.spriteScale);
      frontSprite.setScale(stats.spriteScale);

      container.add([backSprite, frontSprite]);
      container.setSize(40, 40);
      container.setInteractive(new Phaser.Geom.Circle(0, 0, 20), Phaser.Geom.Circle.Contains);
      (container.input! as { cursor?: string }).cursor = 'pointer';

      return container;
    } else {
      // Standard towers (Ballista, Trebuchet) - single sprite
      const spriteKey = type === 'basic' ? 'tower_ballista' : 'tower_catapult';
      const sprite = this.scene.add.image(x, y, spriteKey);
      sprite.setScale(stats.spriteScale);
      sprite.setInteractive({ useHandCursor: true });
      return sprite;
    }
  }

  /**
   * Add a tower to the manager's list
   */
  addTower(tower: Tower): void {
    this.towers.push(tower);
  }

  /**
   * Calculate Training Camp buffs for a specific tower
   * Returns damage and fire rate multipliers
   */
  calculateTrainingCampBuffs(tower: Tower): BuffCalculation {
    let damageMultiplier = 1.0;
    let fireRateMultiplier = 1.0;

    this.towers.forEach(factTower => {
      if (factTower.type !== 'fact') return;

      const dx = tower.x - factTower.x;
      const dy = tower.y - factTower.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const buffRadius = factTower.buffRadius || 200;

      if (distance < buffRadius) {
        if (factTower.boosted) {
          // Boosted: 15% damage and speed
          damageMultiplier = Math.max(damageMultiplier, 1.15);
          fireRateMultiplier = Math.max(fireRateMultiplier, 0.85); // Lower = faster
        } else {
          // Normal: 5% damage and speed
          damageMultiplier = Math.max(damageMultiplier, 1.05);
          fireRateMultiplier = Math.max(fireRateMultiplier, 0.95); // Lower = faster
        }
      }
    });

    return { damageMultiplier, fireRateMultiplier };
  }

  /**
   * Get all towers (read-only access)
   */
  getTowers(): readonly Tower[] {
    return this.towers;
  }

  /**
   * Helper: Calculate distance from point to line segment
   */
  private pointToSegmentDistance(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = ((px - x1) * dx + (py - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const nearestX = x1 + t * dx;
    const nearestY = y1 + t * dy;
    const distX = px - nearestX;
    const distY = py - nearestY;
    return Math.sqrt(distX * distX + distY * distY);
  }

  /**
   * Remove a specific tower (used during stage transitions)
   */
  removeTower(tower: Tower): void {
    const index = this.towers.indexOf(tower);
    if (index > -1) {
      this.towers.splice(index, 1);
      tower.graphics.destroy();
      tower.rangeCircle?.destroy();
      tower.spellGlow?.destroy();
    }
  }

  /**
   * Clean up all towers (called when scene ends)
   */
  destroy(): void {
    this.towers.forEach(tower => {
      tower.graphics.destroy();
      tower.rangeCircle?.destroy();
      tower.spellGlow?.destroy();
    });
    this.towers = [];
  }
}
