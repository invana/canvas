import type { NodeStyle } from '@invana/graph';

import { hexToNumber, numberToHex } from '../../../../shared/color';
import type { NodeStyleFields, ShapeKind } from './types';

/**
 * Construct a fresh shape spec with sane defaults for a given kind. Used when
 * the user switches `shapeKind` and there's no seeded geometry to preserve.
 */
export function defaultShapeFor(kind: ShapeKind): NonNullable<NodeStyle['shape']> {
  switch (kind) {
    case 'rect':
      return { kind: 'rect', width: 24, height: 24 };
    case 'regular-polygon':
      return { kind: 'regular-polygon', sides: 6, radius: 12 };
    case 'star':
      return { kind: 'star', points: 5, innerRadius: 6, outerRadius: 12 };
    case 'circle':
    default:
      return { kind: 'circle', radius: 12 };
  }
}

/** `0xRRGGBB` → `#rrggbb`, but only for real numbers — non-colour fills
 * (image / glyph / stacked layers) round-trip as `undefined` so the editor
 * leaves them untouched. Accepts the full `ShapeFill` and guards. */
function colorToHex(v: unknown): string | undefined {
  return typeof v === 'number' ? numberToHex(v) : undefined;
}

/** `#rrggbb` → `0xRRGGBB`; empty / undefined stays undefined (don't bake a
 * black `0x000000` onto fields the user never set). */
function hexToColor(s: string | undefined): number | undefined {
  return s && s.length > 0 ? hexToNumber(s) : undefined;
}

/**
 * Map an engine `Partial<NodeStyle>` (e.g. the result of
 * `layer.resolveNodeStyle(node)`) to the flat, string-colour
 * {@link NodeStyleFields} the `@invana/forms` generator renders.
 *
 * Extracts only the literal fields the editor handles, guarding non-scalar
 * values (image / glyph fills, string font weights) so they round-trip as
 * `undefined` rather than corrupting a field. The `shape` discriminated union
 * is flattened to `shapeKind` + the geometry numbers of that kind; the dash
 * tuple is split; colours become hex strings.
 */
export function styleToForm(style: Partial<NodeStyle>): NodeStyleFields {
  const s = style.shape;
  const dash = style.bgStrokeDashArray;
  // `in`-based narrowing rather than `s.kind === …`: the shape union includes
  // an open-ended custom `kind: string & {}`, which defeats discriminated-union
  // narrowing on `kind` for the whole union. Property presence still narrows.
  return {
    shapeKind: s?.kind,
    radius: s && 'radius' in s ? s.radius : undefined, // circle, regular-polygon
    width: s && 'width' in s ? s.width : undefined,
    height: s && 'height' in s ? s.height : undefined,
    cornerRadius: s && 'cornerRadius' in s ? s.cornerRadius : undefined,
    sides: s && 'sides' in s ? s.sides : undefined,
    points: s && 'points' in s ? s.points : undefined,
    innerRadius: s && 'innerRadius' in s ? s.innerRadius : undefined,
    outerRadius: s && 'outerRadius' in s ? s.outerRadius : undefined,
    size: style.size,

    bgFill: colorToHex(style.bgFill),
    bgAlpha: style.bgAlpha,

    bgStrokeColor: colorToHex(style.bgStrokeColor),
    bgStrokeAlpha: style.bgStrokeAlpha,
    bgStrokeWidth: style.bgStrokeWidth,
    bgStrokeAlignment: style.bgStrokeAlignment,
    bgStrokeDashLength: dash?.[0],
    bgStrokeDashGap: dash?.[1],
    bgStrokeCap: style.bgStrokeCap,
    bgStrokeJoin: style.bgStrokeJoin,

    labelText: style.labelText,
    labelColor: colorToHex(style.labelColor),
    labelFontSize: style.labelFontSize,
    labelFontWeight: typeof style.labelFontWeight === 'number' ? style.labelFontWeight : undefined,
    labelPlacement: style.labelPlacement,
    labelOffsetX: style.labelOffsetX,
    labelOffsetY: style.labelOffsetY,
  };
}

/** Rebuild the shape discriminated union from the flat geometry fields,
 * defaulting any axis the user left blank for the current kind. */
function buildShape(f: NodeStyleFields): NodeStyle['shape'] {
  switch (f.shapeKind) {
    case 'rect':
      return {
        kind: 'rect',
        width: f.width ?? 24,
        height: f.height ?? 24,
        ...(f.cornerRadius != null ? { cornerRadius: f.cornerRadius } : {}),
      };
    case 'regular-polygon':
      return { kind: 'regular-polygon', sides: f.sides ?? 6, radius: f.radius ?? 12 };
    case 'star':
      return {
        kind: 'star',
        points: f.points ?? 5,
        innerRadius: f.innerRadius ?? 6,
        outerRadius: f.outerRadius ?? 12,
      };
    case 'circle':
      return { kind: 'circle', radius: f.radius ?? 12 };
    default:
      return undefined;
  }
}

/**
 * Map the flat {@link NodeStyleFields} the form holds back to an engine
 * `Partial<NodeStyle>` — inverse of {@link styleToForm}. Only fields the form
 * actually set are included (no `undefined` keys), so the result is safe to
 * spread over an existing style on commit:
 * `store.updateNode(id, { style: { ...resolveNodeStyle(node), ...formToStyle(fields) } })`.
 */
export function formToStyle(f: NodeStyleFields): Partial<NodeStyle> {
  // `NodeStyle` fields are readonly; accumulate into a mutable view, return as Partial.
  const out: { -readonly [K in keyof NodeStyle]?: NodeStyle[K] } = {};

  if (f.size !== undefined) out.size = f.size;

  const bgFill = hexToColor(f.bgFill);
  if (bgFill !== undefined) out.bgFill = bgFill;
  if (f.bgAlpha !== undefined) out.bgAlpha = f.bgAlpha;

  const bgStrokeColor = hexToColor(f.bgStrokeColor);
  if (bgStrokeColor !== undefined) out.bgStrokeColor = bgStrokeColor;
  if (f.bgStrokeAlpha !== undefined) out.bgStrokeAlpha = f.bgStrokeAlpha;
  if (f.bgStrokeWidth !== undefined) out.bgStrokeWidth = f.bgStrokeWidth;
  if (f.bgStrokeAlignment !== undefined) out.bgStrokeAlignment = f.bgStrokeAlignment;
  if (f.bgStrokeCap !== undefined) out.bgStrokeCap = f.bgStrokeCap;
  if (f.bgStrokeJoin !== undefined) out.bgStrokeJoin = f.bgStrokeJoin;

  if (f.labelText !== undefined) out.labelText = f.labelText;
  const labelColor = hexToColor(f.labelColor);
  if (labelColor !== undefined) out.labelColor = labelColor;
  if (f.labelFontSize !== undefined) out.labelFontSize = f.labelFontSize;
  if (f.labelFontWeight !== undefined) out.labelFontWeight = f.labelFontWeight;
  if (f.labelPlacement !== undefined) out.labelPlacement = f.labelPlacement;
  if (f.labelOffsetX !== undefined) out.labelOffsetX = f.labelOffsetX;
  if (f.labelOffsetY !== undefined) out.labelOffsetY = f.labelOffsetY;

  if (f.shapeKind) out.shape = buildShape(f);
  if (f.bgStrokeDashLength != null || f.bgStrokeDashGap != null) {
    out.bgStrokeDashArray = [f.bgStrokeDashLength ?? 0, f.bgStrokeDashGap ?? 0];
  }

  return out;
}
