// ── Animation specifications ──────────────────────────────────────────────────
// Animations are ADDITIVE — they modify fill/border/halo over time.
// They do not replace the base spec values.
// All animations are driven by AnimationTicker (app.ticker), never CSS.

// ── Border animations ─────────────────────────────────────────────────────────

/** Dashes march around the border perimeter on every frame */
export interface MarchingAntsAnimation {
  type: 'marchingAnts';
  /** Dash offset units per frame (default: 1) */
  speed?: number;
  /** Dash segment length in px (default: 8) */
  dashLength?: number;
  /** Gap between dashes in px (default: 6) */
  gapLength?: number;
  /** Override border color. Defaults to BorderSpec.color */
  color?: string;
}

/** Dashes flow in one direction only (not reversing at the end) */
export interface DashedFlowAnimation {
  type: 'dashedFlow';
  speed?: number;
  color?: string;
}

/** Border stroke width oscillates between minWidth and maxWidth */
export interface BorderGlowPulseAnimation {
  type: 'borderGlow';
  color?: string;
  minWidth?: number;
  maxWidth?: number;
  /** Duration of one oscillation cycle in ms (default: 1000) */
  duration?: number;
}

export type BorderAnimation =
  | MarchingAntsAnimation
  | DashedFlowAnimation
  | BorderGlowPulseAnimation;

// ── Body / fill animations ────────────────────────────────────────────────────

/**
 * Expanding ring radiates outward from the shape center.
 * Drawn on a HaloPool Graphics instance — does not touch the shape's own Graphics.
 */
export interface PulseAnimation {
  type: 'pulse';
  /** Ring color. Defaults to fill color */
  color?: string;
  /** How far the ring expands beyond the shape radius in px (default: 40) */
  maxRadius?: number;
  /** Duration of one pulse in ms (default: 1200) */
  duration?: number;
  repeat?: number | 'infinite';
}

/**
 * Shape scale oscillates slightly — a breathing / living effect.
 * Implemented via Container.scale, not a Graphics redraw.
 */
export interface BreatheAnimation {
  type: 'breathe';
  /** Max scale delta, e.g. 0.15 = ±15% (default: 0.1) */
  amplitude?: number;
  /** Duration of one full breathe cycle in ms (default: 2000) */
  duration?: number;
}

/** Fill color transitions through a list of colors over time */
export interface ColorCycleAnimation {
  type: 'colorCycle';
  colors: string[];
  /** Duration per color transition in ms (default: 800) */
  duration?: number;
}

/** Shape fades in from alpha 0 (or `from`) to full opacity */
export interface FadeInAnimation {
  type: 'fadeIn';
  /** Duration in ms (default: 400) */
  duration?: number;
  /** Starting alpha 0–1 (default: 0) */
  from?: number;
}

export type BodyAnimation =
  | PulseAnimation
  | BreatheAnimation
  | ColorCycleAnimation
  | FadeInAnimation;

// ── Combined ──────────────────────────────────────────────────────────────────

export interface ShapeAnimations {
  border?: BorderAnimation;
  body?: BodyAnimation;
}
