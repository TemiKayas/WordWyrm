import * as Phaser from 'phaser';

// Enemy type definitions
// RED: Low HP, slow (25 HP, 50 speed, 0.85 size, 1 gold)
// BLUE: Medium HP, medium speed (50 HP, 55 speed, 1.0 size, 2 gold)
// YELLOW: High HP, fast (75 HP, 60.5 speed, 1.2 size, 3 gold)
// SPEEDY: Low HP, very fast (20 HP, 80 speed, 0.7 size, 2 gold) - intro wave 7
// ARMORED: High HP, slow, 35% dmg reduction (80 HP, 45 speed, 1.1 size, 5 gold) - intro wave 11
// HEALER: Medium HP, heals 3 HP/s in 80px (50 HP, 50 speed, 1.0 size, 6 gold) - intro wave 16, priority target
// COMMANDER: Medium HP, +20% speed aura 100px (60 HP, 48 speed, 1.15 size, 7 gold) - intro wave 21, priority target
// MINI_BOSS: Spawns every 5 waves (120 + 15*wave HP, 55 speed, 1.3 size, 15 gold) - waves 5, 15, 25, 35, 45
// BOSS: Spawns every 10 waves with quiz (300 + 50*wave HP, 57.75 speed, 1.7 size, 50 gold) - waves 20, 40
export enum EnemyType {
  RED = 'RED',
  BLUE = 'BLUE',
  YELLOW = 'YELLOW',
  SPEEDY = 'SPEEDY',
  ARMORED = 'ARMORED',
  HEALER = 'HEALER',
  COMMANDER = 'COMMANDER',
  MINI_BOSS = 'MINI_BOSS',
  BOSS = 'BOSS',
}

// Enemy entity - follows path and takes damage from towers
export interface Enemy {
  x: number;
  y: number;
  speed: number; // pixels per second (affected by commander aura)
  baseSpeed: number; // original speed before buffs
  health: number;
  maxHealth: number;
  type: EnemyType;
  pathIndex: number; // current target waypoint on path
  graphics: Phaser.GameObjects.Graphics; // visual representation
  size: number; // scale multiplier for visual size
  healthBarBg?: Phaser.GameObjects.Graphics; // health bar background
  healthBarFill?: Phaser.GameObjects.Graphics; // health bar fill
  goldValue: number; // gold reward for killing this enemy
  isPriorityTarget?: boolean; // true for HEALER and COMMANDER
  lastHealTime?: number; // timestamp for healer healing tick
  frozen?: boolean; // true when frozen by Freeze ability (prevents commander aura from resetting speed)
}

// Tower entity - attacks enemies in range
// Ballista (basic): Fast fire, 50 gold, 150 range
// Trebuchet (sniper): Slow fire, 75 gold, 300 range
// Knight (melee): Very fast fire, 25 gold, 100 range
// Training Camp (fact): Support tower, 40 gold, 200 buff radius (doesn't attack)
// Archmage (wizard): Spell rotation, 100 gold, 170 range (requires 5+ correct answers)
export interface Tower {
  x: number;
  y: number;
  range: number; // attack radius (or buff radius for Training Camp)
  fireRate: number; // ms between attacks
  damage: number;
  cost: number; // purchase price
  lastFired: number; // timestamp of last attack
  type: 'basic' | 'sniper' | 'melee' | 'fact' | 'wizard';
  graphics: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Container;
  rangeCircle?: Phaser.GameObjects.Arc; // Range indicator circle
  upgrades: {
    explosive?: boolean; // Trebuchet: AoE damage
    dotArrows?: boolean; // Ballista: damage over time
    fasterFireRate?: boolean; // Ballista: -15% fire rate
    moreDamage?: boolean; // Knight: +10% damage
    lightningDebuff?: boolean; // Archmage Path A: Lightning applies 5% damage debuff
    knowledgeScaling?: boolean; // Archmage Path B: +1% dmg/fire rate per correct answer
    aoeCharge?: boolean; // Archmage Path A Tier 2: 15s charge AoE blast
  };
  baseDamage: number; // original damage (for buff calculations)
  baseFireRate: number; // original fire rate (for buff calculations)
  size: number; // visual scale multiplier

  // Fact tower specific properties
  buffRadius?: number; // Only for fact towers
  factText?: string; // Educational fact displayed on hover
  boosted?: boolean; // If Question ability buff is active
  boostedUntil?: number; // Timestamp when boost expires
  baseBuffRadius?: number; // Original buff radius before Question ability

  // Wizard tower specific properties
  currentSpell?: 'fire' | 'ice' | 'lightning'; // Current spell in rotation
  nextSpell?: 'fire' | 'ice' | 'lightning'; // Next spell (shown as glow)
  spellGlow?: Phaser.GameObjects.Arc; // Visual glow indicator
  correctAnswersWhenPlaced?: number; // For knowledge scaling tracking
  lastChargeBlast?: number; // Timestamp of last AoE charge blast
}

// Damage over time effect (from Ballista upgrade)
// Deals 2 damage per 500ms tick for 4 ticks (2 seconds total)
export interface DotEffect {
  enemy: Enemy;
  damagePerTick: number;
  ticksRemaining: number;
  lastTick: number;
}

// Projectile entity - travels from tower to enemy
// Melee towers use hitscan (instant damage) instead of projectiles
export interface Projectile {
  x: number;
  y: number;
  target: Enemy; // tracking target
  graphics: Phaser.GameObjects.Image;
  sourceTower: Tower; // for checking upgrades (explosive, DoT)
  damage: number; // can be buffed beyond tower base damage
  startX?: number; // Starting X position (for distance-based effects)
  startY?: number; // Starting Y position (for distance-based effects)
  baseScale?: number; // Base scale for arc animation
}

// Waypoint in enemy path
export interface PathPoint {
  x: number;
  y: number;
}
