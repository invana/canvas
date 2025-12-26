/**
 * ThemeManager - Manages themes and provides color/size defaults
 */

import type { ThemeConfig } from '../types';

const DEFAULT_THEME: ThemeConfig = {
  name: 'default',
  colors: {
    nodeFill: 0x4a90d9,
    nodeStroke: 0x2d5f8a,
    nodeSelectedFill: 0x66b3ff,
    nodeSelectedStroke: 0x0066cc,
    nodeHoverFill: 0x5a9fe9,
    nodeHoverStroke: 0x3d6f9a,
    edgeStroke: 0x888888,
    edgeSelectedStroke: 0x0066cc,
    edgeHoverStroke: 0x666666,
    background: 0xf5f5f5,
    labelText: 0x333333,
  },
  sizes: {
    nodeRadius: 20,
    nodeStrokeWidth: 2,
    edgeStrokeWidth: 2,
    arrowSize: 10,
    labelFontSize: 12,
  },
};

const DARK_THEME: ThemeConfig = {
  name: 'dark',
  colors: {
    nodeFill: 0x3d5a80,
    nodeStroke: 0x98c1d9,
    nodeSelectedFill: 0x5b8fb9,
    nodeSelectedStroke: 0xee6c4d,
    nodeHoverFill: 0x4a6f94,
    nodeHoverStroke: 0xaed1e9,
    edgeStroke: 0x666666,
    edgeSelectedStroke: 0xee6c4d,
    edgeHoverStroke: 0x888888,
    background: 0x1a1a2e,
    labelText: 0xe0e0e0,
  },
  sizes: {
    nodeRadius: 20,
    nodeStrokeWidth: 2,
    edgeStrokeWidth: 2,
    arrowSize: 10,
    labelFontSize: 12,
  },
};

const BUILT_IN_THEMES: Map<string, ThemeConfig> = new Map([
  ['default', DEFAULT_THEME],
  ['dark', DARK_THEME],
]);

export class ThemeManager {
  private readonly themes: Map<string, ThemeConfig> = new Map(BUILT_IN_THEMES);
  private _currentTheme: ThemeConfig;
  private readonly listeners: Set<(theme: ThemeConfig) => void> = new Set();

  constructor(initialTheme?: ThemeConfig | string) {
    if (typeof initialTheme === 'string') {
      this._currentTheme = this.themes.get(initialTheme) ?? DEFAULT_THEME;
    } else if (initialTheme) {
      this._currentTheme = initialTheme;
    } else {
      this._currentTheme = DEFAULT_THEME;
    }
  }

  /**
   * Get the current theme
   */
  get current(): ThemeConfig {
    return this._currentTheme;
  }

  /**
   * Set the current theme
   */
  setTheme(theme: ThemeConfig | string): void {
    if (typeof theme === 'string') {
      const found = this.themes.get(theme);
      if (!found) {
        throw new Error(`Theme "${theme}" not found`);
      }
      this._currentTheme = found;
    } else {
      this._currentTheme = theme;
    }
    this.notifyListeners();
  }

  /**
   * Register a custom theme
   */
  registerTheme(theme: ThemeConfig): void {
    this.themes.set(theme.name, theme);
  }

  /**
   * Get a theme by name
   */
  getTheme(name: string): ThemeConfig | undefined {
    return this.themes.get(name);
  }

  /**
   * Get all available theme names
   */
  getThemeNames(): string[] {
    return Array.from(this.themes.keys());
  }

  /**
   * Subscribe to theme changes
   */
  onThemeChange(callback: (theme: ThemeConfig) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this._currentTheme);
    }
  }

  /**
   * Get a color from the current theme
   */
  getColor(key: keyof ThemeConfig['colors']): number {
    return this._currentTheme.colors[key];
  }

  /**
   * Get a size from the current theme
   */
  getSize(key: keyof ThemeConfig['sizes']): number {
    return this._currentTheme.sizes[key];
  }
}
