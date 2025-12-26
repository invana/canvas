/**
 * Label Primitives Module
 * 
 * Functions for creating and positioning text labels.
 * 
 * Note: Labels use PixiJS Text objects rather than Graphics
 * because text rendering requires the Text class.
 * 
 * @example
 * ```typescript
 * import { createLabel, createPositionedLabel, calculateEdgeLabelPosition } from './primitives/labels';
 * 
 * // Create a simple label
 * const label = createLabel({ text: 'Hello', x: 100, y: 100 }, { fontSize: 14, fill: '#000' });
 * 
 * // Create a label positioned relative to a node
 * const nodeLabel = createPositionedLabel('Node 1', { x: 0, y: 0, width: 100, height: 60 }, { position: 'center' });
 * 
 * // Position label along an edge
 * const edgePos = calculateEdgeLabelPosition(from, to, 0.5, 10);
 * ```
 */

// Types
export type {
  LabelPosition,
  LabelAlign,
  LabelBaseline,
  LabelStyle,
  LabelParams,
  ShapeBounds,
} from './types';

export {
  toPixiTextStyle,
  calculateLabelPosition,
  truncateText,
} from './types';

// Label creation
export {
  createLabel,
  createPositionedLabel,
  updateLabel,
  repositionLabel,
  calculateEdgeLabelPosition,
} from './label';
