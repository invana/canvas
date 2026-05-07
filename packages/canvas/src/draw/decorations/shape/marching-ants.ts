/**
 * `marching-ants` — animated shape decoration: dashed outline with a
 * scrolling dash offset (the classic "selection ants" effect).
 *
 * Heavy work (sample the outline, measure perimeter, snap dash/gap so
 * `perimeter = N * (dashLen + gapLen)`) is cached on `update` and reused on
 * every `tick`.
 *
 * Outline source priority:
 * 1. circle / ellipse host: arc-sampled ellipse perimeter
 * 2. host with `outlinePolyline`: parallel-offset polygon (true shape-
 *    following ants for stars, triangles, paths)
 * 3. fallback: AABB rect, optionally rounded
 */

import type { Container, Graphics } from 'pixi.js';
import type { AnimatedDecoration, Point, Rect } from '../../types';
import {
  drawDashedPolylineClosed,
  offsetPolygon,
} from '../_polylineUtils';

export interface MarchingAntsOpts {
  readonly color: number;
  readonly width?: number;
  readonly alpha?: number;
  readonly dashLength?: number;
  readonly gapLength?: number;
  /** Pixels per ms the offset advances. Default `0.04`. */
  readonly speed?: number;
  readonly inset?: number;
  /**
   * Rounded corner radius for rect-like hosts. Default `0` (sharp).
   * Outer radius is `cornerRadius + inset`.
   */
  readonly cornerRadius?: number;
}

const ARC_STEP = 0.05;
type Pt = { x: number; y: number };

export class MarchingAntsDecoration implements AnimatedDecoration {
  private bounds: Rect = { x: 0, y: 0, width: 0, height: 0 };
  private hostKind?: string;
  private outlinePolyline?: ReadonlyArray<Point>;
  private offset = 0;

  // Cache — populated by `update()`, reused by `tick()`.
  private cachedSamples: Pt[] = [];
  private snappedDash = 0;
  private snappedGap = 0;

  constructor(
    _slot: Container,
    private readonly g: Graphics,
    private readonly opts: MarchingAntsOpts,
  ) {}

  update(
    bounds: Rect,
    hostKind?: string,
    outlinePolyline?: ReadonlyArray<Point>,
  ): void {
    this.bounds = bounds;
    this.hostKind = hostKind;
    this.outlinePolyline = outlinePolyline;
    this.rebuildCache();
    this.redraw();
  }

  tick(deltaMs: number): boolean {
    const speed = this.opts.speed ?? 0.04;
    const cycle = this.snappedDash + this.snappedGap;
    if (cycle <= 0) return true;
    this.offset = (this.offset + speed * deltaMs) % cycle;
    if (this.offset < 0) this.offset += cycle;
    this.redraw();
    return true;
  }

  destroy(): void {
    this.g.clear();
  }

  private rebuildCache(): void {
    const inset = this.opts.inset ?? 2;
    const cornerRadius = this.opts.cornerRadius ?? 0;
    const dash = this.opts.dashLength ?? 6;
    const gap = this.opts.gapLength ?? 4;

    this.cachedSamples = sampleOutline(
      this.bounds,
      this.hostKind,
      inset,
      cornerRadius,
      this.outlinePolyline,
    );

    let perimeter = 0;
    const s = this.cachedSamples;
    for (let i = 0; i < s.length - 1; i++) {
      perimeter += Math.hypot(s[i + 1]!.x - s[i]!.x, s[i + 1]!.y - s[i]!.y);
    }
    const cycle = dash + gap;
    if (perimeter > 0 && cycle > 0) {
      const n = Math.max(1, Math.round(perimeter / cycle));
      const scale = perimeter / n / cycle;
      this.snappedDash = dash * scale;
      this.snappedGap = gap * scale;
    } else {
      this.snappedDash = dash;
      this.snappedGap = gap;
    }
  }

  private redraw(): void {
    const width = this.opts.width ?? 1.5;
    const alpha = this.opts.alpha ?? 1;

    this.g.clear();
    if (width <= 0 || this.cachedSamples.length < 3) return;

    drawDashedPolylineClosed(
      this.g,
      this.cachedSamples,
      this.snappedDash,
      this.snappedGap,
      this.offset,
    );
    this.g.stroke({ color: this.opts.color, width, alpha });
  }
}

function sampleOutline(
  bounds: Rect,
  hostKind: string | undefined,
  inset: number,
  cornerRadius: number,
  outlinePolyline?: ReadonlyArray<Point>,
): Pt[] {
  const { x, y, width, height } = bounds;
  const cx = x + width / 2;
  const cy = y + height / 2;

  if (hostKind === 'circle' || hostKind === 'ellipse') {
    const rx = width / 2 + inset;
    const ry = height / 2 + inset;
    const n = Math.max(8, Math.round((Math.PI * 2) / ARC_STEP));
    const out: Pt[] = [];
    for (let i = 0; i < n; i++) {
      const theta = (i * Math.PI * 2) / n;
      out.push({ x: cx + Math.cos(theta) * rx, y: cy + Math.sin(theta) * ry });
    }
    out.push({ x: out[0]!.x, y: out[0]!.y });
    return out;
  }

  if (outlinePolyline && outlinePolyline.length >= 3) {
    const offset = offsetPolygon(outlinePolyline, inset);
    return offset.map((p) => ({ x: p.x, y: p.y }));
  }

  const x0 = x - inset;
  const y0 = y - inset;
  const x1 = x + width + inset;
  const y1 = y + height + inset;
  if (cornerRadius > 0) {
    const r = Math.min(cornerRadius + inset, (x1 - x0) / 2, (y1 - y0) / 2);
    return rectRoundedOutline(x0, y0, x1, y1, r);
  }
  return [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
    { x: x0, y: y0 },
  ];
}

function rectRoundedOutline(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number,
): Pt[] {
  if (r <= 0) {
    return [
      { x: x0, y: y0 },
      { x: x1, y: y0 },
      { x: x1, y: y1 },
      { x: x0, y: y1 },
      { x: x0, y: y0 },
    ];
  }
  const arcSteps = Math.max(4, Math.round((Math.PI / 2) / ARC_STEP));
  const out: Pt[] = [];
  out.push({ x: x0 + r, y: y0 });
  out.push({ x: x1 - r, y: y0 });
  pushArc(out, x1 - r, y0 + r, r, -Math.PI / 2, 0, arcSteps);
  out.push({ x: x1, y: y1 - r });
  pushArc(out, x1 - r, y1 - r, r, 0, Math.PI / 2, arcSteps);
  out.push({ x: x0 + r, y: y1 });
  pushArc(out, x0 + r, y1 - r, r, Math.PI / 2, Math.PI, arcSteps);
  out.push({ x: x0, y: y0 + r });
  pushArc(out, x0 + r, y0 + r, r, Math.PI, (3 * Math.PI) / 2, arcSteps);
  out.push({ x: out[0]!.x, y: out[0]!.y });
  return out;
}

function pushArc(
  out: Pt[],
  cx: number,
  cy: number,
  r: number,
  a0: number,
  a1: number,
  steps: number,
): void {
  for (let i = 1; i <= steps; i++) {
    const a = a0 + ((a1 - a0) * i) / steps;
    out.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
}
