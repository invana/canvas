/**
 * Theme type definitions
 */

import type { EdgeStyle, NodeStyle } from './index.js';

export interface ThemeColors {
  background: string;
  primary: string;
  secondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  text: string;
  textMuted: string;
  border: string;
}

export interface AutoColorConfig {
  enabled: boolean;
  palette?: string[];
  strategy?: 'hash' | 'sequential';
}

export interface Theme {
  name: string;
  mode: 'light' | 'dark';

  colors: ThemeColors;

  // Default styles
  node: {
    default: NodeStyle;
    hovered?: Partial<NodeStyle>;
    selected?: Partial<NodeStyle>;
    highlighted?: Partial<NodeStyle>;
    muted?: Partial<NodeStyle>;
    locked?: Partial<NodeStyle>;
    disabled?: Partial<NodeStyle>;
  };

  edge: {
    default: EdgeStyle;
    hovered?: Partial<EdgeStyle>;
    selected?: Partial<EdgeStyle>;
    highlighted?: Partial<EdgeStyle>;
    muted?: Partial<EdgeStyle>;
    locked?: Partial<EdgeStyle>;
    disabled?: Partial<EdgeStyle>;
  };

  // Type-specific styles
  nodeTypes?: Record<string, Partial<NodeStyle>>;
  edgeTypes?: Record<string, Partial<EdgeStyle>>;

  // Auto-generate colors for unknown types
  autoColor?: AutoColorConfig;
}

export type ThemeName = 'light' | 'dark' | string;
