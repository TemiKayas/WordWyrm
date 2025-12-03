import * as Phaser from 'phaser';
import { Enemy, EnemyType, PathPoint } from '@/lib/tower-defense/types/GameTypes';
import { ENEMY_SPRITE_SCALES } from '@/lib/tower-defense/config/GameConfig';

/**
 * EnemyManager
 *
 * Responsibilities:
 * - Spawn enemies with appropriate stats based on wave
 * - Move enemies along path
 * - Update health bars
 * - Handle healer and commander auras
 * - Manage enemy visuals and interactivity
 *
 * Does NOT handle:
 * - Gold rewards (scene handles this)
 * - Lives deduction (scene handles this)
 * - Boss questions (scene handles this)
 * - Lightning strike execution (scene handles this)
 */

export interface EnemyDeath {
  enemy: Enemy;
  goldReward: number;
}

export interface EnemyEscape {
  enemy: Enemy;
}

export class EnemyManager {
  private scene: Phaser.Scene;
  private enemies: Enemy[] = [];
  private path: PathPoint[]; // Single path

  constructor(scene: Phaser.Scene, path: PathPoint[]) {
    this.scene = scene;
    this.path = path;
  }

  /**
   * Spawn a new enemy based on wave number and spawn count
   * Returns the spawned enemy (useful for boss reference)
   */
  spawnEnemy(
    waveNumber: number,
    enemiesToSpawn: number,
    onLightningClick: (enemy: Enemy) => void,
    onBossSpawn?: (baseHealth: number) => void
  ): Enemy {
    // Get start point from path
    const startPoint = this.path[0];
    const enemiesSpawned = Math.min(40, Math.floor(8 + (3 * waveNumber))) - enemiesToSpawn;

    // Determine if this should be a special spawn
    const isBossWave = waveNumber % 10 === 0;
    const isMiniBossWave = waveNumber % 5 === 0 && !isBossWave;
    const shouldSpawnBoss = isBossWave && enemiesSpawned === 4; // 5th enemy
    const shouldSpawnMiniBoss = isMiniBossWave && enemiesSpawned === 4; // 5th enemy

    let type: EnemyType;
    let health: number;
    let baseHealth: number;
    let speed: number;
    let color: number;
    let size: number;
    let goldValue: number;
    let isPriorityTarget: boolean = false;

    if (shouldSpawnBoss) {
      // Boss spawns every 10 waves with quiz question
      type = EnemyType.BOSS;
      baseHealth = 300 + (50 * waveNumber);
      speed = 57.75;
      color = 0x6a0dad; // Purple
      size = 1.7;
      goldValue = 25;

      if (onBossSpawn) {
        onBossSpawn(baseHealth);
      }
    } else if (shouldSpawnMiniBoss) {
      // Mini-boss spawns every 5 waves (except boss waves)
      type = EnemyType.MINI_BOSS;
      baseHealth = 120 + (15 * waveNumber);
      speed = 55;
      color = 0x800000; // Maroon
      size = 1.3;
      goldValue = 15;
    } else {
      // Regular enemy spawn based on wave progression
      const rand = Math.random();

      if (waveNumber < 7) {
        // Waves 1-6: Only RED and BLUE/YELLOW
        if (waveNumber < 3) {
          type = EnemyType.RED;
        } else if (waveNumber < 6) {
          type = rand < 0.6 ? EnemyType.RED : EnemyType.BLUE;
        } else {
          if (rand < 0.4) type = EnemyType.RED;
          else if (rand < 0.8) type = EnemyType.BLUE;
          else type = EnemyType.YELLOW;
        }
      } else if (waveNumber < 11) {
        // Waves 7-10: Introduce SPEEDY (15%)
        if (rand < 0.15) type = EnemyType.SPEEDY;
        else if (rand < 0.45) type = EnemyType.RED;
        else if (rand < 0.75) type = EnemyType.BLUE;
        else type = EnemyType.YELLOW;
      } else if (waveNumber < 16) {
        // Waves 11-15: Introduce ARMORED (20%), increase SPEEDY (20%)
        if (rand < 0.20) type = EnemyType.ARMORED;
        else if (rand < 0.40) type = EnemyType.SPEEDY;
        else if (rand < 0.60) type = EnemyType.RED;
        else if (rand < 0.80) type = EnemyType.BLUE;
        else type = EnemyType.YELLOW;
      } else if (waveNumber < 21) {
        // Waves 16-20: Introduce HEALER (10%), balanced mix
        if (rand < 0.10) type = EnemyType.HEALER;
        else if (rand < 0.30) type = EnemyType.ARMORED;
        else if (rand < 0.50) type = EnemyType.SPEEDY;
        else if (rand < 0.65) type = EnemyType.RED;
        else if (rand < 0.80) type = EnemyType.BLUE;
        else type = EnemyType.YELLOW;
      } else {
        // Waves 21+: Full roster with COMMANDER (8%)
        if (rand < 0.08) type = EnemyType.COMMANDER;
        else if (rand < 0.16) type = EnemyType.HEALER;
        else if (rand < 0.40) type = EnemyType.ARMORED;
        else if (rand < 0.60) type = EnemyType.SPEEDY;
        else if (rand < 0.72) type = EnemyType.RED;
        else if (rand < 0.84) type = EnemyType.BLUE;
        else type = EnemyType.YELLOW;
      }

      // Set base stats based on enemy type
      switch (type) {
        case EnemyType.RED:
          baseHealth = 25;
          speed = 50;
          color = 0xff0000;
          size = 0.85;
          goldValue = 1;
          break;
        case EnemyType.BLUE:
          baseHealth = 50;
          speed = 55;
          color = 0x0000ff;
          size = 1.0;
          goldValue = 2;
          break;
        case EnemyType.YELLOW:
          baseHealth = 75;
          speed = 60.5;
          color = 0xffff00;
          size = 1.2;
          goldValue = 3;
          break;
        case EnemyType.SPEEDY:
          baseHealth = 20;
          speed = 80;
          color = 0x00ff00; // Green
          size = 0.7;
          goldValue = 2;
          break;
        case EnemyType.ARMORED:
          baseHealth = 80;
          speed = 45;
          color = 0x808080; // Gray
          size = 1.1;
          goldValue = 5;
          break;
        case EnemyType.HEALER:
          baseHealth = 50;
          speed = 50;
          color = 0x90ee90; // Light green
          size = 1.0;
          goldValue = 6;
          isPriorityTarget = true;
          break;
        case EnemyType.COMMANDER:
          baseHealth = 60;
          speed = 48;
          color = 0xffa500; // Orange
          size = 1.15;
          goldValue = 7;
          isPriorityTarget = true;
          break;
        default:
          baseHealth = 25;
          speed = 50;
          color = 0xff0000;
          size = 0.85;
          goldValue = 1;
      }
    }

    // Apply HP scaling for waves 20+
    if (waveNumber >= 20 && type !== EnemyType.BOSS && type !== EnemyType.MINI_BOSS) {
      const scalingFactor = 1 + ((waveNumber - 20) / 20);
      health = Math.floor(baseHealth * scalingFactor);
    } else {
      health = baseHealth;
    }

    // Create visual representation
    const graphics = this.scene.add.graphics();
    let sprite: Phaser.GameObjects.Sprite | undefined = undefined;

    // Create sprite for RED enemies (goblins), graphics for others
    if (type === EnemyType.RED) {
      // Use first frame as initial texture
      sprite = this.scene.add.sprite(startPoint.x, startPoint.y, 'goblin_frame_1');
      sprite.setScale(ENEMY_SPRITE_SCALES.goblin * size);
      sprite.setRotation(Math.PI); // Flip 180 degrees to face correct direction
      sprite.setDepth(2); // Same depth as enemies

      // Play walking animation
      if (this.scene.anims.exists('goblin_walk')) {
        sprite.play('goblin_walk');
        console.log('[EnemyManager] Playing goblin_walk animation');
      } else {
        console.warn('[EnemyManager] goblin_walk animation not found');
      }
    }

    // Draw different shapes based on enemy type (for non-sprite enemies)
    if (type === EnemyType.BOSS || type === EnemyType.MINI_BOSS) {
      // Hexagon shape for bosses
      graphics.fillStyle(color);
      graphics.beginPath();
      const radius = 20;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fillPath();
    } else if (type === EnemyType.HEALER) {
      // Star shape for healer (5-pointed)
      graphics.fillStyle(color);
      graphics.beginPath();
      const spikes = 5;
      const outerRadius = 15;
      const innerRadius = 7;
      for (let i = 0; i < spikes * 2; i++) {
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        if (i === 0) graphics.moveTo(x, y);
        else graphics.lineTo(x, y);
      }
      graphics.closePath();
      graphics.fillPath();
    } else if (type === EnemyType.COMMANDER) {
      // Diamond shape for commander
      graphics.fillStyle(color);
      graphics.beginPath();
      graphics.moveTo(0, -15);
      graphics.lineTo(12, 0);
      graphics.lineTo(0, 15);
      graphics.lineTo(-12, 0);
      graphics.closePath();
      graphics.fillPath();
    } else if (type === EnemyType.ARMORED) {
      // Triangle with thick metallic border for armored
      graphics.fillStyle(color);
      graphics.beginPath();
      graphics.moveTo(0, -15);
      graphics.lineTo(15, 10);
      graphics.lineTo(-15, 10);
      graphics.closePath();
      graphics.fillPath();

      // Add thick armored border
      graphics.lineStyle(4, 0x4a4a4a, 1); // Dark gray metallic border
      graphics.strokeTriangle(0, -15, 15, 10, -15, 10);
    } else if (type !== EnemyType.RED) {
      // Triangle shape for regular enemies (BLUE, YELLOW, SPEEDY) - skip RED (uses sprite)
      graphics.fillStyle(color);
      graphics.beginPath();
      graphics.moveTo(0, -15);
      graphics.lineTo(15, 10);
      graphics.lineTo(-15, 10);
      graphics.closePath();
      graphics.fillPath();
    }

    graphics.setPosition(startPoint.x, startPoint.y);
    graphics.setScale(size);
    graphics.setDepth(1); // Render above background (-2) and paths (-1)

    // Make enemy interactive for Lightning Strike ability
    const hitRadius = (type === EnemyType.BOSS || type === EnemyType.MINI_BOSS) ? 20 : 15;

    if (sprite) {
      // Make sprite interactive (for goblin enemies)
      sprite.setInteractive(new Phaser.Geom.Circle(0, 0, hitRadius), Phaser.Geom.Circle.Contains);
      sprite.input!.cursor = 'pointer';
    } else {
      // Make graphics interactive (for shape-based enemies)
      graphics.setInteractive(new Phaser.Geom.Circle(0, 0, hitRadius), Phaser.Geom.Circle.Contains);
      graphics.input!.cursor = 'pointer';
    }

    // Create health bar background
    const healthBarBg = this.scene.add.graphics();
    const healthBarWidth = 30 * size;
    const healthBarHeight = 4;
    const healthBarY = -25 * size;

    healthBarBg.fillStyle(0x000000, 0.5);
    healthBarBg.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    healthBarBg.setPosition(startPoint.x, startPoint.y);
    healthBarBg.setDepth(2); // Render above enemy graphics

    // Create health bar fill
    const healthBarFill = this.scene.add.graphics();
    healthBarFill.fillStyle(type === EnemyType.BOSS ? 0x6a0dad : 0x00ff00);
    healthBarFill.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth, healthBarHeight);
    healthBarFill.setPosition(startPoint.x, startPoint.y);
    healthBarFill.setDepth(3); // Render above health bar background

    // Create enemy entity
    const enemy: Enemy = {
      x: startPoint.x,
      y: startPoint.y,
      speed: speed,
      baseSpeed: speed, // Store original speed for aura calculations
      health: health,
      maxHealth: health,
      type: type,
      pathIndex: 1, // Start at second waypoint (first is spawn)
      graphics: graphics,
      sprite: sprite, // Sprite for goblin enemies
      size: size,
      healthBarBg: healthBarBg,
      healthBarFill: healthBarFill,
      goldValue: goldValue,
      isPriorityTarget: isPriorityTarget,
      lastHealTime: type === EnemyType.HEALER ? Date.now() : undefined
    };

    this.enemies.push(enemy);

    // Add Lightning Strike click handler
    if (sprite) {
      // Add click handler to sprite (for goblin enemies)
      sprite.on('pointerdown', () => {
        onLightningClick(enemy);
      });
    } else {
      // Add click handler to graphics (for shape-based enemies)
      graphics.on('pointerdown', () => {
        onLightningClick(enemy);
      });
    }

    return enemy;
  }

  /**
   * Update all enemies - move along path, update health bars
   * Returns enemies that died or escaped this frame
   */
  updateEnemies(scaledDelta: number, goldBuff: boolean): { deaths: EnemyDeath[], escapes: EnemyEscape[] } {
    const deaths: EnemyDeath[] = [];
    const escapes: EnemyEscape[] = [];

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      // Check if reached end of path
      if (enemy.pathIndex >= this.path.length) {
        escapes.push({ enemy });
        enemy.graphics.destroy();
        enemy.sprite?.destroy();
        enemy.healthBarBg?.destroy();
        enemy.healthBarFill?.destroy();
        this.enemies.splice(i, 1);
        continue;
      }

      // Move towards next waypoint
      const target = this.path[enemy.pathIndex];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 5) {
        // Reached waypoint, move to next
        enemy.pathIndex++;
      } else {
        // Move towards waypoint
        enemy.x += (dx / dist) * enemy.speed * scaledDelta / 1000;
        enemy.y += (dy / dist) * enemy.speed * scaledDelta / 1000;

        // Rotate to face direction
        const angle = Math.atan2(dy, dx) + Math.PI / 2;
        enemy.graphics.setRotation(angle);
        if (enemy.sprite) {
          // Goblins need 180° base rotation to face correct direction
          enemy.sprite.setRotation(angle + Math.PI);
        }
      }

      enemy.graphics.setPosition(enemy.x, enemy.y);
      if (enemy.sprite) {
        enemy.sprite.setPosition(enemy.x, enemy.y);
      }

      // Update health bars
      if (enemy.healthBarBg && enemy.healthBarFill) {
        enemy.healthBarBg.setPosition(enemy.x, enemy.y);
        enemy.healthBarFill.setPosition(enemy.x, enemy.y);

        // Redraw health bar fill based on current health
        const healthBarWidth = 30 * enemy.size;
        const healthBarHeight = 4;
        const healthBarY = -25 * enemy.size;
        const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);

        enemy.healthBarFill.clear();

        // Color based on health percentage
        let healthColor = 0x00ff00; // Green
        if (enemy.type === EnemyType.BOSS) {
          healthColor = 0x6a0dad; // Purple for boss
        } else if (healthPercent < 0.3) {
          healthColor = 0xff0000; // Red
        } else if (healthPercent < 0.6) {
          healthColor = 0xffff00; // Yellow
        }

        enemy.healthBarFill.fillStyle(healthColor);
        enemy.healthBarFill.fillRect(-healthBarWidth / 2, healthBarY, healthBarWidth * healthPercent, healthBarHeight);
      }

      // Check if dead
      if (enemy.health <= 0) {
        let goldReward = enemy.goldValue;

        // Apply gold buff (+1 gold per kill)
        if (goldBuff) {
          goldReward += 1;
        }

        deaths.push({ enemy, goldReward });
        enemy.graphics.destroy();
        enemy.sprite?.destroy();
        enemy.healthBarBg?.destroy();
        enemy.healthBarFill?.destroy();
        this.enemies.splice(i, 1);
      }
    }

    return { deaths, escapes };
  }

  /**
   * Update healer auras - heal nearby enemies
   */
  updateHealerAuras(gameSpeed: number): void {
    this.enemies.forEach(healer => {
      if (healer.type !== EnemyType.HEALER || healer.health <= 0) return;

      // Heal every 1 second (1000ms)
      const healTickRate = 1000 / gameSpeed;
      const now = Date.now();

      if (healer.lastHealTime && now - healer.lastHealTime < healTickRate) return;

      healer.lastHealTime = now;

      // Find enemies in healing range (80px radius)
      const healRadius = 80;
      this.enemies.forEach(target => {
        if (target === healer) return; // Don't heal self
        if (target.health >= target.maxHealth) return; // Already at full health
        if (target.type === EnemyType.HEALER || target.type === EnemyType.COMMANDER) return; // No aura stacking

        const dx = target.x - healer.x;
        const dy = target.y - healer.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < healRadius) {
          // Heal 3 HP/s
          target.health = Math.min(target.health + 3, target.maxHealth);

          // Visual heal effect
          const healText = this.scene.add.text(target.x, target.y - 20, `+3`, {
            fontSize: '10px',
            color: '#00ff00',
            fontFamily: 'Quicksand, sans-serif',
            fontStyle: 'bold',
            stroke: '#000000',
            strokeThickness: 1
          }).setOrigin(0.5);

          this.scene.tweens.add({
            targets: healText,
            y: target.y - 35,
            alpha: 0,
            duration: 500,
            onComplete: () => healText.destroy()
          });
        }
      });
    });
  }

  /**
   * Update commander auras - apply speed buffs to nearby enemies
   */
  updateCommanderAuras(): void {
    // First, reset all enemy speeds to base speed (except frozen enemies)
    this.enemies.forEach(enemy => {
      if (!enemy.frozen) {
        enemy.speed = enemy.baseSpeed;
      }
    });

    // Then apply commander aura buffs
    this.enemies.forEach(commander => {
      if (commander.type !== EnemyType.COMMANDER || commander.health <= 0) return;

      const auraRadius = 100;
      this.enemies.forEach(target => {
        if (target === commander) return; // Don't buff self
        if (target.type === EnemyType.HEALER || target.type === EnemyType.COMMANDER) return; // No aura stacking
        if (target.frozen) return; // Don't buff frozen enemies

        const dx = target.x - commander.x;
        const dy = target.y - commander.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < auraRadius) {
          // Apply +20% speed boost (only from strongest commander, no stacking)
          target.speed = Math.max(target.speed, target.baseSpeed * 1.20);
        }
      });
    });
  }

  /**
   * Get all enemies (read-only access)
   */
  getEnemies(): readonly Enemy[] {
    return this.enemies;
  }

  /**
   * Clean up all enemies (called when scene ends)
   */
  destroy(): void {
    this.enemies.forEach(enemy => {
      enemy.graphics.destroy();
      enemy.sprite?.destroy();
      enemy.healthBarBg?.destroy();
      enemy.healthBarFill?.destroy();
    });
    this.enemies = [];
  }
}
