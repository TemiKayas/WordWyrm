// Game balance constants and configuration
export const GAME_CONFIG = {
  // Player starting values
  STARTING_LIVES: 10,
  STARTING_GOLD: 100,

  // Quiz rewards
  CORRECT_ANSWER_GOLD: 75,
  INCORRECT_ANSWER_GOLD: 30,

  // Boss fight configuration
  BOSS_WAVES: [5, 10, 15, 20], // Boss appears on these waves
  BOSS_QUESTIONS_PER_FIGHT: 3,
} as const;

// Tower type definitions and costs
export const TOWER_TYPES = {
  BALLISTA: {
    id: 'basic',
    name: 'Ballista',
    description: 'Fast Fire',
    cost: 50,
    damage: 20,
    fireRate: 800,
    range: 180,
    projectileSpeed: 400,
    color: 0xA8277F,
    colorDark: 0x8B1F68,
  },
  TREBUCHET: {
    id: 'sniper',
    name: 'Trebuchet',
    description: 'Slow Fire',
    cost: 75,
    damage: 60,
    fireRate: 2000,
    range: 280,
    projectileSpeed: 300,
    color: 0x399A66,
    colorDark: 0x2D7A52,
  },
  MELEE: {
    id: 'melee',
    name: 'Melee Tower',
    description: 'Rapid Fire',
    cost: 25,
    damage: 10,
    fireRate: 400,
    range: 100,
    projectileSpeed: 500,
    color: 0xFF8A58,
    colorDark: 0xFF6F3D,
  },
} as const;

// Tower upgrade configuration
export const UPGRADE_CONFIG = {
  DAMAGE: {
    cost: 30,
    multiplier: 1.5,
    max: 3,
    label: 'Damage',
  },
  FIRE_RATE: {
    cost: 25,
    multiplier: 0.75, // Lower = faster
    max: 3,
    label: 'Fire Rate',
  },
  RANGE: {
    cost: 20,
    multiplier: 1.3,
    max: 3,
    label: 'Range',
  },
} as const;

// Enemy wave configuration - INCREASED DIFFICULTY
export const WAVE_CONFIG = {
  // Base enemy stats
  BASE_HEALTH: 80, // Increased from 50
  BASE_SPEED: 1.2, // Increased from 1.0
  BASE_GOLD_REWARD: 15,

  // Scaling per wave - MORE AGGRESSIVE
  HEALTH_MULTIPLIER: 1.35, // Increased from 1.2
  SPEED_MULTIPLIER: 1.08, // Increased from 1.05
  GOLD_MULTIPLIER: 1.15,

  // Enemy spawn timing - FASTER SPAWNS
  SPAWN_INTERVAL: 800, // Decreased from 1000ms
  MIN_SPAWN_INTERVAL: 300, // Decreased from 500ms
  SPAWN_REDUCTION_PER_WAVE: 40, // Increased from 30ms

  // Enemies per wave - MORE ENEMIES
  BASE_ENEMY_COUNT: 8, // Increased from 5
  ENEMY_INCREASE_PER_WAVE: 3, // Increased from 2
  MAX_ENEMIES_PER_WAVE: 40, // Increased from 30

  // Boss configuration - TOUGHER BOSSES
  BOSS_HEALTH_MULTIPLIER: 8, // Increased from 5
  BOSS_SPEED_MULTIPLIER: 0.7, // Slower but tankier
  BOSS_SIZE_MULTIPLIER: 2.5,
  BOSS_COLOR: 0xff0000,
} as const;

// UI positioning and styling constants
export const UI_CONFIG = {
  SIDEBAR_WIDTH_RATIO: 0.15,
  MIN_SIDEBAR_WIDTH: 220,

  COLORS: {
    BACKGROUND: 0x8bc34a,
    GRASS_VARIANT: 0x7cb342,
    PATH: 0x8d6e63,
    SIDEBAR: 0xFFFAF2,
    PANEL_CREAM: 0xfffaf2,
    GOLD_BORDER: 0xc4a46f,
    BROWN_TEXT: 0x473025,
    GREEN_SUCCESS: 0x96b902,
    RED_ERROR: 0xef4444,
    ORANGE_SPEED: 0xff9f22,
    WHITE: 0xffffff,
  },

  // Button styling to match WordWyrm design
  BUTTON_STYLE: {
    borderRadius: '13px',
    border: '2px solid',
    height: '48px',
    fontSize: '18px',
    fontFamily: 'Quicksand, sans-serif',
    fontWeight: 'bold',
    transition: 'all 0.2s ease',
    activeScale: 0.98,
    hoverShadow: '0 4px 12px rgba(0,0,0,0.25)',
  },
} as const;

// Path coordinates will be calculated dynamically based on screen size
export function generatePathPoints(gameWidth: number, height: number) {
  const pathY1 = height * 0.65;
  const pathY2 = height * 0.25;
  const pathY3 = height * 0.72;

  return [
    { x: 0, y: pathY1 },
    { x: gameWidth * 0.3, y: pathY1 },
    { x: gameWidth * 0.3, y: pathY2 },
    { x: gameWidth * 0.7, y: pathY2 },
    { x: gameWidth * 0.7, y: pathY3 },
    { x: gameWidth - 20, y: pathY3 },
  ];
}

// Calculate enemy stats for a given wave
export function getEnemyStatsForWave(waveNumber: number) {
  const health = Math.floor(
    WAVE_CONFIG.BASE_HEALTH * Math.pow(WAVE_CONFIG.HEALTH_MULTIPLIER, waveNumber - 1)
  );
  const speed = Math.min(
    2.5,
    WAVE_CONFIG.BASE_SPEED * Math.pow(WAVE_CONFIG.SPEED_MULTIPLIER, waveNumber - 1)
  );
  const goldReward = Math.floor(
    WAVE_CONFIG.BASE_GOLD_REWARD * Math.pow(WAVE_CONFIG.GOLD_MULTIPLIER, waveNumber - 1)
  );
  const count = Math.min(
    WAVE_CONFIG.MAX_ENEMIES_PER_WAVE,
    WAVE_CONFIG.BASE_ENEMY_COUNT + (waveNumber - 1) * WAVE_CONFIG.ENEMY_INCREASE_PER_WAVE
  );
  const spawnInterval = Math.max(
    WAVE_CONFIG.MIN_SPAWN_INTERVAL,
    WAVE_CONFIG.SPAWN_INTERVAL - (waveNumber - 1) * WAVE_CONFIG.SPAWN_REDUCTION_PER_WAVE
  );

  return { health, speed, goldReward, count, spawnInterval };
}

// Check if wave is a boss wave
export function isBossWave(waveNumber: number): boolean {
  return (GAME_CONFIG.BOSS_WAVES as readonly number[]).includes(waveNumber);
}

// Calculate boss stats for a given wave
export function getBossStatsForWave(waveNumber: number) {
  const baseStats = getEnemyStatsForWave(waveNumber);

  return {
    health: baseStats.health * WAVE_CONFIG.BOSS_HEALTH_MULTIPLIER,
    speed: baseStats.speed * WAVE_CONFIG.BOSS_SPEED_MULTIPLIER,
    goldReward: baseStats.goldReward * 3,
    size: WAVE_CONFIG.BOSS_SIZE_MULTIPLIER,
    color: WAVE_CONFIG.BOSS_COLOR,
  };
}
