import { Enemy, Tower, EnemyType } from '@/lib/tower-defense/types/GameTypes';

/**
 * AbilityManager
 *
 * Responsibilities:
 * - Track ability cooldowns
 * - Check ability availability
 * - Apply ability effects (damage, freeze, boost)
 * - Manage Question ability unlock status
 *
 * Does NOT handle:
 * - Visual effects (scene handles this)
 * - Gold deduction (scene handles this)
 * - UI updates (scene handles this)
 */

export interface AbilityStatus {
  available: boolean;
  cooldownRemaining: number;
  goldCost: number;
}

export class AbilityManager {
  // Cooldowns (in milliseconds)
  private lightningStrikeCooldown: number = 0;
  private freezeCooldown: number = 0;
  private questionAbilityCooldown: number = 0;

  // Question ability state
  private questionAbilityUnlocked: boolean = false;

  // Ability costs and cooldown durations
  private static readonly LIGHTNING_COST = 40;
  private static readonly LIGHTNING_COOLDOWN = 45000; // 45 seconds
  private static readonly FREEZE_COST = 60;
  private static readonly FREEZE_COOLDOWN = 60000; // 60 seconds
  private static readonly QUESTION_COST = 0; // Free
  private static readonly QUESTION_COOLDOWN = 90000; // 90 seconds

  /**
   * Update cooldowns (called each frame)
   */
  updateCooldowns(delta: number, cooldownMultiplier: number = 1.0, pauseQuestionCooldown: boolean = false): void {
    if (this.lightningStrikeCooldown > 0) {
      this.lightningStrikeCooldown = Math.max(0, this.lightningStrikeCooldown - (delta * cooldownMultiplier));
    }
    if (this.freezeCooldown > 0) {
      this.freezeCooldown = Math.max(0, this.freezeCooldown - (delta * cooldownMultiplier));
    }
    if (!pauseQuestionCooldown && this.questionAbilityCooldown > 0) {
      this.questionAbilityCooldown = Math.max(0, this.questionAbilityCooldown - (delta * cooldownMultiplier));
    }
  }

  /**
   * Check if Lightning Strike is available
   */
  getLightningStrikeStatus(gold: number): AbilityStatus {
    return {
      available: this.lightningStrikeCooldown <= 0 && gold >= AbilityManager.LIGHTNING_COST,
      cooldownRemaining: this.lightningStrikeCooldown,
      goldCost: AbilityManager.LIGHTNING_COST
    };
  }

  /**
   * Check if Freeze is available
   */
  getFreezeStatus(gold: number): AbilityStatus {
    return {
      available: this.freezeCooldown <= 0 && gold >= AbilityManager.FREEZE_COST,
      cooldownRemaining: this.freezeCooldown,
      goldCost: AbilityManager.FREEZE_COST
    };
  }

  /**
   * Check if Question ability is available
   */
  getQuestionAbilityStatus(): AbilityStatus {
    return {
      available: this.questionAbilityUnlocked && this.questionAbilityCooldown <= 0,
      cooldownRemaining: this.questionAbilityCooldown,
      goldCost: AbilityManager.QUESTION_COST
    };
  }

  /**
   * Use Lightning Strike (start cooldown)
   */
  useLightningStrike(): void {
    this.lightningStrikeCooldown = AbilityManager.LIGHTNING_COOLDOWN;
  }

  /**
   * Apply freeze effect to all enemies
   * Returns the set of frozen enemies for scene to track
   */
  applyFreeze(enemies: readonly Enemy[]): Set<Enemy> {
    const frozenEnemies = new Set<Enemy>();

    enemies.forEach(enemy => {
      // Mark as frozen to prevent commander aura from resetting speed
      enemy.frozen = true;

      if (enemy.type === EnemyType.BOSS) {
        // Bosses are slowed by 50% for 5 seconds
        enemy.speed *= 0.5;
        frozenEnemies.add(enemy);
      } else {
        // Regular enemies are frozen (speed = 0)
        enemy.speed = 0;
        frozenEnemies.add(enemy);
      }
    });

    // Start cooldown
    this.freezeCooldown = AbilityManager.FREEZE_COOLDOWN;

    return frozenEnemies;
  }

  /**
   * Restore speed after freeze expires
   */
  restoreEnemySpeeds(frozenEnemies: Set<Enemy>, enemies: readonly Enemy[]): void {
    frozenEnemies.forEach(enemy => {
      if (!enemies.includes(enemy)) return; // Enemy already dead

      // Clear frozen flag so commander aura can affect this enemy again
      enemy.frozen = false;

      if (enemy.type === EnemyType.BOSS) {
        // Restore boss speed
        enemy.speed *= 2; // Undo the 50% slow
      } else {
        // Restore regular enemy speed to base speed
        enemy.speed = enemy.baseSpeed;
      }
    });
  }

  /**
   * Use Question ability (start cooldown)
   */
  useQuestionAbility(): void {
    this.questionAbilityCooldown = AbilityManager.QUESTION_COOLDOWN;
  }

  /**
   * Reset Question ability cooldown (for refunds)
   */
  resetQuestionAbilityCooldown(): void {
    this.questionAbilityCooldown = 0;
  }

  /**
   * Boost a Training Camp tower
   */
  boostTrainingCamp(tower: Tower): void {
    if (tower.type !== 'fact') return;

    // Apply boost
    tower.boosted = true;
    tower.boostedUntil = Date.now() + 120000; // 2 minutes in ms
    if (tower.baseBuffRadius) {
      tower.buffRadius = tower.baseBuffRadius * 1.1; // +10% radius
    }

    // Start cooldown
    this.useQuestionAbility();
  }

  /**
   * Check if Training Camp boost has expired (called in update loop)
   */
  updateTrainingCampBoosts(towers: readonly Tower[]): void {
    const now = Date.now();
    towers.forEach(tower => {
      if (tower.type === 'fact' && tower.boosted && tower.boostedUntil && now >= tower.boostedUntil) {
        // Boost expired
        tower.boosted = false;
        if (tower.buffRadius && tower.baseBuffRadius) {
          tower.buffRadius = tower.baseBuffRadius;
        }
      }
    });
  }

  /**
   * Unlock Question ability (called when first Training Camp is placed)
   */
  unlockQuestionAbility(): void {
    this.questionAbilityUnlocked = true;
  }

  /**
   * Check if Question ability is unlocked
   */
  isQuestionAbilityUnlocked(): boolean {
    return this.questionAbilityUnlocked;
  }

  /**
   * Check if in Question ability selection mode
   */
  isQuestionAbilitySelectionMode(): boolean {
    return this.questionAbilityCooldown > 0 && this.questionAbilityCooldown < AbilityManager.QUESTION_COOLDOWN;
  }

}
