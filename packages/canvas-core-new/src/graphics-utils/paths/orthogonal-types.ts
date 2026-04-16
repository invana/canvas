/** Direction hint for orthogonal routing */
export type Direction = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface OrthogonalStyle {
  stroke?: string | number;
  strokeWidth?: number;
  strokeAlpha?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
}

export interface OrthogonalPoint { x: number; y: number; }
