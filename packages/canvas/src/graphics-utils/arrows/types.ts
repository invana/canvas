/** Style for arrowhead shapes */
export interface ArrowStyle {
  fill?: string | number;
  fillAlpha?: number;
  stroke?: string | number;
  strokeWidth?: number;
  strokeAlpha?: number;
}

/** Position + orientation of an arrowhead */
export interface ArrowParams {
  /** Tip x coordinate */
  x: number;
  /** Tip y coordinate */
  y: number;
  /** Angle in radians (0 = pointing right) */
  angle: number;
  /** Overall size of the arrowhead in px */
  size: number;
}

export type ArrowType =
  | 'triangle'
  | 'triangle-outline'
  | 'triangleOutline'
  | 'thinTriangle'
  | 'diamond'
  | 'diamond-outline'
  | 'diamondOutline'
  | 'square'
  | 'square-outline'
  | 'squareOutline'
  | 'circle'
  | 'circle-outline'
  | 'circleOutline'
  | 'block'
  | 'classic'
  | 'ellipse'
  | 'cross'
  | 'async'
  | 'circle-plus'
  | 'none';
