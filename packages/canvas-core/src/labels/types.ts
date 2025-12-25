/**
 * Label Types - Type definitions for the label system
 */

// ============================================================================
// Position Types
// ============================================================================

export type NodeLabelPosition =
  | 'center'
  | 'top'
  | 'bottom'
  | 'left'
  | 'right'
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type EdgeLabelPosition = 'start' | 'middle' | 'end';

// ============================================================================
// Style Types
// ============================================================================

export interface LabelTextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  fontStyle: 'normal' | 'italic';
  textColor: string;
  align: 'left' | 'center' | 'right';
  letterSpacing: number;
  lineHeight: number;
}

export interface LabelBackgroundStyle {
  backgroundColor: string | null;
  backgroundAlpha: number;
  padding: { x: number; y: number };
  borderRadius: number;
  borderColor: string | null;
  borderWidth: number;
}

export interface LabelStyle extends LabelTextStyle, LabelBackgroundStyle {
  visible: boolean;
  offset: { x: number; y: number };
  maxWidth: number | null;
  resolution: number;
  truncate: boolean;
  truncateLength: number;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface NodeLabelConfig {
  text: string;
  position: NodeLabelPosition;
  style?: Partial<LabelStyle>;
  states?: {
    hovered?: Partial<LabelStyle>;
    selected?: Partial<LabelStyle>;
    highlighted?: Partial<LabelStyle>;
    muted?: Partial<LabelStyle>;
  };
}

export interface EdgeLabelConfig {
  text: string;
  position: EdgeLabelPosition;
  style?: Partial<LabelStyle>;
  states?: {
    hovered?: Partial<LabelStyle>;
    selected?: Partial<LabelStyle>;
    highlighted?: Partial<LabelStyle>;
    muted?: Partial<LabelStyle>;
  };
}

// ============================================================================
// Default Styles
// ============================================================================

export const DEFAULT_LABEL_STYLE: LabelStyle = {
  // Text
  fontFamily: 'Arial, sans-serif',
  fontSize: 12,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textColor: '#333333',
  align: 'center',
  letterSpacing: 0,
  lineHeight: 1.2,

  // Background
  backgroundColor: null,
  backgroundAlpha: 1,
  padding: { x: 4, y: 2 },
  borderRadius: 3,
  borderColor: null,
  borderWidth: 0,

  // Visibility & Layout
  visible: true,
  offset: { x: 0, y: 0 },
  maxWidth: null,
  resolution: 4, // Use 4x resolution for crisp text on all displays
  truncate: false,
  truncateLength: 20,
};

export const DEFAULT_NODE_LABEL_STYLE: Partial<LabelStyle> = {
  ...DEFAULT_LABEL_STYLE,
  fontSize: 11,
};

export const DEFAULT_EDGE_LABEL_STYLE: Partial<LabelStyle> = {
  ...DEFAULT_LABEL_STYLE,
  fontSize: 10,
};

// ============================================================================
// Computed Types
// ============================================================================

export interface LabelBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface LabelMetrics {
  textWidth: number;
  textHeight: number;
  totalWidth: number;
  totalHeight: number;
}
