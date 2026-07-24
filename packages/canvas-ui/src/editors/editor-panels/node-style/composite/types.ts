import type { CompositePart } from '@invana/graph';

/**
 * Root-silhouette kinds the composite editor's **Root** section exposes.
 * `'none'` omits `root` → the default rounded-rect body built from
 * `cornerRadius` + the body `fill` / `stroke`. `CompositeRootSpec` also allows
 * `ellipse` / `polygon` / `arc`; the editor covers the common four for v1 (a
 * root of another kind round-trips as `'none'` — see `mapping.ts`).
 */
export type CompositeRootKind = 'none' | 'rect' | 'circle' | 'regular-polygon' | 'star';

/** Part kinds the parts list can add — the full {@link CompositePart} union. */
export type CompositePartKind = CompositePart['part'];

/**
 * Icon-inset kinds the `icon` part exposes. The engine's `InsetLayer` union also
 * has a raw `'svg'` (path-d) variant; the editor supports the two common inset
 * forms in v1 (an `'svg'` icon round-trips as `'glyph'`).
 */
export type CompositeIconKind = 'glyph' | 'svg-url';

/**
 * Body + root scalar controls the editor renders under the `composite`
 * `ObjectField`. Colours are `#rrggbb` strings (the swatch encoding); the root
 * discriminated union is flattened to `rootKind` + per-kind geometry numbers,
 * mirroring the simple editor's `shapeKind` handling. `mapping.ts` round-trips
 * this against the `CompositeShapeOption` body + `root`.
 */
export interface CompositeScalarFields {
  width?: number;
  height?: number;
  cornerRadius?: number;

  /** Body fill (`#rrggbb`). Also painted onto a chosen root silhouette. */
  fill?: string;
  fillAlpha?: number;
  /** Body stroke colour (`#rrggbb`). */
  strokeColor?: string;
  strokeWidth?: number;
  strokeAlpha?: number;
  /** Clip parts to the root silhouette (edge-touching parts follow the corners). */
  clip?: boolean;

  rootKind?: CompositeRootKind;
  rootRadius?: number; // circle / regular-polygon
  rootWidth?: number; // rect
  rootHeight?: number; // rect
  rootCornerRadius?: number; // rect
  rootSides?: number; // regular-polygon
  rootPoints?: number; // star
  rootInnerRadius?: number; // star
  rootOuterRadius?: number; // star
}

/**
 * One flat parts-list row (a `parts.${i}` `ObjectField`). Carries every
 * possible part field; the editor shows only the subset for the row's `part`
 * kind (see `partRowFields`). Nested `stroke {}` / `icon` `InsetLayer` and the
 * label/icon colours are flattened to scalars here and rebuilt in `mapping.ts`.
 */
export interface CompositePartRow {
  part: CompositePartKind;
  x?: number;
  y?: number;

  // rect
  width?: number;
  height?: number;
  cornerRadius?: number;
  // circle
  radius?: number;
  // line
  x2?: number;
  y2?: number;

  // fill (rect / circle) — `#rrggbb`
  fill?: string;
  fillAlpha?: number;
  // stroke (rect / circle / line) — `#rrggbb`
  strokeColor?: string;
  strokeWidth?: number;
  strokeAlpha?: number;

  /** Addressable sub-part id for hit-testing (rect / circle / icon). */
  hitId?: string;

  // label
  text?: string;
  anchor?: 'left' | 'center' | 'right';
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  /** Label text colour (`#rrggbb`); maps to the label part's `fill`. */
  labelFill?: string;
  lineHeight?: number;
  align?: 'left' | 'center' | 'right';
  maxWidth?: number;
  maxLines?: number;
  overflow?: 'clip' | 'ellipsis';

  // icon
  size?: number;
  iconKind?: CompositeIconKind;
  iconChar?: string; // glyph
  iconUrl?: string; // svg-url
  /** Icon glyph / stroke colour (`#rrggbb`). */
  iconColor?: string;
  /** Chip traced behind the glyph (`#rrggbb`). */
  iconBackgroundFill?: string;
}

/**
 * react-hook-form state shape. Body/root scalars nest under `composite` (an
 * `ObjectField`); `parts` is the top-level `useFieldArray`. `compositeToForm` /
 * `formToComposite` round-trip between this and a `CompositeShapeOption`.
 */
export interface CompositeFormState {
  composite: CompositeScalarFields;
  parts: CompositePartRow[];
}
