/**
 * Labels Module - Centralized label system for nodes and edges
 * 
 * Two label types available:
 * - Label (TextLabel): High-performance native PixiJS text, best for simple labels
 * - HTMLLabel: Rich HTML text using browser's native rendering, perfect quality but slightly heavier
 */

export { Label } from './Label.js';
export { Label as TextLabel } from './TextLabel.js';
export { HTMLLabel } from './HTMLLabel.js';
export { LabelRenderer, getLabelRenderer } from './LabelRenderer.js';
export type {
  NodeLabelPosition,
  EdgeLabelPosition,
  LabelStyle,
  LabelTextStyle,
  LabelBackgroundStyle,
  NodeLabelConfig,
  EdgeLabelConfig,
  LabelBounds,
  LabelMetrics,
} from './types.js';
export {
  DEFAULT_LABEL_STYLE,
  DEFAULT_NODE_LABEL_STYLE,
  DEFAULT_EDGE_LABEL_STYLE,
} from './types.js';
