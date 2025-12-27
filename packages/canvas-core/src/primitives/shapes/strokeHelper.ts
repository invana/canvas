/**
 * Stroke Helper Functions
 * 
 * Utilities for handling stroke styles (solid, dashed, dotted)
 * and dash patterns for shape outlines.
 * 
 * Note: PixiJS v8 doesn't fully support dash patterns in the public API yet.
 * This provides the infrastructure for when it becomes available, and
 * can be extended with custom implementations (e.g., using masks or shaders).
 */

import type { ShapeStyle, StrokeStyle } from './types.js';

/**
 * Predefined dash patterns for common stroke styles
 */
const DASH_PATTERNS: Record<StrokeStyle, number[] | null> = {
  solid: null,
  dashed: [8, 4],   // 8px dash, 4px gap
  dotted: [2, 3],   // 2px dot, 3px gap
};

/**
 * Get the dash pattern for a given stroke style
 * 
 * @param style - Shape style with stroke configuration
 * @returns Array of [dash, gap] lengths, or null for solid lines
 */
export function getStrokeDashPattern(
  style: Pick<ShapeStyle, 'strokeStyle' | 'strokeDashPattern'>
): number[] | null {
  // Custom pattern takes precedence
  if (style.strokeDashPattern && style.strokeDashPattern.length > 0) {
    return style.strokeDashPattern;
  }
  
  // Use predefined pattern based on strokeStyle
  const strokeStyle = style.strokeStyle ?? 'solid';
  return DASH_PATTERNS[strokeStyle];
}

/**
 * Apply stroke options with dash pattern consideration
 * 
 * @param style - Stroke style configuration
 * @returns Stroke options object for PixiJS Graphics.stroke()
 */
export function getStrokeOptions(
  style: Pick<ShapeStyle, 'stroke' | 'strokeWidth' | 'strokeAlpha' | 'strokeStyle' | 'strokeDashPattern' | 'strokeDashOffset' | 'strokeAlignment' | 'strokeCap'>
): any {
  const strokeOptions: any = {
    color: style.stroke ?? '#000000',
    width: style.strokeWidth ?? 1,
    alpha: style.strokeAlpha ?? 1,
  };
  
  // Add stroke alignment (0 = outside, 0.5 = centered, 1 = inside)
  if (style.strokeAlignment !== undefined) {
    strokeOptions.alignment = style.strokeAlignment;
  }
  
  // Add stroke cap (butt, round, square)
  if (style.strokeCap) {
    strokeOptions.cap = style.strokeCap;
  }
  
  // Check if dash pattern should be applied
  const dashPattern = getStrokeDashPattern(style);
  if (dashPattern) {
    // Future: When PixiJS supports dash arrays, they would be applied here
    // For now, we just adjust the cap style for better visual appearance
    if (!style.strokeCap) {
      strokeOptions.cap = 'butt';
    }
    strokeOptions.join = 'miter';
  }
  
  return strokeOptions;
}
