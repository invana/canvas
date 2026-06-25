// @invana/canvas-ui — public API surface
//
// Reusable, engine-agnostic React UI components for Invana graph tools.
// Forms are generated from declarative `@invana/forms` field schemas (the
// design-kit form-generator) rather than hand-authored — see CLAUDE.md. All
// form chrome comes from `@invana/forms` / `@invana/ui` so every Invana tool
// shares one visual language.

// ─── Node style editor ───────────────────────────────────────────────────
export {
  NodeStyleEditor,
  // field configs + mapping — supply/override the schema, seed (`styleToForm`),
  // and read edits back (`formToStyle`)
  nodeStyleFields,
  geometryFields,
  BACKGROUND_FIELDS,
  STROKE_FIELDS,
  LABEL_FIELDS,
  styleToForm,
  formToStyle,
  defaultShapeFor,
} from './editors/node-style';
export type {
  NodeStyleEditorProps,
  NodeStyleFields,
  NodeStyleFormState,
  ShapeKind,
  StrokeAlignment,
  StrokeCap,
  StrokeJoin,
  LabelPlacement,
} from './editors/node-style';

// ─── Preview cards ───────────────────────────────────────────────────────
// Presentational node / edge hover-preview cards — engine-agnostic props-in UI
// (only `@invana/ui` chrome). A turnkey (e.g. canvas-react `<HoverElementPreviewBehaviour>`)
// owns positioning + interactivity and renders these as content.
export { NodePreviewCard, EdgePreviewCard } from './cards/preview-cards';
export type {
  NodePreviewCardProps,
  EdgePreviewCardProps,
  PreviewCardRow,
} from './cards/preview-cards';

// ─── Shared presets + utils ──────────────────────────────────────────────
// Colour swatch palette shared across editors, and the `0xRRGGBB` ↔ `#rrggbb`
// helpers that bridge engine colours and the design-kit colour swatch.
export { COLOR_PRESETS } from './presets/colors';
export { numberToHex, hexToNumber } from './utils/color';
