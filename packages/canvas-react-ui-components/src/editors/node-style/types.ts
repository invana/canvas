import type { NodeStyle } from '@invana/graph';

/** Shape kinds the v1 geometry tab exposes. */
export type ShapeKind = NonNullable<NodeStyle['shape']>['kind'];
export type StrokeAlignment = NonNullable<NodeStyle['bgStrokeAlignment']>;
export type StrokeCap = NonNullable<NodeStyle['bgStrokeCap']>;
export type StrokeJoin = NonNullable<NodeStyle['bgStrokeJoin']>;
export type LabelPlacement = NonNullable<NodeStyle['labelPlacement']>;

/**
 * Flat form-field shape consumed by `@invana/forms`'s `<ObjectField>`.
 *
 * The form-generator renders scalar leaf inputs, so every field here is a
 * primitive: colours are hex strings (the encoding the design-kit colour
 * swatch emits), the shape discriminated union is decomposed into a
 * `shapeKind` select plus per-kind geometry numbers, and the dash tuple is
 * split into `bgStrokeDashLength` / `bgStrokeDashGap`. The `styleToForm` /
 * `formToStyle` mapping (`mapping.ts`) round-trips between this and the
 * engine's `Partial<NodeStyle>`.
 */
export interface NodeStyleFields {
  // Geometry — shape kind + per-kind numerics (only the relevant ones are
  // rendered for a given kind; the rest stay undefined and are ignored).
  shapeKind?: ShapeKind;
  radius?: number; // circle, regular-polygon
  width?: number; // rect
  height?: number; // rect
  cornerRadius?: number; // rect
  sides?: number; // regular-polygon
  points?: number; // star
  innerRadius?: number; // star
  outerRadius?: number; // star
  size?: number;

  // Background
  bgFill?: string; // #rrggbb
  bgAlpha?: number;

  // Stroke
  bgStrokeColor?: string; // #rrggbb
  bgStrokeAlpha?: number;
  bgStrokeWidth?: number;
  bgStrokeAlignment?: StrokeAlignment;
  bgStrokeDashLength?: number;
  bgStrokeDashGap?: number;
  bgStrokeCap?: StrokeCap;
  bgStrokeJoin?: StrokeJoin;

  // Label
  labelText?: string;
  labelColor?: string; // #rrggbb
  labelFontSize?: number;
  labelFontWeight?: number;
  labelPlacement?: LabelPlacement;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="style" …>` registers each
 * leaf under `style.<field>`, so the form's values nest under a `style` key.
 * This is the type the consumer parameterises its `useForm` with.
 */
export interface NodeStyleFormState {
  style: NodeStyleFields;
}
