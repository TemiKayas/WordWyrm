import Phaser from 'phaser';
import { Enemy, Tower, DotEffect, EnemyType } from '@/lib/tower-defense/types/GameTypes';
import { TEXT_STYLES } from '@/lib/tower-defense/config/GameConfig';

/**
 * CombatManager
 *
 * Responsibilities:
 * - Apply damage to enemies with armor calculations
 * - Manage damage-over-time (DoT) effects
 * - Find and prioritize targets for towers
 * - Display damage numbers
 *
 * Does NOT handle:
 * - Gold rewards (scene handles this)
 * - Lives/health deduction (scene handles this)
 * - Enemy removal (scene handles this)
 * - Tower shooting logic (scene handles this)
 */
export class CombatManager {
  private scene: Phaser.Scene;
  private dotEffects: DotEffect[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Apply damage to an enemy with armor calculations
   * Returns actual damage dealt after reductions
   */
  applyDamage(enemy: Enemy, damage: number, isDoT: boolean = false): number {
    let finalDamage = damage;

    // Apply armor damage reduction (except for DoT - DoT bypasses armor)
    if (enemy.type === EnemyType.ARMORED && !isDoT) {
      finalDamage = damage * 0.65; // 35% damage reduction
    }

    enemy.health -= finalDamage;
    return finalDamage; // Return actual damage dealt
  }

  /**
   * Add a DoT effect to an enemy (from Ballista upgrade)
   * If enemy already has DoT, reset the duration
   */
  addDoTEffect(enemy: Enemy, damagePerTick: number, ticks: number, currentTime: number): void {
    const existingDot = this.dotEffects.find(dot => dot.enemy === enemy);

    if (existingDot) {
      // Reset ticks if enemy already has DoT
      existingDot.ticksRemaining = ticks;
      existingDot.lastTick = currentTime;
    } else {
      // Add new DoT effect
      this.dotEffects.push({
        enemy: enemy,
        damagePerTick: damagePerTick,
        ticksRemaining: ticks,
        lastTick: currentTime
      });
    }
  }

  /**
   * Update all DoT effects - apply damage ticks
   * Returns array of enemies that died from DoT this frame
   */
  updateDoTEffects(currentTime: number, gameSpeed: number, enemies: readonly Enemy[]): Enemy[] {
    const deadEnemies: Enemy[] = [];

    for (let i = this.dotEffects.length - 1; i >= 0; i--) {
      const dot = this.dotEffects[i];

      // Remove if enemy is dead or no longer exists
      if (dot.enemy.health <= 0 || !enemies.includes(dot.enemy)) {
        this.dotEffects.splice(i, 1);
        continue;
      }

      // Tick every 500ms (adjusted for game speed)
      const dotTickRate = 500 / gameSpeed;
      if (currentTime - dot.lastTick > dotTickRate) {
        // DoT bypasses armor
        const damageDealt = this.applyDamage(dot.enemy, dot.damagePerTick, true);
        dot.ticksRemaining--;
        dot.lastTick = currentTime;

        // Show damage number
        this.showDamageNumber(dot.enemy.x, dot.enemy.y, damageDealt, '#ff6600');

        // Track if enemy died from DoT
        if (dot.enemy.health <= 0) {
          deadEnemies.push(dot.enemy);
        }

        // Remove if out of ticks
        if (dot.ticksRemaining <= 0) {
          this.dotEffects.splice(i, 1);
        }
      }
    }

    return deadEnemies;
  }

  /**
   * Find closest enemy to a tower, prioritizing HEALER and COMMANDER
   */
  findClosestEnemy(tower: Tower, enemies: readonly Enemy[]): Enemy | null {
    let closestPriority: Enemy | null = null;
    let minPriorityDist = tower.range;
    let closest: Enemy | null = null;
    let minDist = tower.range;

    enemies.forEach(enemy => {
      if (enemy.health <= 0) return;

      const dx = enemy.x - tower.x;
      const dy = enemy.y - tower.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Check for priority targets (HEALER/COMMANDER)
      if (enemy.isPriorityTarget && dist < minPriorityDist) {
        minPriorityDist = dist;
        closestPriority = enemy;
      }

      // Track closest regular enemy as fallback
      if (dist < minDist) {
        minDist = dist;
        closest = enemy;
      }
    });

    // Return priority target if found, otherwise closest regular enemy
    return closestPriority || closest;
  }

  /**
   * Show floating damage number at enemy position
   */
  private showDamageNumber(x: number, y: number, damage: number, color: string = '#ffffff'): void {
    const damageText = this.scene.add.text(x, y - 20, `-${Math.round(damage)}`, {
      ...TEXT_STYLES.DAMAGE_NUMBER,
      color: color
    }).setOrigin(0.5);

    this.scene.tweens.add({
      targets: damageText,
      y: y - 40,
      alpha: 0,
      duration: 500,
      onComplete: () => damageText.destroy()
    });
  }

  /**
   * Clean up all DoT effects (called when scene ends)
   */
  destroy(): void {
    this.dotEffects = [];
  }
}
