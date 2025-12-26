/**
 * Fill System - Index
 * 
 * Comprehensive fill system for shapes supporting:
 * - Solid colors (backward compatible with existing string/number fills)
 * - Linear gradients
 * - Radial gradients
 * - Image/texture fills (clipped to shape)
 * - Pattern fills (repeating textures)
 * 
 * ## Usage Examples
 * 
 * ### Solid Color (backward compatible)
 * ```typescript
 * { fill: '#4CAF50' }  // Old way - still works
 * { fill: { type: 'solid', color: '#4CAF50', alpha: 0.8 } }  // New way
 * ```
 * 
 * ### Linear Gradient
 * ```typescript
 * {
 *   fill: {
 *     type: 'linear',
 *     x0: 0, y0: 0,  // Start at top-left
 *     x1: 1, y1: 1,  // End at bottom-right
 *     stops: [
 *       { offset: 0, color: '#FF6B6B' },
 *       { offset: 1, color: '#4ECDC4' }
 *     ]
 *   }
 * }
 * ```
 * 
 * ### Radial Gradient
 * ```typescript
 * {
 *   fill: {
 *     type: 'radial',
 *     x: 0.5, y: 0.5,  // Center
 *     radius: 0.8,
 *     stops: [
 *       { offset: 0, color: '#FFE66D' },
 *       { offset: 1, color: '#FF6B6B' }
 *     ]
 *   }
 * }
 * ```
 * 
 * ### Image Fill
 * ```typescript
 * {
 *   fill: {
 *     type: 'image',
 *     src: '/path/to/image.png',  // or base64 or Texture
 *     fit: 'cover',  // 'fill' | 'contain' | 'cover' | 'none'
 *     alignX: 0.5,   // Center horizontally
 *     alignY: 0.5,   // Center vertically
 *     alpha: 1.0,
 *     tint: 0xFFFFFF  // Optional color tint
 *   }
 * }
 * ```
 * 
 * ### Pattern Fill
 * ```typescript
 * {
 *   fill: {
 *     type: 'pattern',
 *     src: '/path/to/pattern.png',
 *     repeat: 'repeat',  // 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
 *     scale: 0.5,
 *     alpha: 1.0
 *   }
 * }
 * ```
 */

// Types
export type {
  Fill,
  SolidFill,
  LinearGradientFill,
  RadialGradientFill,
  ImageFill,
  PatternFill,
  FillBounds,
  ColorStop,
} from './types.js';

export {
  isSolidFill,
  isLinearGradientFill,
  isRadialGradientFill,
  isImageFill,
  isPatternFill,
  normalizeFill,
} from './types.js';

// High-level fill resolver (used by shapes)
export { applyFill, applyFillSync } from './fillResolver.js';

// Shape fill helper (located in shapes directory)
export { applyShapeFill } from '../shapes/fillHelper.js';

// Low-level gradient primitives (reusable by nodes and edges)
export {
  createLinearGradient,
  createRadialGradient,
  createLineGradient,
  createPointGradient,
} from './gradients.js';

// Low-level image primitives (reusable by nodes)
export {
  calculateImageMatrix,
  loadImageTexture,
  applyImageFill as applyImageFillPrimitive,
  applyImageFillAsync,
} from './images.js';
