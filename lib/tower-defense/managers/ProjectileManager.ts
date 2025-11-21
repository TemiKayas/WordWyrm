import * as Phaser from 'phaser';
import { Projectile, Tower, Enemy } from '@/lib/tower-defense/types/GameTypes';
import { PROJECTILE_SPRITE_SCALES, PROJECTILE_ROTATION_OFFSETS } from '@/lib/tower-defense/config/GameConfig';

/**
 * ProjectileManager
 *
 * Responsibilities:
 * - Store and manage all projectiles
 * - Create new projectiles when towers shoot
 * - Move projectiles towards their targets
 * - Detect when projectiles hit targets
 * - Clean up destroyed projectiles
 *
 * Does NOT handle:
 * - Damage application (scene handles this)
 * - Explosions/effects (scene handles this)
 * - DoT effects (scene handles this)
 */
export class ProjectileManager {
  private scene: Phaser.Scene;
  private projectiles: Projectile[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Create and launch a new projectile from tower to enemy
   */
  shootProjectile(tower: Tower, target: Enemy, damage: number): void {
    // Determine projectile sprite, scale, and rotation offset based on tower type
    let projKey: string;
    let projScale: number;
    let rotationOffset: number;

    if (tower.type === 'sniper') {
      projKey = 'proj_catapult';
      projScale = PROJECTILE_SPRITE_SCALES.catapult;
      rotationOffset = PROJECTILE_ROTATION_OFFSETS.catapult;
    } else if (tower.type === 'wizard') {
      projKey = 'proj_wizard';
      projScale = PROJECTILE_SPRITE_SCALES.wizard;
      rotationOffset = PROJECTILE_ROTATION_OFFSETS.wizard;
    } else {
      // Default: ballista (for 'basic' and any other type)
      projKey = 'proj_ballista';
      projScale = PROJECTILE_SPRITE_SCALES.ballista;
      rotationOffset = PROJECTILE_ROTATION_OFFSETS.ballista;
    }

    const projGraphics = this.scene.add.image(tower.x, tower.y, projKey);

    // Catapult projectiles start smaller (50% of base scale) to emphasize arc
    const initialScale = tower.type === 'sniper' ? projScale * 0.5 : projScale;
    projGraphics.setScale(initialScale);
    projGraphics.setDepth(2); // Render above towers (1) and enemies (1), below health bars (2-3)

    // Calculate angle to target for projectile rotation
    const dx = target.x - tower.x;
    const dy = target.y - tower.y;
    const angle = Math.atan2(dy, dx);

    // Apply rotation with offset to correct sprite orientation
    // Offset accounts for sprite's default orientation in the source image
    projGraphics.setRotation(angle + rotationOffset);

    // Add spin animation for catapult projectiles (scale handled in updateProjectiles)
    if (tower.type === 'sniper') {
      // Rotation animation: continuous spin for tumbling rock effect
      this.scene.tweens.add({
        targets: projGraphics,
        rotation: projGraphics.rotation + Math.PI * 4, // 2 full rotations
        duration: 800, // 800ms for 2 rotations
        repeat: -1, // Loop forever
        ease: 'Linear'
      });
    }

    const proj: Projectile = {
      x: tower.x,
      y: tower.y,
      target: target,
      graphics: projGraphics,
      sourceTower: tower,
      damage: damage,
      startX: tower.x, // Store starting position for distance-based scaling
      startY: tower.y,
      baseScale: projScale // Store base scale for arc animation
    };

    this.projectiles.push(proj);
  }

  /**
   * Update all projectiles - move them and detect hits
   * Returns array of projectiles that hit their targets this frame
   */
  updateProjectiles(scaledDelta: number): Projectile[] {
    const hits: Projectile[] = [];

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];

      // Remove if target is dead
      if (!proj.target || proj.target.health <= 0) {
        proj.graphics.destroy();
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = proj.target.x - proj.x;
      const dy = proj.target.y - proj.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check for hit (within 10 pixels)
      if (dist < 10) {
        hits.push(proj);
        proj.graphics.destroy();
        this.projectiles.splice(i, 1);
      } else {
        // Move towards target
        // Catapult projectiles are slower (heavy rock), others are faster
        const speed = proj.sourceTower.type === 'sniper' ? 200 : 400; // pixels per second
        proj.x += (dx / dist) * speed * scaledDelta / 1000;
        proj.y += (dy / dist) * speed * scaledDelta / 1000;
        proj.graphics.setPosition(proj.x, proj.y);

        // Update catapult projectile scale based on distance traveled (arc effect)
        if (proj.sourceTower.type === 'sniper' && proj.startX !== undefined && proj.startY !== undefined && proj.baseScale !== undefined) {
          // Calculate total distance from start to target
          const totalDx = proj.target.x - proj.startX;
          const totalDy = proj.target.y - proj.startY;
          const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

          // Calculate distance traveled from start
          const traveledDx = proj.x - proj.startX;
          const traveledDy = proj.y - proj.startY;
          const traveledDist = Math.sqrt(traveledDx * traveledDx + traveledDy * traveledDy);

          // Calculate progress (0 to 1)
          const progress = Math.min(traveledDist / totalDist, 1);

          // Scale based on progress: grow from 50% to 125% in first half, shrink from 125% to 50% in second half
          let scale;
          if (progress < 0.5) {
            // First half: lerp from 50% to 125%
            const halfProgress = progress * 2; // 0 to 1
            scale = proj.baseScale * (0.5 + halfProgress * 0.75); // 0.5 + (0 to 0.75) = 0.5 to 1.25
          } else {
            // Second half: lerp from 125% to 50%
            const halfProgress = (progress - 0.5) * 2; // 0 to 1
            scale = proj.baseScale * (1.25 - halfProgress * 0.75); // 1.25 - (0 to 0.75) = 1.25 to 0.5
          }

          proj.graphics.setScale(scale);
        }
      }
    }

    return hits;
  }

  /**
   * Clean up all projectiles (called when scene ends)
   */
  destroy(): void {
    this.projectiles.forEach(proj => proj.graphics.destroy());
    this.projectiles = [];
  }
}
