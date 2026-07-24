/**
 * Types for the DrawEdgeBehaviour editor.
 *
 * Engine-agnostic by design: `@invana/graph` (where `DrawEdgeBehaviour` and its
 * options live) is **not** imported for values — canvas-ui mirrors the editable
 * option shape here as {@link DrawEdgeOptions}, a plain serialisable patch the
 * consumer applies via `setOptions`. The mirror is structural, not derived; keep
 * it in sync with `DrawEdgeBehaviourOptions` by hand.
 */

/**
 * The serialisable subset of `DrawEdgeBehaviourOptions` this editor produces.
 * The `createEdge` / `onEdgeCreate` **callbacks** and the base
 * `targetLayerId` / `enabled` / `shortcuts` are out of scope. `draftStyle` (the
 * rubber-band preview stroke) keeps its nested structure here; the flat form
 * splits it into prefixed scalars — see {@link DrawEdgeFields}. `draftStyle.color`
 * is an engine `0xRRGGBB` **number** (default `0x60a5fa`).
 */
export interface DrawEdgeOptions {
  allowSelfLoop?: boolean;
  draftStyle?: {
    /** Preview stroke colour as an engine `0xRRGGBB` number. */
    color?: number;
    width?: number;
    alpha?: number;
    /** `[dash, gap]` dash pattern. */
    dash?: [number, number];
  };
}

/**
 * Flat form-field shape the `@invana/forms` generator renders. The nested
 * `draftStyle` group is flattened to `draft`-prefixed scalars, and its
 * `dash: [number, number]` tuple is split into two number fields
 * (`draftDashLength` + `draftDashGap`) — `FieldType` has no tuple/array kind.
 */
export interface DrawEdgeFields {
  allowSelfLoop?: boolean;
  /** Preview stroke colour as a `#rrggbb` hex string (the swatch's format). */
  draftColor?: string;
  draftWidth?: number;
  draftAlpha?: number;
  /** Dash length (`draftStyle.dash[0]`). */
  draftDashLength?: number;
  /** Dash gap (`draftStyle.dash[1]`). */
  draftDashGap?: number;
}

/**
 * react-hook-form state shape. `<ObjectField name="options" …>` registers each
 * leaf under `options.<field>`, so the form's values nest under an `options` key.
 */
export interface DrawEdgeFormState {
  options: DrawEdgeFields;
}
