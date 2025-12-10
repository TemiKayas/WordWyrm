// ============================================
// GAME CONFIGURATION
// This is the central place for all game balance and visual settings
// ============================================

// ============================================
// TOWER VISUAL SIZES - Adjust these to change sprite scales
// This is the ONLY place to edit tower sizes - changes apply everywhere
// ============================================
export const TOWER_SPRITE_SCALES = {
  ballista: 0.15,      // Ballista (basic)
  trebuchet: 0.25,     // Trebuchet (sniper)
  knight: 0.1,        // Knight (melee)
  archmage: 0.11,     // Archmage (wizard)
  trainingCamp: 0.1,  // Training Camp (fact)
  cannon: 0.2         // Cannon (AoE)
} as const;

// ============================================
// PROJECTILE SIZES - Adjust these to change projectile sprite scales
// EDIT THIS to change projectile sizes - changes apply everywhere
// ============================================
export const PROJECTILE_SPRITE_SCALES = {
  ballista: 0.125,    // Ballista arrow (75% smaller than original 0.5)
  catapult: 0.25,      // Catapult rock
  wizard: 0.2,         // Wizard spell
  cannon: 0.2         // Cannonball
} as const;

// ============================================
// ENEMY SPRITE SIZES - Adjust these to change enemy sprite scales
// EDIT THIS to change enemy sizes - changes apply everywhere
// ============================================
export const ENEMY_SPRITE_SCALES = {
  goblin: 0.08,       // Goblin enemy - 70% smaller than 0.5
  // Add more enemy types here as needed
} as const;

// ============================================
// PROJECTILE ROTATION OFFSETS - Adjust if sprites are oriented incorrectly
// 0 = sprite points RIGHT in source image
// Math.PI / 2 (90°) = sprite points DOWN in source image
// -Math.PI / 2 (-90°) = sprite points UP in source image
// Math.PI (180°) = sprite points LEFT in source image
// ============================================
export const PROJECTILE_ROTATION_OFFSETS = {
  ballista: -Math.PI / 2,    // Arrow points UP in sprite, needs -90° rotation
  catapult: 0,               // Rock - no orientation needed
  wizard: 0,                  // Spell - no orientation needed
  cannon: 0                  // Cannonball - no orientation needed
} as const;

// ============================================
// STAGE CONFIGURATION - Path settings for all stages
// ============================================
export const STAGE_CONFIG = {
  // Width of enemy paths (in pixels)
  PATH_WIDTH: 70,

  // Offset from right edge for path endpoints (in pixels)
  PATH_END_OFFSET: 20
} as const;

// ============================================
// UI TEXT STYLES - Reusable text style objects
// ============================================
export const TEXT_STYLES = {
  // Upgrade button title text (DOT, Fire+, Explosive, Damage+)
  UPGRADE_TITLE: {
    fontSize: '10px',
    color: '#473025',
    fontFamily: 'Quicksand, sans-serif',
    fontStyle: 'bold',
    resolution: 2
  },

  // Upgrade button cost text (15g)
  UPGRADE_COST: {
    fontSize: '9px',
    color: '#473025',
    fontFamily: 'Quicksand, sans-serif',
    fontStyle: '600',
    resolution: 2
  },

  // Error/feedback message
  ERROR_MESSAGE: {
    fontFamily: 'Quicksand, sans-serif',
    fontStyle: 'bold',
    color: '#e74c3c',
    stroke: '#000000',
    strokeThickness: 4
  },

  // Damage number floating text
  DAMAGE_NUMBER: {
    fontSize: '12px',
    fontFamily: 'Quicksand, sans-serif',
    fontStyle: 'bold',
    stroke: '#000000',
    strokeThickness: 2
  }
} as const;

// ============================================
// GAME BALANCE CONSTANTS
// ============================================
export const BALANCE_CONSTANTS = {
  // Upgrade pricing
  UPGRADE_BASE_PRICE: 15, // Base price for all upgrades (in gold)

  // Quiz pricing (price increase on wrong answer)
  QUIZ_PRICE_INCREASE_MULTIPLIER: 1.25 // 25% increase
} as const;

// ============================================
// RESPONSIVE SCALING - For different screen resolutions
// ============================================
export const SCALE_FACTORS = {
  // Base scale at 1920x1080 (design resolution)
  BASE_WIDTH: 1920,
  BASE_HEIGHT: 1080,

  // Minimum scale (don't shrink sprites below this multiplier)
  MIN_SCALE: 0.7,

  // Maximum scale (don't grow sprites above this multiplier)
  MAX_SCALE: 1.3
} as const;

/**
 * Calculate responsive sprite scale based on current screen size
 * Ensures sprites don't become too small or too large
 *
 * @param baseScale - The base sprite scale (from TOWER_SPRITE_SCALES or PROJECTILE_SPRITE_SCALES)
 * @param sceneWidth - Current scene width (from this.scale.width)
 * @param sceneHeight - Current scene height (from this.scale.height)
 * @returns Adjusted scale clamped to MIN_SCALE and MAX_SCALE
 */
export function getResponsiveSpriteScale(
  baseScale: number,
  sceneWidth: number,
  sceneHeight: number
): number {
  // Calculate scale factor based on the smaller dimension to avoid overflow
  const widthFactor = sceneWidth / SCALE_FACTORS.BASE_WIDTH;
  const heightFactor = sceneHeight / SCALE_FACTORS.BASE_HEIGHT;
  const scaleFactor = Math.min(widthFactor, heightFactor);

  // Apply scale factor to base scale
  const adjustedScale = baseScale * scaleFactor;

  // Clamp to min/max to prevent sprites from being too small/large
  const clampedScale = Math.max(
    baseScale * SCALE_FACTORS.MIN_SCALE,
    Math.min(adjustedScale, baseScale * SCALE_FACTORS.MAX_SCALE)
  );

  return clampedScale;
}

/**
 * Calculate responsive font size based on current screen height
 *
 * @param baseSize - The base font size (e.g. 18)
 * @param sceneHeight - Current scene height
 * @returns CSS font string (e.g. "24px")
 */
export function getResponsiveFontSize(
  baseSize: number,
  sceneHeight: number
): string {
  // Calculate scale factor based on height relative to 1080p
  const scaleFactor = sceneHeight / SCALE_FACTORS.BASE_HEIGHT;
  
  // Calculate new size, clamping to reasonable limits
  // Don't shrink below 0.8x or grow above 1.5x of base
  // AND enforce a hard minimum of 14px for readability
  const calculatedSize = Math.round(baseSize * Math.max(0.8, Math.min(1.5, scaleFactor)));
  const newSize = Math.max(14, calculatedSize);
  
  return `${newSize}px`;
}
