/**
 * Label - High-performance native text label using PixiJS Text
 * Optimized for performance with proper resolution and antialiasing
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { LabelStyle, LabelMetrics } from './types.js';
import { DEFAULT_LABEL_STYLE } from './types.js';

export class Label {
  private _container: Container;
  private _background: Graphics;
  private _text: Text;
  private _style: LabelStyle;
  private _currentText: string;
  private _dirty = true;
  private _metrics: LabelMetrics | null = null;

  constructor(text: string, style?: Partial<LabelStyle>) {
    this._currentText = text;
    this._style = { ...DEFAULT_LABEL_STYLE, ...style };

    // Create container
    this._container = new Container();
    this._container.label = 'label';
    this._container.eventMode = 'none'; // Labels don't receive events

    // Create background (rendered first)
    this._background = new Graphics();
    this._container.addChild(this._background);

    // Get device pixel ratio for crisp text
    const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
    const resolution = Math.max(this._style.resolution, dpr * 2);

    // Create text with high resolution for crisp rendering
    this._text = new Text({
      text: this._truncateText(text),
      style: this._createTextStyle(),
      resolution, // High resolution for crisp text
      roundPixels: true, // Snap to pixel grid
    });
    this._container.addChild(this._text);

    // Initial render
    this._render();
  }

  // ============================================================================
  // Public Accessors
  // ============================================================================

  get container(): Container {
    return this._container;
  }

  get visible(): boolean {
    return this._container.visible;
  }

  set visible(value: boolean) {
    this._container.visible = value;
  }

  get text(): string {
    return this._currentText;
  }

  get metrics(): LabelMetrics {
    if (!this._metrics) {
      this._calculateMetrics();
    }
    return this._metrics!;
  }

  get width(): number {
    return this.metrics.totalWidth;
  }

  get height(): number {
    return this.metrics.totalHeight;
  }

  // ============================================================================
  // Public Methods
  // ============================================================================

  setText(text: string): void {
    if (this._currentText === text) return;
    this._currentText = text;
    this._text.text = this._truncateText(text);
    this._dirty = true;
    this._metrics = null;
    this._render();
  }

  setStyle(style: Partial<LabelStyle>): void {
    const oldStyle = this._style;
    this._style = { ...this._style, ...style };

    // Check if text style changed
    if (
      oldStyle.fontFamily !== this._style.fontFamily ||
      oldStyle.fontSize !== this._style.fontSize ||
      oldStyle.fontWeight !== this._style.fontWeight ||
      oldStyle.fontStyle !== this._style.fontStyle ||
      oldStyle.textColor !== this._style.textColor ||
      oldStyle.letterSpacing !== this._style.letterSpacing
    ) {
      this._text.style = this._createTextStyle();
      this._metrics = null;
    }

    // Check if resolution changed
    if (oldStyle.resolution !== this._style.resolution) {
      const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
      this._text.resolution = Math.max(this._style.resolution, dpr * 2);
    }

    // Check if truncation settings changed
    if (
      oldStyle.truncate !== this._style.truncate ||
      oldStyle.truncateLength !== this._style.truncateLength ||
      oldStyle.maxWidth !== this._style.maxWidth
    ) {
      this._text.text = this._truncateText(this._currentText);
      this._metrics = null;
    }

    this._dirty = true;
    this._render();
  }

  setPosition(x: number, y: number): void {
    this._container.position.set(x, y);
  }

  /**
   * Position the label relative to a point with anchor
   */
  positionAt(x: number, y: number, anchorX = 0.5, anchorY = 0.5): void {
    const offsetX = this.width * anchorX;
    const offsetY = this.height * anchorY;
    this._container.position.set(
      x - offsetX + this._style.offset.x,
      y - offsetY + this._style.offset.y,
    );
  }

  destroy(): void {
    this._container.destroy({ children: true });
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private _createTextStyle(): TextStyle {
    return new TextStyle({
      fontFamily: this._style.fontFamily,
      fontSize: this._style.fontSize,
      fontWeight: this._style.fontWeight,
      fontStyle: this._style.fontStyle,
      fill: this._style.textColor,
      align: this._style.align,
      letterSpacing: this._style.letterSpacing,
      lineHeight: this._style.fontSize * this._style.lineHeight,
      wordWrap: this._style.maxWidth !== null,
      wordWrapWidth: this._style.maxWidth ?? undefined,
    });
  }

  private _truncateText(text: string): string {
    if (!this._style.truncate || text.length <= this._style.truncateLength) {
      return text;
    }
    return text.substring(0, this._style.truncateLength - 3) + '...';
  }

  private _calculateMetrics(): void {
    const textBounds = this._text.getBounds();
    const padding = this._style.padding;

    this._metrics = {
      textWidth: textBounds.width,
      textHeight: textBounds.height,
      totalWidth: textBounds.width + padding.x * 2,
      totalHeight: textBounds.height + padding.y * 2,
    };
  }

  private _render(): void {
    if (!this._dirty) return;
    this._dirty = false;

    // Ensure metrics are calculated
    if (!this._metrics) {
      this._calculateMetrics();
    }

    const { totalWidth, totalHeight } = this._metrics!;
    const { padding, borderRadius, borderColor, borderWidth, backgroundColor, backgroundAlpha } = this._style;

    // Clear and redraw background
    this._background.clear();

    // Draw background if we have a background style
    if (backgroundColor || borderColor) {
      // Background fill
      if (backgroundColor) {
        this._background.roundRect(0, 0, totalWidth, totalHeight, borderRadius);
        this._background.fill({ color: backgroundColor, alpha: backgroundAlpha });
      }

      // Border
      if (borderColor && borderWidth > 0) {
        this._background.roundRect(0, 0, totalWidth, totalHeight, borderRadius);
        this._background.stroke({ color: borderColor, width: borderWidth });
      }
    }

    // Position text within background (centered with padding)
    this._text.position.set(padding.x, padding.y);

    // Update visibility
    this._container.visible = this._style.visible;
  }
}
