// ── Border and Halo specifications ───────────────────────────────────────────
// Pure type definitions — no runtime code.

export interface BorderSpec {
  color: string;
  width: number;
  alpha?: number;
  /**
   * Optional dash pattern for the border stroke.
   * Set animated:true to drive via AnimationTicker (marching ants effect).
   */
  dash?: {
    length: number;
    gap: number;
    /** If true, AnimationTicker advances the dashOffset each frame */
    animated?: boolean;
    /** Dash offset units per frame (default: 1) */
    speed?: number;
  };
}

export interface HaloSpec {
  color: string;
  /** Extra radius beyond the shape boundary in world-space px */
  radius: number;
  alpha?: number;
  /**
   * If true, the halo pulses outward — driven by AnimationTicker.
   * Uses a radiating ripple drawn on a HaloPool Graphics instance.
   */
  animated?: boolean;
  /** Duration of one full pulse cycle in ms (default: 1500) */
  duration?: number;
}
