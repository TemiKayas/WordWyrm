/**
 * Centralized color constants for WordWyrm
 * All colors used throughout the application
 */

export const COLORS = {
  // Primary Browns
  primary: '#473025',
  primaryDark: '#2d1f18',
  primaryHover: '#5a3d2e',
  primaryLight: '#9b7651',
  primaryLighter: '#dfc8a3',
  primaryText: '#c4a46f',

  // Orange (Secondary)
  orange: '#fd9227',
  orangeHover: '#e6832b',
  orangeActive: '#cc7425',
  orangeLight: '#ffa447',
  orangeDark: '#ff9f22',

  // Success Green
  success: '#95b607',
  successHover: '#7a9700',
  successActive: '#006029',
  successLight: '#a8cc00',

  // Danger/Error Red
  danger: '#ff3875',
  dangerHover: '#ff4880',
  dangerActive: '#730f11',
  dangerLight: '#ff6b9a',

  // Neutrals
  white: '#ffffff',
  black: '#000000',
  gray: '#6b7280',
  grayLight: '#d1d5db',
  grayDark: '#374151',

  // Backgrounds
  backgroundLight: '#fef7f0',
  backgroundDark: '#1f1410',
  cardBackground: '#ffffff',
} as const;

/**
 * Button-specific color mappings
 */
export const BUTTON_COLORS = {
  primary: {
    bg: COLORS.primary,
    hover: COLORS.primaryHover,
    border: COLORS.primaryDark,
    text: COLORS.white,
  },
  secondary: {
    bg: COLORS.primaryLight,
    hover: COLORS.primary,
    border: COLORS.primaryDark,
    text: COLORS.white,
  },
  success: {
    bg: COLORS.success,
    hover: COLORS.successHover,
    border: COLORS.successActive,
    text: COLORS.white,
  },
  orange: {
    bg: COLORS.orange,
    hover: COLORS.orangeHover,
    border: COLORS.orangeActive,
    text: COLORS.white,
  },
  danger: {
    bg: COLORS.danger,
    hover: COLORS.dangerHover,
    border: COLORS.dangerActive,
    text: COLORS.white,
  },
  outline: {
    bg: 'transparent',
    hover: COLORS.primaryLight,
    border: COLORS.primary,
    text: COLORS.primary,
  },
  text: {
    bg: 'transparent',
    hover: COLORS.grayLight,
    border: 'transparent',
    text: COLORS.primary,
  },
} as const;

export type ColorName = keyof typeof COLORS;
export type ButtonColorScheme = keyof typeof BUTTON_COLORS;