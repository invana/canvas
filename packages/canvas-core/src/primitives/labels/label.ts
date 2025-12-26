/**
 * Label Factory
 * Creates PixiJS Text objects with proper positioning and styling
 * 
 * Note: Unlike shape primitives that draw on Graphics, labels use Text objects
 * because text rendering in PixiJS uses the Text class, not Graphics.
 */

import { Text, TextStyle } from 'pixi.js';
import type { LabelParams, LabelStyle, ShapeBounds } from './types';
import { toPixiTextStyle, calculateLabelPosition, truncateText } from './types';

/**
 * Create a Text object with the given parameters and style
 */
export function createLabel(params: LabelParams, style: LabelStyle = {}): Text {
  const textStyle = new TextStyle(toPixiTextStyle(style));
  const displayText = params.maxWidth
    ? truncateText(params.text, Math.floor(params.maxWidth / (style.fontSize ?? 12)))
    : params.text;

  const text = new Text({ text: displayText, style: textStyle });
  text.x = params.x + (params.offsetX ?? 0);
  text.y = params.y + (params.offsetY ?? 0);

  return text;
}

/**
 * Create a label positioned relative to shape bounds
 */
export function createPositionedLabel(
  textContent: string,
  bounds: ShapeBounds,
  params: Omit<LabelParams, 'text' | 'x' | 'y'> = {},
  style: LabelStyle = {}
): Text {
  const pos = calculateLabelPosition(
    bounds,
    params.position ?? 'center',
    params.offsetX ?? 0,
    params.offsetY ?? 0
  );

  const textStyle = new TextStyle(toPixiTextStyle(style));
  const displayText = params.maxWidth
    ? truncateText(textContent, Math.floor(params.maxWidth / (style.fontSize ?? 12)))
    : textContent;

  const text = new Text({ text: displayText, style: textStyle });
  text.x = pos.x;
  text.y = pos.y;
  text.anchor.set(pos.anchorX, pos.anchorY);

  return text;
}

/**
 * Update an existing label's text and style
 */
export function updateLabel(
  label: Text,
  textContent: string,
  style?: LabelStyle
): void {
  label.text = textContent;
  if (style) {
    label.style = new TextStyle(toPixiTextStyle(style));
  }
}

/**
 * Reposition a label relative to shape bounds
 */
export function repositionLabel(
  label: Text,
  bounds: ShapeBounds,
  position: LabelParams['position'] = 'center',
  offsetX: number = 0,
  offsetY: number = 0
): void {
  const pos = calculateLabelPosition(bounds, position, offsetX, offsetY);
  label.x = pos.x;
  label.y = pos.y;
  label.anchor.set(pos.anchorX, pos.anchorY);
}

/**
 * Calculate label position for edge (along the path)
 */
export function calculateEdgeLabelPosition(
  from: { x: number; y: number },
  to: { x: number; y: number },
  position: number = 0.5,
  offset: number = 0
): { x: number; y: number; angle: number } {
  const x = from.x + (to.x - from.x) * position;
  const y = from.y + (to.y - from.y) * position;
  const angle = Math.atan2(to.y - from.y, to.x - from.x);

  // Offset perpendicular to the line
  const perpAngle = angle + Math.PI / 2;
  return {
    x: x + Math.cos(perpAngle) * offset,
    y: y + Math.sin(perpAngle) * offset,
    angle,
  };
}
