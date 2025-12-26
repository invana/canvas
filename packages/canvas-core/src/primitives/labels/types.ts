/**
 * Label Types
 * Types for text label creation and positioning
 */

import type { TextStyle as PixiTextStyle } from 'pixi.js';

/**
 * Label position relative to a shape
 */
export type LabelPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

/**
 * Label alignment
 */
export type LabelAlign = 'left' | 'center' | 'right';
export type LabelBaseline = 'top' | 'middle' | 'bottom';

/**
 * Style for text labels
 */
export interface LabelStyle {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter' | 'bolder';
  fontStyle?: 'normal' | 'italic' | 'oblique';
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  letterSpacing?: number;
  lineHeight?: number;
  wordWrap?: boolean;
  wordWrapWidth?: number;
  align?: LabelAlign;
}

/**
 * Parameters for creating a label
 */
export interface LabelParams {
  text: string;
  x: number;
  y: number;
  position?: LabelPosition;
  /** Offset from position */
  offsetX?: number;
  offsetY?: number;
  /** Maximum width before truncation */
  maxWidth?: number;
  /** Truncation suffix */
  ellipsis?: string;
}

/**
 * Bounds of a shape for label positioning
 */
export interface ShapeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Convert LabelStyle to PixiJS TextStyle options
 */
export function toPixiTextStyle(style: LabelStyle): Partial<PixiTextStyle> {
  return {
    fontFamily: style.fontFamily ?? 'Arial, sans-serif',
    fontSize: style.fontSize ?? 12,
    fontWeight: style.fontWeight ?? 'normal',
    fontStyle: style.fontStyle ?? 'normal',
    fill: style.fill ?? '#000000',
    stroke: style.stroke ? { color: style.stroke, width: style.strokeWidth ?? 0 } : undefined,
    letterSpacing: style.letterSpacing ?? 0,
    lineHeight: style.lineHeight,
    wordWrap: style.wordWrap ?? false,
    wordWrapWidth: style.wordWrapWidth ?? 200,
    align: style.align ?? 'left',
  };
}

/**
 * Calculate label position based on shape bounds and position type
 */
export function calculateLabelPosition(
  bounds: ShapeBounds,
  position: LabelPosition = 'center',
  offsetX: number = 0,
  offsetY: number = 0
): { x: number; y: number; anchorX: number; anchorY: number } {
  const { x, y, width, height } = bounds;
  const centerX = x + width / 2;
  const centerY = y + height / 2;

  switch (position) {
    case 'center':
      return { x: centerX + offsetX, y: centerY + offsetY, anchorX: 0.5, anchorY: 0.5 };
    case 'top':
      return { x: centerX + offsetX, y: y + offsetY, anchorX: 0.5, anchorY: 1 };
    case 'bottom':
      return { x: centerX + offsetX, y: y + height + offsetY, anchorX: 0.5, anchorY: 0 };
    case 'left':
      return { x: x + offsetX, y: centerY + offsetY, anchorX: 1, anchorY: 0.5 };
    case 'right':
      return { x: x + width + offsetX, y: centerY + offsetY, anchorX: 0, anchorY: 0.5 };
    case 'top-left':
      return { x: x + offsetX, y: y + offsetY, anchorX: 1, anchorY: 1 };
    case 'top-right':
      return { x: x + width + offsetX, y: y + offsetY, anchorX: 0, anchorY: 1 };
    case 'bottom-left':
      return { x: x + offsetX, y: y + height + offsetY, anchorX: 1, anchorY: 0 };
    case 'bottom-right':
      return { x: x + width + offsetX, y: y + height + offsetY, anchorX: 0, anchorY: 0 };
    default:
      return { x: centerX + offsetX, y: centerY + offsetY, anchorX: 0.5, anchorY: 0.5 };
  }
}

/**
 * Truncate text with ellipsis if it exceeds maxWidth
 * Note: This is a simple character-based estimation, actual pixel width
 * requires measuring with Canvas or PixiJS
 */
export function truncateText(
  text: string,
  maxChars: number,
  ellipsis: string = '...'
): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars - ellipsis.length) + ellipsis;
}
