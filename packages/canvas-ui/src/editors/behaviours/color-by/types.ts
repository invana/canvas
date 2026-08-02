/**
 * Types for the `ColorByBehaviour` editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `ColorByBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link ColorByOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `ColorByBehaviourOptions` by hand.
 */

/** Which colouring job — mirrors the engine's `ColorByMode`. */
export type ColorByModeValue = 'category' | 'range';

/** Curve / binning — mirrors the engine's `ColorByScale`. */
export type ColorByScaleValue = 'linear' | 'sqrt' | 'log' | 'quantile' | 'threshold';

/**
 * The serialisable subset of `ColorByBehaviourOptions` this editor produces.
 *
 * Out of scope: the `nodeValueBy` / `edgeValueBy` **accessor callbacks** (they're
 * functions — not editable, not persistable) and the base `targetLayerId` /
 * `enabled` / `shortcuts`. Also omitted: `palette` (`number[]`) and
 * `valueColors` (`Record<string, number>`) — `FieldType` has no array or map
 * kind, so a swatch-array / value-swatch-pair editor is future work.
 *
 * Colours are engine `0xRRGGBB` **numbers** here; the form carries `#rrggbb`
 * strings (see {@link ColorByFields}).
 */
export interface ColorByOptions {
  mode?: ColorByModeValue;
  /** Root-relative dot path driving node colour — `'type'`, `'data.riskScore'`. */
  nodeValueKey?: string;
  /** Root-relative dot path driving edge colour. */
  edgeValueKey?: string;
  colorNodes?: boolean;
  colorEdges?: boolean;
  /** Colour for missing / non-numeric values, as an engine `0xRRGGBB` number. */
  fallbackColor?: number;
  /** Cardinality cap for `'category'`. */
  maxCategories?: number;
  scale?: ColorByScaleValue;
  /** Explicit `[min, max]` for node values; omit for auto-scan. */
  nodeDomain?: readonly [number, number];
  /** Explicit `[min, max]` for edge values; omit for auto-scan. */
  edgeDomain?: readonly [number, number];
  /** Bucket count for `scale: 'quantile'`. */
  bins?: number;
  /** Explicit bucket edges for `scale: 'threshold'`, node units. */
  nodeThresholds?: readonly number[];
  /** Explicit bucket edges for `scale: 'threshold'`, edge units. */
  edgeThresholds?: readonly number[];
}

/**
 * Flat form-field shape the `@invana/forms` generator renders.
 *
 * Three encodings `FieldType` can't express directly:
 * - `fallbackColor` — the `0xRRGGBB` number as a `#rrggbb` hex string.
 * - `*Domain` — the `[min, max]` tuple split into two number fields, so either
 *   bound can be cleared independently (both blank = auto-scan).
 * - `*Thresholds` — the `number[]` as a comma-separated text field.
 */
export interface ColorByFields {
  mode?: ColorByModeValue;
  nodeValueKey?: string;
  edgeValueKey?: string;
  colorNodes?: boolean;
  colorEdges?: boolean;
  /** Fallback colour as a `#rrggbb` hex string. */
  fallbackColor?: string;
  maxCategories?: number;
  scale?: ColorByScaleValue;
  nodeDomainMin?: number;
  nodeDomainMax?: number;
  edgeDomainMin?: number;
  edgeDomainMax?: number;
  bins?: number;
  /** Comma-separated bucket edges, e.g. `"10, 50, 200"`. */
  nodeThresholds?: string;
  /** Comma-separated bucket edges, e.g. `"10, 50, 200"`. */
  edgeThresholds?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface ColorByFormState {
  options: ColorByFields;
}
