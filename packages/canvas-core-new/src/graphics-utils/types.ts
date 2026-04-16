/** Minimal style shared by all graphics-utils drawing functions */
export interface DrawStyle {
  fill?: string | number;
  fillAlpha?: number;
  stroke?: string | number;
  strokeWidth?: number;
  strokeAlpha?: number;
}

/** Style for paths (lines, curves) */
export interface PathStyle {
  stroke?: string | number;
  strokeWidth?: number;
  strokeAlpha?: number;
}
