import type { CompositePart, CompositeRootSpec, CompositeShapeOption } from '@invana/graph';

import { hexToNumber, numberToHex } from '../../../shared/color';
import type {
  CompositeFormState,
  CompositePartRow,
  CompositeScalarFields,
} from './types';

/** `0xRRGGBB` → `#rrggbb`, guarding non-numeric fills so they round-trip as
 * `undefined` (the editor leaves them untouched). */
function colorToHex(v: unknown): string | undefined {
  return typeof v === 'number' ? numberToHex(v) : undefined;
}

/** `#rrggbb` → `0xRRGGBB`; empty / undefined stays undefined. */
function hexToColor(s: string | undefined): number | undefined {
  return s && s.length > 0 ? hexToNumber(s) : undefined;
}

/** Solid stroke `{ color, width?, alpha? }` from a row's flat stroke fields —
 * `undefined` when no colour was set (assignable to both `PartStroke` and the
 * engine `ShapeStroke`). */
function strokeOf(
  color: string | undefined,
  width: number | undefined,
  alpha: number | undefined,
): { color: number; width?: number; alpha?: number } | undefined {
  const c = hexToColor(color);
  if (c === undefined) return undefined;
  const out: { color: number; width?: number; alpha?: number } = { color: c };
  if (width !== undefined) out.width = width;
  if (alpha !== undefined) out.alpha = alpha;
  return out;
}

// ─── Root silhouette ⇄ flat fields ───────────────────────────────────────────

/** Body fill / stroke applied to a chosen root silhouette so it paints. */
function rootPaint(f: CompositeScalarFields): { fill?: number; stroke?: { color: number; width?: number; alpha?: number } } {
  const out: { fill?: number; stroke?: { color: number; width?: number; alpha?: number } } = {};
  const fill = hexToColor(f.fill);
  if (fill !== undefined) out.fill = fill;
  const stroke = strokeOf(f.strokeColor, f.strokeWidth, f.strokeAlpha);
  if (stroke) out.stroke = stroke;
  return out;
}

/** Flatten the optional `root` discriminated union to `rootKind` + geometry.
 * `ellipse` / `polygon` / `arc` roots aren't editable in v1 → reported as
 * `'none'` (the body keeps them only if the user never touches Root). */
function rootToForm(root: CompositeRootSpec | undefined): Partial<CompositeScalarFields> {
  if (!root) return { rootKind: 'none' };
  switch (root.kind) {
    case 'rect':
      return {
        rootKind: 'rect',
        rootWidth: root.width,
        rootHeight: root.height,
        rootCornerRadius: root.cornerRadius,
      };
    case 'circle':
      return { rootKind: 'circle', rootRadius: root.radius };
    case 'regular-polygon':
      return { rootKind: 'regular-polygon', rootSides: root.sides, rootRadius: root.radius };
    case 'star':
      return {
        rootKind: 'star',
        rootPoints: root.points,
        rootInnerRadius: root.innerRadius,
        rootOuterRadius: root.outerRadius,
      };
    default:
      return { rootKind: 'none' };
  }
}

/** Rebuild the `root` spec from the flat geometry + body paint, or `undefined`
 * for the default rounded-rect body (`rootKind === 'none'`). `x`/`y` are `0` —
 * the composite ignores them and centres the root in its box. */
function buildRoot(f: CompositeScalarFields): CompositeRootSpec | undefined {
  const paint = rootPaint(f);
  const origin = { x: 0, y: 0 };
  switch (f.rootKind) {
    case 'rect':
      return {
        kind: 'rect',
        ...origin,
        width: f.rootWidth ?? f.width ?? 160,
        height: f.rootHeight ?? f.height ?? 96,
        ...(f.rootCornerRadius != null ? { cornerRadius: f.rootCornerRadius } : {}),
        ...paint,
      };
    case 'circle':
      return { kind: 'circle', ...origin, radius: f.rootRadius ?? 48, ...paint };
    case 'regular-polygon':
      return {
        kind: 'regular-polygon',
        ...origin,
        sides: f.rootSides ?? 6,
        radius: f.rootRadius ?? 48,
        ...paint,
      };
    case 'star':
      return {
        kind: 'star',
        ...origin,
        points: f.rootPoints ?? 5,
        innerRadius: f.rootInnerRadius ?? 24,
        outerRadius: f.rootOuterRadius ?? 48,
        ...paint,
      };
    default:
      return undefined;
  }
}

// ─── Parts ⇄ flat rows ───────────────────────────────────────────────────────

/** One engine {@link CompositePart} → its flat editor row. */
function partToRow(p: CompositePart): CompositePartRow {
  switch (p.part) {
    case 'rect':
      return {
        part: 'rect',
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        cornerRadius: p.cornerRadius,
        fill: colorToHex(p.fill),
        fillAlpha: p.fillAlpha,
        strokeColor: colorToHex(p.stroke?.color),
        strokeWidth: p.stroke?.width,
        strokeAlpha: p.stroke?.alpha,
        hitId: p.hitId,
      };
    case 'circle':
      return {
        part: 'circle',
        x: p.x,
        y: p.y,
        radius: p.radius,
        fill: colorToHex(p.fill),
        fillAlpha: p.fillAlpha,
        strokeColor: colorToHex(p.stroke?.color),
        strokeWidth: p.stroke?.width,
        strokeAlpha: p.stroke?.alpha,
        hitId: p.hitId,
      };
    case 'line':
      return {
        part: 'line',
        x: p.x,
        y: p.y,
        x2: p.x2,
        y2: p.y2,
        strokeColor: colorToHex(p.stroke.color),
        strokeWidth: p.stroke.width,
        strokeAlpha: p.stroke.alpha,
      };
    case 'label':
      return {
        part: 'label',
        x: p.x,
        y: p.y,
        text: p.text,
        anchor: p.anchor,
        fontSize: p.fontSize,
        fontWeight: typeof p.fontWeight === 'number' ? p.fontWeight : undefined,
        fontStyle: p.fontStyle,
        labelFill: colorToHex(p.fill),
        lineHeight: p.lineHeight,
        align: p.align,
        maxWidth: p.maxWidth,
        maxLines: p.maxLines,
        overflow: p.overflow,
      };
    case 'icon':
      return {
        part: 'icon',
        x: p.x,
        y: p.y,
        size: p.size,
        iconKind: p.icon.kind === 'svg-url' ? 'svg-url' : 'glyph',
        iconChar: p.icon.kind === 'glyph' ? p.icon.char : undefined,
        iconUrl: p.icon.kind === 'svg-url' ? p.icon.url : undefined,
        iconColor: colorToHex(p.icon.color),
        iconBackgroundFill: colorToHex(p.background?.fill),
        hitId: p.hitId,
      };
  }
}

/** One flat editor row → an engine {@link CompositePart}. */
function buildPart(r: CompositePartRow): CompositePart {
  const x = r.x ?? 0;
  const y = r.y ?? 0;
  const fill = hexToColor(r.fill);
  const stroke = strokeOf(r.strokeColor, r.strokeWidth, r.strokeAlpha);
  switch (r.part) {
    case 'rect':
      return {
        part: 'rect',
        x,
        y,
        width: r.width ?? 40,
        height: r.height ?? 20,
        ...(r.cornerRadius != null ? { cornerRadius: r.cornerRadius } : {}),
        ...(fill !== undefined ? { fill } : {}),
        ...(r.fillAlpha != null ? { fillAlpha: r.fillAlpha } : {}),
        ...(stroke ? { stroke } : {}),
        ...(r.hitId ? { hitId: r.hitId } : {}),
      };
    case 'circle':
      return {
        part: 'circle',
        x,
        y,
        radius: r.radius ?? 8,
        ...(fill !== undefined ? { fill } : {}),
        ...(r.fillAlpha != null ? { fillAlpha: r.fillAlpha } : {}),
        ...(stroke ? { stroke } : {}),
        ...(r.hitId ? { hitId: r.hitId } : {}),
      };
    case 'line':
      return {
        part: 'line',
        x,
        y,
        x2: r.x2 ?? x,
        y2: r.y2 ?? y,
        stroke: stroke ?? { color: 0x000000 },
      };
    case 'icon':
      return {
        part: 'icon',
        x,
        y,
        size: r.size ?? 16,
        icon:
          r.iconKind === 'svg-url'
            ? {
                kind: 'svg-url',
                url: r.iconUrl ?? '',
                ...(hexToColor(r.iconColor) !== undefined ? { color: hexToColor(r.iconColor) } : {}),
              }
            : {
                kind: 'glyph',
                char: r.iconChar ?? '',
                ...(hexToColor(r.iconColor) !== undefined ? { color: hexToColor(r.iconColor) } : {}),
              },
        ...(hexToColor(r.iconBackgroundFill) !== undefined
          ? { background: { fill: hexToColor(r.iconBackgroundFill) as number } }
          : {}),
        ...(r.hitId ? { hitId: r.hitId } : {}),
      };
    case 'label':
    default:
      return {
        part: 'label',
        x,
        y,
        text: r.text ?? '',
        ...(r.anchor ? { anchor: r.anchor } : {}),
        ...(r.fontSize != null ? { fontSize: r.fontSize } : {}),
        ...(r.fontWeight != null ? { fontWeight: r.fontWeight } : {}),
        ...(r.fontStyle ? { fontStyle: r.fontStyle } : {}),
        ...(hexToColor(r.labelFill) !== undefined ? { fill: hexToColor(r.labelFill) } : {}),
        ...(r.lineHeight != null ? { lineHeight: r.lineHeight } : {}),
        ...(r.align ? { align: r.align } : {}),
        ...(r.maxWidth != null ? { maxWidth: r.maxWidth } : {}),
        ...(r.maxLines != null ? { maxLines: r.maxLines } : {}),
        ...(r.overflow ? { overflow: r.overflow } : {}),
      };
  }
}

// ─── Public mappers ──────────────────────────────────────────────────────────

/**
 * Map a `CompositeShapeOption` to the flat {@link CompositeFormState} the
 * generator renders — body scalars, the `root` union flattened to
 * `rootKind` + geometry, and each part to a flat row. Colours become hex; a
 * missing option seeds an empty card.
 */
export function compositeToForm(option?: CompositeShapeOption): CompositeFormState {
  if (!option) return { composite: { rootKind: 'none' }, parts: [] };
  return {
    composite: {
      width: option.width,
      height: option.height,
      cornerRadius: option.cornerRadius,
      fill: colorToHex(option.fill),
      fillAlpha: option.fillAlpha,
      strokeColor: colorToHex(option.stroke?.color),
      strokeWidth: option.stroke?.width,
      strokeAlpha: option.stroke?.alpha,
      clip: option.clip,
      ...rootToForm(option.root),
    },
    parts: (option.parts ?? []).map(partToRow),
  };
}

/**
 * Inverse of {@link compositeToForm}: the form state → a `CompositeShapeOption`.
 * `width`/`height` default (160×96) so the result is always a valid card;
 * optional body fields are included only when set. Safe to hand to
 * `store.updateNode(id, { style: { shape: formToComposite(values) } })`.
 */
export function formToComposite(state: CompositeFormState): CompositeShapeOption {
  const f = state.composite ?? {};
  const out: { -readonly [K in keyof CompositeShapeOption]?: CompositeShapeOption[K] } = {
    kind: 'composite',
    width: f.width ?? 160,
    height: f.height ?? 96,
    parts: (state.parts ?? []).map(buildPart),
  };
  if (f.cornerRadius != null) out.cornerRadius = f.cornerRadius;
  const fill = hexToColor(f.fill);
  if (fill !== undefined) out.fill = fill;
  if (f.fillAlpha != null) out.fillAlpha = f.fillAlpha;
  const stroke = strokeOf(f.strokeColor, f.strokeWidth, f.strokeAlpha);
  if (stroke) out.stroke = stroke;
  if (f.clip != null) out.clip = f.clip;
  const root = buildRoot(f);
  if (root) out.root = root;
  return out as CompositeShapeOption;
}
