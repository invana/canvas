/**
 * Connector-anchored `LabelDecoration` — positions a text (or HTML text)
 * block at a `t` along the host path, with optional `pathOffset` shift along
 * the local tangent, screen-space `offset` applied post-rotation, and
 * `autoRotate` to align the label's baseline with the path direction.
 *
 * Tangent sampling: uses `samplePathAt(path, t)` which densifies the path
 * to a polyline and arc-length-walks to the requested `t`. Works uniformly
 * for every router / pathStyle the engine produces — straight, bezier,
 * smooth, rounded, orth, manhattan, bump-radial — because they all reduce
 * to the same `Path` (M/L/Q/C) command set.
 *
 * Per-frame cost: `tick` only runs when `autoRotate: true` or `visibility`
 * is configured. Static labels (`autoRotate: false`, no `visibility`) mount
 * once and never re-evaluate.
 */

import { Container, Graphics } from 'pixi.js';
import { ConnectorDecorationBase } from '../../base/ConnectorDecorationBase';
import { samplePathAt } from '@invana/canvas';
import {
  applyLabelResolution,
  mountLabelContent,
  updateLabelContent,
  type LabelContentView,
} from '../../paint/labelContent';
import { drawLabelBackground } from '../../paint/labelBackground';
import type { ConnectorLabelStyle } from '../../types';

export class LabelConnectorDecoration extends ConnectorDecorationBase<ConnectorLabelStyle> {
  private contentView: LabelContentView | null = null;
  private contentLayer: Container | null = null;
  private bgGfx: Graphics | null = null;
  private attached = true;
  private hostSurface: Container | null = null;
  /** See `LabelDecoration.resolution`. */
  private resolution: number | null = null;

  /** See `LabelDecoration.setResolution`. */
  setResolution(resolution: number): void {
    this.resolution = resolution;
    if (this.contentView) applyLabelResolution(this.contentView, resolution);
  }

  /** See `LabelDecoration.getResolution`. */
  getResolution(): number | null {
    return this.resolution;
  }

  protected repaint(): void {
    const host = this.host;
    if (!host) return;
    this.hostSurface = host.surface;

    if (!this.contentLayer) {
      this.contentLayer = new Container();
      this.contentLayer.label = 'label:content';
      this.gfx.addChild(this.contentLayer);
    }
    if (this.style.background && !this.bgGfx) {
      this.bgGfx = new Graphics();
      this.bgGfx.label = 'label:bg';
      this.contentLayer.addChildAt(this.bgGfx, 0);
    } else if (!this.style.background && this.bgGfx) {
      this.bgGfx.destroy();
      this.bgGfx = null;
    }

    if (!this.contentView) {
      this.contentView = mountLabelContent(this.style.content, this.style.wrap);
      this.contentLayer.addChild(this.contentView.display);
    } else {
      const next = updateLabelContent(this.contentView, this.style.content, this.style.wrap);
      if (next !== this.contentView) {
        this.contentLayer.addChild(next.display);
        this.contentView = next;
      }
    }
    if (this.resolution !== null) applyLabelResolution(this.contentView, this.resolution);

    const textW = this.contentView.display.width;
    const textH = this.contentView.display.height;
    if (this.style.background && this.bgGfx) {
      drawLabelBackground(this.bgGfx, this.style.background, { width: textW, height: textH });
      this.bgGfx.position.set(-textW / 2, -textH / 2);
    }
    this.contentView.display.position.set(-textW / 2, -textH / 2);

    this.gfx.alpha = this.style.alpha ?? 1;
    this.gfx.cursor = this.style.cursor ?? 'default';
    this.gfx.eventMode = this.style.interactive ? 'static' : 'none';

    this.positionOnPath();
  }

  /**
   * Re-position + re-rotate the label on the current host path. Called
   * during repaint and on every tick (cheap — one path sample + one
   * trigonometric op). Without `autoRotate` and `visibility` configured the
   * renderer never registers `tick` and this stays static.
   */
  private positionOnPath(): void {
    const host = this.host;
    if (!host) return;

    const placement = this.style.placement ?? 'center';
    const t = resolveT(placement);

    const sample = samplePathAt(host.path, t);
    let baseX = sample.point.x;
    let baseY = sample.point.y;

    // `pathOffset` shifts the anchor along the local tangent (positive =
    // toward target). Useful for "pad N px from source".
    const pathOffset = this.style.pathOffset ?? 0;
    if (pathOffset !== 0) {
      baseX += sample.tangent.x * pathOffset;
      baseY += sample.tangent.y * pathOffset;
    }

    let rotation = 0;
    if (this.style.autoRotate !== false) {
      let theta = Math.atan2(sample.tangent.y, sample.tangent.x);
      // Keep text upright: flip 180° when the tangent points "backwards" so
      // letters always read left-to-right.
      if (this.style.keepUpright !== false) {
        if (theta > Math.PI / 2) theta -= Math.PI;
        else if (theta < -Math.PI / 2) theta += Math.PI;
      }
      rotation = theta;
    }

    // Screen-space offset is applied *after* rotation — so `offset.y: -8`
    // always lifts the label perpendicular to the path direction, not in
    // raw world space.
    const offsetX = this.style.offset?.x ?? 0;
    const offsetY = this.style.offset?.y ?? 0;
    if (rotation !== 0 && (offsetX !== 0 || offsetY !== 0)) {
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      baseX += offsetX * cos - offsetY * sin;
      baseY += offsetX * sin + offsetY * cos;
    } else {
      baseX += offsetX;
      baseY += offsetY;
    }

    this.gfx.position.set(baseX, baseY);
    this.gfx.rotation = rotation;
  }

  tick(_deltaMs: number): boolean {
    const v = this.style.visibility;
    const wantsLOD = v && (v.minZoom !== undefined || v.maxZoom !== undefined);
    const wantsAutoRotate = this.style.autoRotate !== false;
    if (!wantsLOD && !wantsAutoRotate) return false;

    if (wantsLOD && v) {
      const z = effectiveScale(this.gfx);
      const shouldShow =
        (v.minZoom === undefined || z >= v.minZoom) &&
        (v.maxZoom === undefined || z <= v.maxZoom);
      if (shouldShow && !this.attached && this.hostSurface) {
        this.hostSurface.addChild(this.gfx);
        this.attached = true;
      } else if (!shouldShow && this.attached) {
        this.gfx.parent?.removeChild(this.gfx);
        this.attached = false;
      }
    }

    // Connector paths change shape whenever the host re-routes (e.g. an
    // endpoint moves). `update()` is invoked then with the fresh path and
    // repaint() re-positions us — but if `autoRotate` is on we also want
    // position to follow any per-frame visual changes (e.g. a layout that
    // tweens endpoints). Re-evaluate every tick.
    if (wantsAutoRotate) this.positionOnPath();

    return true;
  }
}

function resolveT(placement: NonNullable<ConnectorLabelStyle['placement']>): number {
  if (typeof placement === 'number') {
    if (placement < 0) return 0;
    if (placement > 1) return 1;
    return placement;
  }
  switch (placement) {
    case 'start': return 0;
    case 'end':   return 1;
    case 'center':
    default:      return 0.5;
  }
}

function effectiveScale(gfx: Container): number {
  let s = 1;
  let p: Container | null = gfx;
  while (p) {
    s *= p.scale.x;
    p = p.parent;
  }
  return s;
}
