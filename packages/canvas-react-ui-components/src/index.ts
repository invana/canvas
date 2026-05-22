// @invana/canvas-react-ui-components — public API surface
//
// Reusable React UI components for tools built on @invana/canvas-react.
// Every primitive is sourced from the @invana/ui design-kit so all Invana
// tools share one visual language. Only conversion-glue wrappers live in
// this package (ColorField, NumberField, SliderField, DashArrayField);
// straight-passthrough controls (Select / Switch / Input) are used from
// `@invana/ui` directly inside section components — see CLAUDE.md.

// ─── Node style editor ───────────────────────────────────────────────────
export {
  NodeStyleEditor,
  NodeStyleForm,
  NODE_STYLE_SECTIONS,
  seedFormFromLayer,
  commitFormToLayer,
  dirtyKeys,
} from './editors/node-style';
export type {
  NodeStyleEditorProps,
  NodeStyleFormProps,
  NodeStyleFormValue,
  NodeStyleSectionId,
} from './editors/node-style';

// ─── Conversion-glue field primitives ────────────────────────────────────
// Exported so consumers can compose custom editors with the same
// number ↔ string / hex ↔ int / [n] ↔ n conversion behaviour the built-in
// editor uses. Anything that's a thin pass-through (Select, Switch,
// plain text Input) should be imported from `@invana/ui` directly.
export {
  ColorField,
  NumberField,
  SliderField,
  DashArrayField,
  numberToHex,
  hexToNumber,
} from './primitives';
export type {
  ColorFieldProps,
  NumberFieldProps,
  SliderFieldProps,
  DashArrayFieldProps,
} from './primitives';
