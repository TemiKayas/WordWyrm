/**
 * Centralized animation constants for WordWyrm
 * Standardizes GSAP animations, CSS animations, and timing
 */

/**
 * Standard animation durations (in seconds)
 */
export const DURATIONS = {
  instant: 0.1,
  fast: 0.15,
  quick: 0.2,
  normal: 0.3,
  medium: 0.5,
  slow: 0.8,
  slower: 1.0,
  slowest: 1.2,
} as const;

/**
 * Standard easing functions for GSAP
 */
export const EASINGS = {
  // Smooth transitions
  smooth: 'power2.inOut',
  smoothIn: 'power2.in',
  smoothOut: 'power2.out',

  // Elastic/bouncy effects
  elastic: 'elastic.out(1, 0.5)',
  elasticIn: 'elastic.in(1, 0.5)',
  elasticOut: 'elastic.out(1, 0.5)',

  // Back easing (overshoot)
  back: 'back.out(1.7)',
  backIn: 'back.in(1.7)',
  backOut: 'back.out(1.7)',

  // Power easing
  power3Out: 'power3.out',
  power1InOut: 'power1.inOut',

  // Sine easing (smooth curves)
  sineInOut: 'sine.inOut',
} as const;

/**
 * Common GSAP animation presets
 */
export const ANIMATION_PRESETS = {
  // Button interactions
  buttonHover: {
    scale: 1.05,
    duration: DURATIONS.fast,
    ease: EASINGS.smooth,
  },
  buttonActive: {
    scale: 0.95,
    duration: DURATIONS.instant,
    ease: EASINGS.smooth,
  },

  // Card entrances
  cardEnter: {
    from: { y: 100, opacity: 0 },
    to: { y: 0, opacity: 1, duration: DURATIONS.slow, ease: EASINGS.backOut },
  },
  cardEnterFast: {
    from: { y: 50, opacity: 0 },
    to: { y: 0, opacity: 1, duration: DURATIONS.medium, ease: EASINGS.smoothOut },
  },

  // Fade animations
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1, duration: DURATIONS.normal, ease: EASINGS.smooth },
  },
  fadeInScale: {
    from: { opacity: 0, scale: 0.95 },
    to: { opacity: 1, scale: 1, duration: DURATIONS.normal, ease: EASINGS.smoothOut },
  },
  fadeInUp: {
    from: { y: 80, opacity: 0 },
    to: { y: 0, opacity: 1, duration: DURATIONS.medium, ease: EASINGS.smoothOut },
  },

  // Scale animations
  scaleIn: {
    from: { scale: 0.5, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: DURATIONS.slow, ease: EASINGS.elasticOut },
  },
  popIn: {
    from: { scale: 0, opacity: 0 },
    to: { scale: 1, opacity: 1, duration: DURATIONS.medium, ease: EASINGS.backOut },
  },

  // Rotation animations
  rotateIn: {
    from: { rotation: -180, scale: 0, opacity: 0 },
    to: { rotation: 0, scale: 1, opacity: 1, duration: DURATIONS.slow, ease: EASINGS.backOut },
  },

  // Slide animations
  slideInLeft: {
    from: { x: -200, opacity: 0 },
    to: { x: 0, opacity: 1, duration: DURATIONS.slow, ease: EASINGS.backOut },
  },
  slideInRight: {
    from: { x: 200, opacity: 0 },
    to: { x: 0, opacity: 1, duration: DURATIONS.slow, ease: EASINGS.backOut },
  },

  // Continuous animations
  float: {
    y: -12,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: EASINGS.sineInOut,
  },
  bounce: {
    y: 15,
    duration: 1,
    repeat: -1,
    yoyo: true,
    ease: EASINGS.sineInOut,
  },
  wiggle: {
    rotation: 5,
    y: -5,
    duration: 2,
    repeat: -1,
    yoyo: true,
    ease: EASINGS.sineInOut,
  },

  // Error/success feedback
  shake: {
    x: [-10, 10, -10, 10, 0],
    duration: 0.4,
    ease: EASINGS.smooth,
  },
  successPulse: {
    scale: 1.05,
    duration: DURATIONS.quick,
    repeat: 1,
    yoyo: true,
    ease: EASINGS.smooth,
  },
} as const;

/**
 * ScrollTrigger configuration presets
 */
export const SCROLL_TRIGGERS = {
  // Standard scroll reveal
  reveal: {
    start: 'top 85%',
    toggleActions: 'play none none reverse',
  },
  // Parallax effect
  parallax: {
    start: 'top bottom',
    end: 'bottom top',
    scrub: 1,
  },
  // Pin element while scrolling
  pin: {
    start: 'top top',
    end: 'bottom bottom',
    pin: true,
    scrub: true,
  },
} as const;

/**
 * Stagger configuration for GSAP
 */
export const STAGGER = {
  fast: 0.05,
  normal: 0.1,
  slow: 0.2,
  grid: { amount: 0.5, from: 'start' },
} as const;

/**
 * CSS animation class names (for Tailwind)
 */
export const CSS_ANIMATIONS = {
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  bounce: 'animate-bounce',
  spin: 'animate-spin',
  pulse: 'animate-pulse',
} as const;

export type AnimationPreset = keyof typeof ANIMATION_PRESETS;
export type Duration = keyof typeof DURATIONS;
export type Easing = keyof typeof EASINGS;
