/**
 * Shared layout constants for responsive design
 * All UI elements should reference these constants for consistency
 */
export const LAYOUT = {
  // Base screen dimensions (design resolution)
  BASE_WIDTH: 1920,
  BASE_HEIGHT: 1080,

  // Sidebar dimensions
  SIDEBAR_WIDTH: 300,
  SIDEBAR_MIN_WIDTH: 220,

  // UI element positions (as percentages of screen)
  LIVES_X_PERCENT: 128 / 1920, // 0.0667
  LIVES_Y_PERCENT: 128 / 1080, // 0.1185
  GOLD_X_PERCENT: 1770 / 1920, // 0.9219
  GOLD_Y_PERCENT: 248 / 1080, // 0.2296

  // Font sizes (base sizes at 1920x1080)
  FONT_SIZE_TINY: 10,
  FONT_SIZE_SMALL: 15,
  FONT_SIZE_MEDIUM: 18,
  FONT_SIZE_LARGE: 27,
  FONT_SIZE_XLARGE: 30,
  FONT_SIZE_HUGE: 60,

  // Font size limits (for clamping)
  FONT_MIN_TINY: 8,
  FONT_MAX_TINY: 14,
  FONT_MIN_SMALL: 10,
  FONT_MAX_SMALL: 20,
  FONT_MIN_MEDIUM: 12,
  FONT_MAX_MEDIUM: 24,
  FONT_MIN_LARGE: 18,
  FONT_MAX_LARGE: 32,
  FONT_MIN_XLARGE: 20,
  FONT_MAX_XLARGE: 40,
  FONT_MIN_HUGE: 40,
  FONT_MAX_HUGE: 80,

  // Responsive breakpoints
  BREAKPOINT_MOBILE: 768,
  BREAKPOINT_TABLET: 1024,
  BREAKPOINT_LAPTOP: 1366,
  BREAKPOINT_DESKTOP: 1920,
  BREAKPOINT_4K: 3840,

  // Tower button dimensions
  TOWER_BUTTON_WIDTH: 135,
  TOWER_BUTTON_HEIGHT: 165,
  TOWER_BUTTON_SPACING: 165, // Horizontal spacing between buttons

  // Start button dimensions
  START_BUTTON_WIDTH: 540,
  START_BUTTON_HEIGHT: 150,

  // Quiz popup dimensions
  QUIZ_POPUP_MAX_WIDTH_PERCENT: 0.8, // 80% of screen width
  QUIZ_POPUP_MAX_HEIGHT_PERCENT: 0.8, // 80% of screen height
  QUIZ_POPUP_MIN_WIDTH: 600,
  QUIZ_POPUP_MIN_HEIGHT: 400
} as const;

/**
 * Get current breakpoint based on width
 */
export function getBreakpoint(width: number): 'mobile' | 'tablet' | 'laptop' | 'desktop' | '4k' {
  if (width < LAYOUT.BREAKPOINT_MOBILE) return 'mobile';
  if (width < LAYOUT.BREAKPOINT_TABLET) return 'tablet';
  if (width < LAYOUT.BREAKPOINT_LAPTOP) return 'laptop';
  if (width < LAYOUT.BREAKPOINT_DESKTOP) return 'desktop';
  return '4k';
}

/**
 * Calculate sidebar width based on screen width
 */
export function getSidebarWidth(screenWidth: number): number {
  return Math.max(LAYOUT.SIDEBAR_MIN_WIDTH, screenWidth * 0.15);
}
