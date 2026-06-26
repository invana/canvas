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

// ─── Hover-preview-card editor ─────────────────────────────────────────────
// Engine-agnostic form (à la NodeStyleEditor) that produces one serializable
// `HoverElementPreviewCardSpec` — the per-type card definition. Compose one per
// node/edge type to build the behaviour's `cards` config from a UI.
export {
  HoverPreviewCardEditor,
  CARD_SCALAR_FIELDS,
  CARD_ROW_FIELDS,
  specToForm,
  formToSpec,
} from './editors/hover-preview-card';
export type {
  HoverPreviewCardEditorProps,
  CardSpecFields,
  CardScalarFields,
  CardRowField,
  CardImageShape,
} from './editors/hover-preview-card';

// ─── Node template editors ────────────────────────────────────────────────
// Schema-driven editors for the three-layer node model: a `NodeStructureEditor`
// (per-type binding — structure + styling + the slot→data-field map) and a
// `NodeStylingEditor` (roles + typography). Both produce pure JSON the host
// pushes via `canvas.update({ layers: { graph: { … } } })`.
export {
  NodeStructureEditor,
  bindingScalarFields,
  bindingToForm,
  formToBinding,
} from './editors/node-structure';
export type {
  NodeStructureEditorProps,
  NodeStructureFormState,
  NodeStructureScalarFields,
  BindingRow,
} from './editors/node-structure';
export {
  NodeStylingEditor,
  STYLING_SCALAR_FIELDS,
  SIMPLE_STYLING_FIELDS,
  CARD_STYLING_FIELDS,
  SLOT_STYLING_FIELDS,
  stylingToForm,
  formToStyling,
} from './editors/node-styling';
export type {
  NodeStylingEditorProps,
  NodeStylingFormState,
  NodeStylingScalarFields,
  SlotStylingRow,
} from './editors/node-styling';
// The free-form **node card designer** moved to its own package,
// `@invana/canvas-designer` — it's a heavy authoring tool (drag canvas, layers,
// undo/redo, save/load), so consumers who only render templates don't pull it
// in. It depends on the shared field helpers below.

// Shared field-schema helpers (colour-role select + the `SlotBindingField`).
export {
  COLOR_ROLES,
  COLOR_ROLE_OPTIONS,
  NO_ROLE,
  SLOT_BINDING_FIELDS,
  roleField,
  asRole,
} from './editors/field-helpers';

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
