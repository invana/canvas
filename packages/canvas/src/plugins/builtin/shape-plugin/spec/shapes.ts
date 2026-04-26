// ── Shape spec discriminated union ────────────────────────────────────────────
// Each shape type carries ONLY the geometry fields it needs.
// TypeScript narrows automatically on spec.type — no impossible states.

import type { FillSpec } from './fills.js';
import type { BorderSpec, HaloSpec } from './border-halo.js';
import type { ShapeAnimations } from './animations.js';
import type { BezierPoint } from '../../../../graphics-utils/paths/bezier.js';
import type { OrthogonalParams } from '../../../../graphics-utils/paths/orthogonal.js';
import type { CircleGlowParams } from '../../../../graphics-utils/effects/glow.js';
import type { RippleParams } from '../../../../graphics-utils/effects/ripple.js';
import type { ArrowType, ArrowParams } from '../../../../graphics-utils/arrows/types.js';

// ── Shared base ───────────────────────────────────────────────────────────────

export interface BaseShapeSpec {
  id: string;
  fill?: FillSpec;
  border?: BorderSpec;
  halo?: HaloSpec;
  animations?: ShapeAnimations;
  interactive?: boolean;
  cursor?: 'pointer' | 'grab' | 'crosshair' | 'move' | 'default';
  draggable?: boolean;
  /** z-ordering within the ShapePlugin layer (default: 0) */
  zIndex?: number;
  /** Arbitrary user data — passed through in event payloads */
  data?: Record<string, unknown>;
}

// ── Solid shapes ──────────────────────────────────────────────────────────────

export interface CircleSpec extends BaseShapeSpec {
  type: 'circle';
  x: number;
  y: number;
  radius: number;
}

export interface EllipseSpec extends BaseShapeSpec {
  type: 'ellipse';
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
}

export interface RectSpec extends BaseShapeSpec {
  type: 'rect';
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius?: number;
}

export interface PolygonSpec extends BaseShapeSpec {
  type: 'polygon';
  x: number;
  y: number;
  radius: number;
  sides: number;
  rotation?: number;
}

export interface StarSpec extends BaseShapeSpec {
  type: 'star';
  x: number;
  y: number;
  radius: number;
  points?: number;
  innerRatio?: number;
  rotation?: number;
}

// ── Dashed / dotted variants ──────────────────────────────────────────────────
// These share geometry with their solid counterparts but render with simulated
// dashed strokes (PixiJS 8 has no native dash support).

export interface DashedCircleSpec extends BaseShapeSpec {
  type: 'dashedCircle' | 'dottedCircle';
  x: number;
  y: number;
  radius: number;
}

export interface DashedRectSpec extends BaseShapeSpec {
  type: 'dashedRect' | 'dottedRect';
  x: number;
  y: number;
  width: number;
  height: number;
}

// ── Paths ─────────────────────────────────────────────────────────────────────

export interface LineSpec extends BaseShapeSpec {
  type: 'line' | 'dashedLine' | 'dottedLine';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BezierSpec extends BaseShapeSpec {
  type: 'bezier';
  from: BezierPoint;
  cp1: BezierPoint;
  to: BezierPoint;
  /** Omit for quadratic, provide for cubic */
  cp2?: BezierPoint;
}

export interface AutoBezierSpec extends BaseShapeSpec {
  type: 'autoBezier';
  from: BezierPoint;
  to: BezierPoint;
  /** Perpendicular offset of the auto-computed control point (default: 80) */
  curvature?: number;
}

export interface OrthogonalSpec extends BaseShapeSpec {
  type: 'orthogonal' | 'roundedOrthogonal';
  params: OrthogonalParams;
}

// ── Effects ───────────────────────────────────────────────────────────────────

export interface CircleGlowSpec extends BaseShapeSpec {
  type: 'circleGlow';
  x: number;
  y: number;
  radius: number;
  params?: Partial<CircleGlowParams>;
}

export interface RippleRingSpec extends BaseShapeSpec {
  type: 'rippleRing';
  x: number;
  y: number;
  radius: number;
  params?: Partial<RippleParams>;
}

// ── Label ─────────────────────────────────────────────────────────────────────

export interface LabelSpec extends BaseShapeSpec {
  type: 'label';
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

// ── Arrow ─────────────────────────────────────────────────────────────────────

export interface ArrowSpec extends BaseShapeSpec {
  type: 'arrow';
  /** Which arrowhead variant to render */
  arrowType: ArrowType;
  params: ArrowParams;
}

// ── Union ─────────────────────────────────────────────────────────────────────

export type ShapeSpec =
  | CircleSpec
  | EllipseSpec
  | RectSpec
  | PolygonSpec
  | StarSpec
  | DashedCircleSpec
  | DashedRectSpec
  | LineSpec
  | BezierSpec
  | AutoBezierSpec
  | OrthogonalSpec
  | CircleGlowSpec
  | RippleRingSpec
  | LabelSpec
  | ArrowSpec;

export type ShapeType = ShapeSpec['type'];

// ── Bbox helpers ──────────────────────────────────────────────────────────────

/** Axis-aligned bounding box in world space — stored in RBush */
export interface ShapeBBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Compute a loose but fast AABB for any ShapeSpec.
 * Bezier/orthogonal use control-point bbox (over-inclusive) — the precise
 * hit-test in ShapeObject.hitTest() filters any false positives.
 */
export function computeBBox(spec: ShapeSpec): ShapeBBox {
  switch (spec.type) {
    case 'circle':
    case 'dashedCircle':
    case 'dottedCircle':
    case 'circleGlow':
    case 'rippleRing': {
      const r = spec.radius + (spec.halo?.radius ?? 0);
      return { minX: spec.x - r, minY: spec.y - r, maxX: spec.x + r, maxY: spec.y + r };
    }
    case 'ellipse': {
      const rx = spec.radiusX + (spec.halo?.radius ?? 0);
      const ry = spec.radiusY + (spec.halo?.radius ?? 0);
      return { minX: spec.x - rx, minY: spec.y - ry, maxX: spec.x + rx, maxY: spec.y + ry };
    }
    case 'rect':
    case 'dashedRect':
    case 'dottedRect': {
      const pad = spec.halo?.radius ?? 0;
      return { minX: spec.x - pad, minY: spec.y - pad, maxX: spec.x + spec.width + pad, maxY: spec.y + spec.height + pad };
    }
    case 'polygon':
    case 'star': {
      const r = spec.radius + (spec.halo?.radius ?? 0);
      return { minX: spec.x - r, minY: spec.y - r, maxX: spec.x + r, maxY: spec.y + r };
    }
    case 'line':
    case 'dashedLine':
    case 'dottedLine': {
      const pad = (spec.border?.width ?? 2) / 2 + 4;
      return { minX: Math.min(spec.x1, spec.x2) - pad, minY: Math.min(spec.y1, spec.y2) - pad,
               maxX: Math.max(spec.x1, spec.x2) + pad, maxY: Math.max(spec.y1, spec.y2) + pad };
    }
    case 'bezier': {
      // Control-point convex hull bbox (loose but O(1))
      const xs = [spec.from.x, spec.cp1.x, spec.to.x, ...(spec.cp2 ? [spec.cp2.x] : [])];
      const ys = [spec.from.y, spec.cp1.y, spec.to.y, ...(spec.cp2 ? [spec.cp2.y] : [])];
      return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
    }
    case 'autoBezier': {
      const xs = [spec.from.x, spec.to.x];
      const ys = [spec.from.y, spec.to.y];
      const pad = Math.abs(spec.curvature ?? 80);
      return { minX: Math.min(...xs) - pad, minY: Math.min(...ys) - pad,
               maxX: Math.max(...xs) + pad, maxY: Math.max(...ys) + pad };
    }
    case 'orthogonal':
    case 'roundedOrthogonal': {
      const { from, to } = spec.params;
      const pad = 4;
      return { minX: Math.min(from.x, to.x) - pad, minY: Math.min(from.y, to.y) - pad,
               maxX: Math.max(from.x, to.x) + pad, maxY: Math.max(from.y, to.y) + pad };
    }
    case 'label': {
      const w = (spec.text.length * (spec.fontSize ?? 14)) / 1.6;
      const h = (spec.fontSize ?? 14) * 1.4;
      return { minX: spec.x - w / 2, minY: spec.y - h / 2, maxX: spec.x + w / 2, maxY: spec.y + h / 2 };
    }
    case 'arrow': {
      const s = spec.params.size;
      return { minX: spec.params.x - s, minY: spec.params.y - s, maxX: spec.params.x + s, maxY: spec.params.y + s };
    }
  }
}
