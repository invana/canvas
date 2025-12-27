/**
 * Default label styling configuration
 * Centralized defaults for all label-related styles
 */

import type { LabelStyle, LabelPosition } from '../primitives/labels';

/**
 * Default label style for all text elements
 * Can be overridden at node/edge level or per instance
 */
export const DEFAULT_LABEL_STYLE: LabelStyle = {
  fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
  fill: '#000000',
  stroke: undefined,
  strokeWidth: 0,
  letterSpacing: 0,
  lineHeight: 1.2,
  wordWrap: false,
  wordWrapWidth: 200,
  align: 'center',
};

/**
 * Default label positioning
 */
export const DEFAULT_LABEL_POSITION: LabelPosition = 'center';

/**
 * Default label offsets
 */
export const DEFAULT_LABEL_OFFSET = {
  x: 0,
  y: 0,
};

/**
 * Label style variants for different use cases
 */
export const LABEL_VARIANTS = {
  /** Standard node label */
  node: {
    ...DEFAULT_LABEL_STYLE,
    fontSize: 12,
    fontWeight: 'normal',
  },
  
  /** Badge label (smaller, bold) */
  badge: {
    ...DEFAULT_LABEL_STYLE,
    fontSize: 10,
    fontWeight: 'bold',
    fill: '#ffffff',
  },
  
  /** Title/heading style */
  title: {
    ...DEFAULT_LABEL_STYLE,
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  /** Subtitle/secondary text */
  subtitle: {
    ...DEFAULT_LABEL_STYLE,
    fontSize: 10,
    fill: '#666666',
  },
  
  /** Edge label */
  edge: {
    ...DEFAULT_LABEL_STYLE,
    fontSize: 10,
    fill: '#666666',
  },
} as const;

/**
 * Merge user label style with defaults
 */
export function mergeLabelStyle(
  userStyle?: Partial<LabelStyle>
): LabelStyle {
  if (!userStyle) {
    return { ...DEFAULT_LABEL_STYLE };
  }
  return { ...DEFAULT_LABEL_STYLE, ...userStyle };
}
