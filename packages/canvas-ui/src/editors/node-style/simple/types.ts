import type { NodeStyle } from '@invana/graph';

/** Shape kinds the v1 geometry tab exposes. */
export type ShapeKind = NonNullable<NodeStyle['shape']>['kind'];
export type StrokeAlignment = NonNullable<NodeStyle['bgStrokeAlignment']>;
export type StrokeCap = NonNullable<NodeStyle['bgStrokeCap']>;
export type StrokeJoin = NonNullable<NodeStyle['bgStrokeJoin']>;
export type LabelPlacement = NonNullable<NodeStyle['labelPlacement']>;

/** Strip `readonly` (NodeStyle's fields are readonly) so the form holds a
 * plain mutable value object. Homomorphic — preserves optionality. */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * NodeStyle fields the form takes **verbatim** — same name, same type. Derived
 * from {@link NodeStyle} via `Pick`, so their types track the engine and a
 * renamed/removed field surfaces here as a compile error (no silent drift).
 * Add a scalar passthrough control = add its key here.
 */
type NodeStylePassthroughFields = Mutable<
  Pick<
    NodeStyle,
    | 'size'
    | 'bgAlpha'
    | 'bgStrokeAlpha'
    | 'bgStrokeWidth'
    | 'bgStrokeAlignment'
    | 'bgStrokeCap'
    | 'bgStrokeJoin'
    | 'labelText'
    | 'labelFontSize'
    | 'labelPlacement'
    | 'labelOffsetX'
    | 'labelOffsetY'
  >
>;

/**
 * Fields whose form encoding deliberately **differs** from {@link NodeStyle},
 * so they can't be `Pick`ed — `mapping.ts` converts them:
 *  - `shape` discriminated union → `shapeKind` select + per-kind geometry numbers,
 *  - colours → hex strings (the design-kit swatch's encoding) not `0xRRGGBB`,
 *  - the `[dash, gap]` tuple → two number fields,
 *  - `labelFontWeight` narrowed to `number` (NodeStyle allows `number | string`).
 *
 * Drift on the *source* fields is still caught: `styleToForm` reads
 * `style.shape` / `style.bgFill` / `style.bgStrokeDashArray` / … directly, so a
 * rename in `NodeStyle` breaks `mapping.ts` at compile time.
 */
interface NodeStyleEncodedFields {
  shapeKind?: ShapeKind;
  radius?: number; // circle, regular-polygon
  width?: number; // rect
  height?: number; // rect
  cornerRadius?: number; // rect
  sides?: number; // regular-polygon
  points?: number; // star
  innerRadius?: number; // star
  outerRadius?: number; // star

  bgFill?: string; // #rrggbb
  bgStrokeColor?: string; // #rrggbb
  labelColor?: string; // #rrggbb

  bgStrokeDashLength?: number;
  bgStrokeDashGap?: number;

  labelFontWeight?: number;
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The passthrough
 * half is **derived from {@link NodeStyle}**; the rest is re-encoded for scalar
 * inputs (see {@link NodeStyleEncodedFields}). `styleToForm` / `formToStyle`
 * (`mapping.ts`) round-trip between this and `Partial<NodeStyle>`.
 */
export type NodeStyleFields = NodeStylePassthroughFields & NodeStyleEncodedFields;

/**
 * react-hook-form state shape. `<ObjectField name="style" …>` registers each
 * leaf under `style.<field>`, so the form's values nest under a `style` key.
 * This is the type the consumer parameterises its `useForm` with.
 */
export interface NodeStyleFormState {
  style: NodeStyleFields;
}
