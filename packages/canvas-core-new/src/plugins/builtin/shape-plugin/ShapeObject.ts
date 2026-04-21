// ── ShapeObject ───────────────────────────────────────────────────────────────
// Owns one Graphics instance per visible shape.
// Created when a shape enters the viewport, reused across re-entries.
// fill + border are drawn together in a single Graphics pass per frame.

import { Container, Graphics, Text, TextStyle, FillGradient, Texture } from 'pixi.js';
import type { ShapeSpec, ShapeBBox } from './spec/shapes.js';
import { computeBBox } from './spec/shapes.js';
import type { FillSpec } from './spec/fills.js';
import type { BorderSpec } from './spec/border-halo.js';
import type { ShapeAnimations } from './spec/animations.js';
import { RenderDetail } from './LODController.js';
import { TextureRegistry } from './TextureRegistry.js';
import {
  drawCircle, drawEllipse, drawRect, drawPolygon, drawStar,
  drawLine, drawBezier, drawAutoBezier, drawDashedLine, drawDottedLine,
  drawDashedCircle, drawDottedCircle, drawDashedRect, drawDottedRect,
  drawOrthogonalPath, drawRoundedOrthogonalPath,
  drawCircleGlow, drawRippleRing,
  drawTriangleArrow, drawTriangleOutlineArrow, drawThinTriangleArrow,
  drawDiamondArrow, drawDiamondOutlineArrow,
  drawSquareArrow, drawSquareOutlineArrow,
  drawCircleArrow, drawCircleOutlineArrow,
} from '../../../graphics-utils/index.js';
import type { DashStyle } from '../../../graphics-utils/shapes/dashed.js';
import type { PathStyle } from '../../../graphics-utils/types.js';
import type { EffectStyle } from '../../../graphics-utils/effects/types.js';

export class ShapeObject {
  readonly id: string;
  spec: ShapeSpec;
  bbox: ShapeBBox;

  /** Mutable animation state — set by AnimationTicker */
  animations: ShapeAnimations = {};

  /** Ticker-driven animation state (internal) */
  _animState: {
    dashOffset: number;
    pulseProgress: number;
    breathePhase: number;
    colorCyclePhase: number;
    fadeAlpha: number;
    borderGlowPhase: number;
    startTime: number;
  } = {
    dashOffset: 0,
    pulseProgress: 0,
    breathePhase: 0,
    colorCyclePhase: 0,
    fadeAlpha: 1,
    borderGlowPhase: 0,
    startTime: 0,
  };

  // PixiJS objects — created lazily, never destroyed on viewport exit
  private _container: Container;
  private _g: Graphics;
  private _label: Text | null = null;

  constructor(spec: ShapeSpec) {
    this.id = spec.id;
    this.spec = spec;
    this.bbox = computeBBox(spec);

    this._container = new Container();
    this._g = new Graphics();
    this._container.addChild(this._g);

    if (spec.zIndex !== undefined) {
      this._container.zIndex = spec.zIndex;
    }
  }

  /** The PixiJS Container to add/remove from the scene */
  get container(): Container {
    return this._container;
  }

  /**
   * Full redraw. Called when:
   * - shape first enters viewport
   * - spec is updated via ShapePlugin.update()
   * - LOD level changes
   * - animation tick (for animated shapes — passes updated dashOffset etc.)
   */
  draw(detail: RenderDetail): void {
    const spec = this.spec;
    this._g.clear();

    // DOT mode — skip everything, draw a minimal 2px dot
    if (detail === RenderDetail.DOT) {
      this._g.circle(this._cx(), this._cy(), 2);
      this._g.fill({ color: this._dotColor() });
      this._syncLabel(false);
      return;
    }

    // ── Apply breathe scale (scale transform, no redraw needed) ──────────────
    if (this.animations.body?.type === 'breathe') {
      const amp = this.animations.body.amplitude ?? 0.1;
      const scale = 1 + Math.sin(this._animState.breathePhase) * amp;
      this._container.scale.set(scale);
    } else {
      this._container.scale.set(1);
    }

    // ── Apply fade alpha ──────────────────────────────────────────────────────
    if (this.animations.body?.type === 'fadeIn') {
      this._container.alpha = this._animState.fadeAlpha;
    } else {
      this._container.alpha = 1;
    }

    // ── Draw fill + shape geometry ────────────────────────────────────────────
    this._drawFillAndShape(spec, detail);

    // ── Draw border (with animated dash offset if marching ants) ─────────────
    if (detail >= RenderDetail.FILL_BORDER && spec.border) {
      this._drawBorder(spec.border);
    }

    // ── Label (DETAIL level only) ─────────────────────────────────────────────
    this._syncLabel(detail === RenderDetail.DETAIL);
  }

  /** Partial update: merge new spec fields, recompute bbox, redraw */
  update(partial: Record<string, unknown>, detail: RenderDetail): void {
    this.spec = { ...this.spec, ...partial } as ShapeSpec;
    this.bbox = computeBBox(this.spec);
    this.draw(detail);
  }

  /** Precise geometric hit-test for a world-space point */
  hitTest(wx: number, wy: number): boolean {
    const spec = this.spec;
    switch (spec.type) {
      case 'circle':
      case 'dashedCircle':
      case 'dottedCircle': {
        const dx = wx - spec.x, dy = wy - spec.y;
        return dx * dx + dy * dy <= spec.radius * spec.radius;
      }
      case 'rect':
      case 'dashedRect':
      case 'dottedRect':
        return wx >= spec.x && wx <= spec.x + spec.width && wy >= spec.y && wy <= spec.y + spec.height;
      case 'ellipse': {
        const dx = (wx - spec.x) / spec.radiusX, dy = (wy - spec.y) / spec.radiusY;
        return dx * dx + dy * dy <= 1;
      }
      default:
        // For paths and complex shapes use bbox as the hit region
        return wx >= this.bbox.minX && wx <= this.bbox.maxX && wy >= this.bbox.minY && wy <= this.bbox.maxY;
    }
  }

  destroy(): void {
    this._container.destroy({ children: true });
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _cx(): number {
    const s = this.spec;
    if ('x' in s) return (s as { x: number }).x;
    if ('from' in s) return ((s as { from: { x: number } }).from.x + (s as { to: { x: number } }).to.x) / 2;
    if ('params' in s && 'x' in (s as { params: { x: number } }).params) return (s as { params: { x: number } }).params.x;
    return 0;
  }

  private _cy(): number {
    const s = this.spec;
    if ('y' in s) return (s as { y: number }).y;
    if ('from' in s) return ((s as { from: { y: number } }).from.y + (s as { to: { y: number } }).to.y) / 2;
    if ('params' in s && 'y' in (s as { params: { y: number } }).params) return (s as { params: { y: number } }).params.y;
    return 0;
  }

  private _dotColor(): string {
    const fill = this.spec.fill;
    if (!fill) return '#888888';
    if (fill.type === 'solid') return fill.color;
    if (fill.type === 'linear' || fill.type === 'radial') return fill.stops[0]?.color ?? '#888888';
    return '#888888';
  }

  private _resolveFill(fill: FillSpec | undefined): string | FillGradient | Texture | undefined {
    if (!fill) return undefined;
    switch (fill.type) {
      case 'solid':   return fill.color;
      case 'linear': {
        const grad = new FillGradient(0, 0, 1, 0);
        fill.stops.forEach(s => grad.addColorStop(s.offset, s.color));
        return grad;
      }
      case 'radial': {
        // PixiJS 8 FillGradient is linear-only; approximate radial with a diagonal linear
        const grad = new FillGradient(0.5, 0, 0.5, 1);
        fill.stops.forEach(s => grad.addColorStop(s.offset, s.color));
        return grad;
      }
      case 'texture':
      case 'icon': {
        const tex = TextureRegistry.get(fill.src);
        return tex ?? undefined;
      }
    }
  }

  private _drawFillAndShape(spec: ShapeSpec, _detail: RenderDetail): void {
    const fillValue = this._resolveFill(spec.fill);
    const fillAlpha = spec.fill && 'alpha' in spec.fill ? (spec.fill as { alpha?: number }).alpha ?? 1 : 1;
    const solidStyle = fillValue !== undefined ? { fill: fillValue, fillAlpha } : {};

    // ColorCycle overrides fill color
    if (this.animations.body?.type === 'colorCycle') {
      const colors = this.animations.body.colors;
      if (colors.length > 0) {
        const idx = Math.floor(this._animState.colorCyclePhase) % colors.length;
        (solidStyle as Record<string, unknown>).fill = colors[idx] as string;
      }
    }

    // Style for dashed/dotted shapes — driven by spec.border
    const dashStyle: DashStyle = {
      color: spec.border?.color ?? '#ffffff',
      strokeWidth: spec.border?.width ?? 1,
      alpha: spec.border?.alpha ?? 1,
      dashLength: spec.border?.dash?.length,
      gapLength: spec.border?.dash?.gap,
      offset: this._animState.dashOffset,
    };

    // Style for path shapes (line, bezier, etc.) — driven by spec.border
    const pathStyle: PathStyle = {
      stroke: spec.border?.color ?? '#ffffff',
      strokeWidth: spec.border?.width ?? 1,
      strokeAlpha: spec.border?.alpha ?? 1,
    };

    // Style for orthogonal shapes (superset of PathStyle — missing props are optional)
    const orthStyle = pathStyle;

    // Style for effect shapes (circleGlow, rippleRing)
    const effectStyle: EffectStyle = {
      color: this._dotColor() as string | number,
      alpha: spec.fill && 'alpha' in spec.fill ? (spec.fill as { alpha?: number }).alpha ?? 1 : 1,
      strokeWidth: spec.border?.width,
    };

    switch (spec.type) {
      case 'circle':        drawCircle(this._g, spec.x, spec.y, spec.radius, solidStyle); break;
      case 'ellipse':       drawEllipse(this._g, spec.x, spec.y, spec.radiusX, spec.radiusY, solidStyle); break;
      case 'rect':          drawRect(this._g, spec.x, spec.y, spec.width, spec.height, { ...solidStyle, cornerRadius: spec.cornerRadius }); break;
      case 'polygon':       drawPolygon(this._g, spec.x, spec.y, spec.radius, spec.sides, { ...solidStyle, rotation: spec.rotation }); break;
      case 'star':          drawStar(this._g, spec.x, spec.y, spec.radius, { ...solidStyle, points: spec.points, innerRatio: spec.innerRatio, rotation: spec.rotation }); break;
      case 'dashedCircle':  drawDashedCircle(this._g, spec.x, spec.y, spec.radius, dashStyle); break;
      case 'dottedCircle':  drawDottedCircle(this._g, spec.x, spec.y, spec.radius, dashStyle); break;
      case 'dashedRect':    drawDashedRect(this._g, spec.x, spec.y, spec.width, spec.height, dashStyle); break;
      case 'dottedRect':    drawDottedRect(this._g, spec.x, spec.y, spec.width, spec.height, dashStyle); break;
      case 'line':          drawLine(this._g, spec.x1, spec.y1, spec.x2, spec.y2, pathStyle); break;
      case 'dashedLine':    drawDashedLine(this._g, spec.x1, spec.y1, spec.x2, spec.y2, dashStyle); break;
      case 'dottedLine':    drawDottedLine(this._g, spec.x1, spec.y1, spec.x2, spec.y2, dashStyle); break;
      case 'bezier':        drawBezier(this._g, spec.from, spec.cp1, spec.to, pathStyle, spec.cp2); break;
      case 'autoBezier':    drawAutoBezier(this._g, spec.from, spec.to, pathStyle, spec.curvature); break;
      case 'orthogonal':    drawOrthogonalPath(this._g, spec.params, orthStyle); break;
      case 'roundedOrthogonal': drawRoundedOrthogonalPath(this._g, spec.params, orthStyle); break;
      case 'circleGlow':    drawCircleGlow(this._g, { x: spec.x, y: spec.y, radius: spec.radius, glowSize: 20, ...spec.params }, effectStyle); break;
      case 'rippleRing':    drawRippleRing(this._g, spec.x, spec.y, spec.radius, effectStyle); break;
      case 'arrow':         this._drawArrow(spec); break;
      case 'label':         break; // handled by _syncLabel
    }
  }

  private _drawBorder(border: BorderSpec): void {
    let dashOffset = 0;
    if (border.dash?.animated && this.animations.border?.type === 'marchingAnts') {
      dashOffset = this._animState.dashOffset;
    }

    const strokeWidth = this.animations.border?.type === 'borderGlow'
      ? this._computeGlowWidth()
      : border.width;

    const color = (this.animations.border && 'color' in this.animations.border && this.animations.border.color)
      ? this.animations.border.color
      : border.color;

    if (border.dash) {
      drawDashedLine(this._g, this._cx(), this._cy(), this._cx(), this._cy(), {
        color, strokeWidth, dashLength: border.dash.length, gapLength: border.dash.gap, offset: dashOffset,
      });
    } else {
      // Re-apply stroke over the already-drawn shape path
      this._g.stroke({ color, width: strokeWidth, alpha: border.alpha ?? 1 });
    }
  }

  private _computeGlowWidth(): number {
    const anim = this.animations.border;
    if (anim?.type !== 'borderGlow') return this.spec.border?.width ?? 1;
    const min = anim.minWidth ?? 1;
    const max = anim.maxWidth ?? 6;
    return min + (Math.sin(this._animState.borderGlowPhase) * 0.5 + 0.5) * (max - min);
  }

  private _drawArrow(spec: import('./spec/shapes.js').ArrowSpec): void {
    const style = { fill: this._dotColor(), stroke: this.spec.border?.color };
    switch (spec.arrowType) {
      case 'triangle':         drawTriangleArrow(this._g, spec.params, style); break;
      case 'triangleOutline':  drawTriangleOutlineArrow(this._g, spec.params, style); break;
      case 'thinTriangle':     drawThinTriangleArrow(this._g, spec.params, style); break;
      case 'diamond':          drawDiamondArrow(this._g, spec.params, style); break;
      case 'diamondOutline':   drawDiamondOutlineArrow(this._g, spec.params, style); break;
      case 'square':           drawSquareArrow(this._g, spec.params, style); break;
      case 'squareOutline':    drawSquareOutlineArrow(this._g, spec.params, style); break;
      case 'circle':           drawCircleArrow(this._g, spec.params, style); break;
      case 'circleOutline':    drawCircleOutlineArrow(this._g, spec.params, style); break;
    }
  }

  private _syncLabel(visible: boolean): void {
    if (!visible) {
      if (this._label) this._label.visible = false;
      return;
    }
    const spec = this.spec;
    if (spec.type !== 'label') {
      if (this._label) this._label.visible = false;
      return;
    }
    if (!this._label) {
      this._label = new Text({
        text: spec.text,
        style: new TextStyle({
          fontSize: spec.fontSize ?? 14,
          fontFamily: spec.fontFamily ?? 'sans-serif',
          fill: spec.color ?? '#ffffff',
        }),
      });
      this._label.anchor.set(0.5, 0.5);
      this._container.addChild(this._label);
    }
    this._label.text = spec.text;
    this._label.position.set(spec.x, spec.y);
    this._label.visible = true;
  }
}
