/**
 * `marching-ants` — animated decoration: dashed outline with a scrolling
 * dash offset (the classic "selection ants" effect).
 *
 * Heavy work (sample the outline, measure perimeter, snap dash/gap so
 * `perimeter = N * (dashLen + gapLen)`) is cached on `update` and reused
 * on every `tick`. The walker handles seam wrap inline — dashes never split
 * at the closing point, so we don't have to rotate the polyline per frame.
 *
 * Pixi v8's stroke API has no native dash array, so dashes are stamped as
 * straight chord segments. For circle/ellipse hosts the outline is sampled
 * around the ring; rect-like hosts get a bbox perimeter (or arc-sampled
 * rounded-rect perimeter when `cornerRadius > 0`).
 */

import type { Container, Graphics } from 'pixi.js';
import type { AnimatedDecoration, Rect } from '../types';

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

  update(bounds: Rect, hostKind?: string): void {
    this.bounds = bounds;
    this.hostKind = hostKind;
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

    this.cachedSamples = sampleOutline(this.bounds, this.hostKind, inset, cornerRadius);

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

function rectRoundedOutline(x0: number, y0: number, x1: number, y1: number, r: number): Pt[] {
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

/**
 * Closed-loop dashed walker — emits each dash as a self-contained sub-path
 * (`moveTo` + `lineTo`s through any corners). Seam-spanning dashes emit two
 * connected arcs joined at `poly[0]` so Pixi never produces doubled
 * butt-caps.
 */
function drawDashedPolylineClosed(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  dashLen: number,
  gapLen: number,
  offset: number,
): void {
  const cycle = dashLen + gapLen;
  if (cycle <= 0 || poly.length < 3 || dashLen <= 0) return;
  const N = poly.length - 1;

  const segLens: number[] = new Array(N);
  let perimeter = 0;
  for (let i = 0; i < N; i++) {
    const a = poly[i]!;
    const b = poly[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    segLens[i] = len;
    perimeter += len;
  }
  if (perimeter <= 0) return;

  const normOffset = ((offset % cycle) + cycle) % cycle;
  const firstDashStart = normOffset === 0 ? 0 : cycle - normOffset;
  const numDashes = Math.max(1, Math.round(perimeter / cycle));

  for (let k = 0; k < numDashes; k++) {
    const dashStart = (firstDashStart + k * cycle) % perimeter;
    const dashEnd = dashStart + dashLen;
    if (dashEnd <= perimeter) {
      emitArc(g, poly, segLens, dashStart, dashEnd, false);
    } else {
      emitArc(g, poly, segLens, dashStart, perimeter, false);
      emitArc(g, poly, segLens, 0, dashEnd - perimeter, true);
    }
  }
}

function emitArc(
  g: Graphics,
  poly: ReadonlyArray<Pt>,
  segLens: ReadonlyArray<number>,
  from: number,
  to: number,
  continueDash: boolean,
): void {
  if (to <= from) return;

  let acc = 0;
  let segIdx = 0;
  while (segIdx < segLens.length - 1 && acc + segLens[segIdx]! <= from) {
    acc += segLens[segIdx]!;
    segIdx++;
  }
  let local = from - acc;

  if (!continueDash) {
    const a = poly[segIdx]!;
    const b = poly[segIdx + 1]!;
    const segLen = segLens[segIdx]!;
    if (segLen <= 0) return;
    const ux = (b.x - a.x) / segLen;
    const uy = (b.y - a.y) / segLen;
    g.moveTo(a.x + ux * local, a.y + uy * local);
  }

  let remaining = to - from;
  while (remaining > 0 && segIdx < segLens.length) {
    const a = poly[segIdx]!;
    const b = poly[segIdx + 1]!;
    const segLen = segLens[segIdx]!;
    if (segLen <= 0) {
      segIdx++;
      local = 0;
      continue;
    }
    const ux = (b.x - a.x) / segLen;
    const uy = (b.y - a.y) / segLen;
    const stepInSeg = Math.min(remaining, segLen - local);
    g.lineTo(a.x + ux * (local + stepInSeg), a.y + uy * (local + stepInSeg));
    remaining -= stepInSeg;
    local += stepInSeg;
    if (local >= segLen - 1e-9) {
      segIdx++;
      local = 0;
    }
  }
}
