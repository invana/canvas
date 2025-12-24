/**
 * Theme Manager - Handles theme application and type-based styling
 */

import type { EdgeStyle, NodeStyle } from '../types/index.js';
import type { Theme, ThemeName } from '../types/theme.js';
import { lightTheme } from './themes/light.js';
import { darkTheme } from './themes/dark.js';

export class ThemeManager {
  private _currentTheme: Theme;
  private _themes: Map<string, Theme> = new Map();
  private _typeColors: Map<string, string> = new Map();
  private _colorIndex = 0;
  private _changeHandlers: ((theme: Theme) => void)[] = [];

  constructor(theme?: Theme | ThemeName) {
    // Register built-in themes
    this._themes.set('light', lightTheme);
    this._themes.set('dark', darkTheme);

    // Set initial theme
    if (typeof theme === 'string') {
      this._currentTheme = this._themes.get(theme) ?? lightTheme;
    } else if (theme) {
      this._currentTheme = theme;
    } else {
      this._currentTheme = lightTheme;
    }
  }

  // ============================================================================
  // Theme Management
  // ============================================================================

  get current(): Theme {
    return this._currentTheme;
  }

  get mode(): 'light' | 'dark' {
    return this._currentTheme.mode;
  }

  setTheme(theme: Theme | ThemeName): void {
    if (typeof theme === 'string') {
      const registered = this._themes.get(theme);
      if (!registered) {
        console.warn(`Theme "${theme}" not found, using light theme`);
        this._currentTheme = lightTheme;
      } else {
        this._currentTheme = registered;
      }
    } else {
      this._currentTheme = theme;
    }

    // Reset type colors when theme changes
    this._typeColors.clear();
    this._colorIndex = 0;

    this._notifyChange();
  }

  registerTheme(name: string, theme: Theme): void {
    this._themes.set(name, theme);
  }

  getTheme(name: string): Theme | undefined {
    return this._themes.get(name);
  }

  // ============================================================================
  // Node Type Styles
  // ============================================================================

  registerNodeType(type: string, style: Partial<NodeStyle>): void {
    if (!this._currentTheme.nodeTypes) {
      this._currentTheme.nodeTypes = {};
    }
    this._currentTheme.nodeTypes[type] = style;
  }

  getNodeStyle(type?: string): NodeStyle {
    const baseStyle = { ...this._currentTheme.node.default };

    if (type && this._currentTheme.nodeTypes?.[type]) {
      Object.assign(baseStyle, this._currentTheme.nodeTypes[type]);
    } else if (type && this._currentTheme.autoColor?.enabled) {
      baseStyle.fill = this._getTypeColor(type);
    }

    return baseStyle;
  }

  getNodeStateStyle(
    state: 'hovered' | 'selected' | 'highlighted' | 'muted' | 'locked' | 'disabled',
  ): Partial<NodeStyle> | undefined {
    return this._currentTheme.node[state];
  }

  // ============================================================================
  // Edge Type Styles
  // ============================================================================

  registerEdgeType(type: string, style: Partial<EdgeStyle>): void {
    if (!this._currentTheme.edgeTypes) {
      this._currentTheme.edgeTypes = {};
    }
    this._currentTheme.edgeTypes[type] = style;
  }

  getEdgeStyle(type?: string): EdgeStyle {
    const baseStyle = { ...this._currentTheme.edge.default };

    if (type && this._currentTheme.edgeTypes?.[type]) {
      Object.assign(baseStyle, this._currentTheme.edgeTypes[type]);
    }

    return baseStyle;
  }

  getEdgeStateStyle(
    state: 'hovered' | 'selected' | 'highlighted' | 'muted' | 'locked' | 'disabled',
  ): Partial<EdgeStyle> | undefined {
    return this._currentTheme.edge[state];
  }

  // ============================================================================
  // Auto Color
  // ============================================================================

  private _getTypeColor(type: string): string {
    if (this._typeColors.has(type)) {
      return this._typeColors.get(type)!;
    }

    const config = this._currentTheme.autoColor;
    if (!config?.enabled || !config.palette) {
      return this._currentTheme.node.default.fill ?? '#4CAF50';
    }

    let color: string;

    if (config.strategy === 'hash') {
      // Use hash of type name for consistent colors
      const hash = this._hashString(type);
      const index = hash % config.palette.length;
      color = config.palette[index]!;
    } else {
      // Sequential assignment
      color = config.palette[this._colorIndex % config.palette.length]!;
      this._colorIndex++;
    }

    this._typeColors.set(type, color);
    return color;
  }

  private _hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // ============================================================================
  // Colors
  // ============================================================================

  get colors() {
    return { ...this._currentTheme.colors };
  }

  getColor(name: keyof Theme['colors']): string {
    return this._currentTheme.colors[name];
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  onChange(handler: (theme: Theme) => void): () => void {
    this._changeHandlers.push(handler);
    return () => {
      const index = this._changeHandlers.indexOf(handler);
      if (index >= 0) {
        this._changeHandlers.splice(index, 1);
      }
    };
  }

  private _notifyChange(): void {
    for (const handler of this._changeHandlers) {
      handler(this._currentTheme);
    }
  }
}
