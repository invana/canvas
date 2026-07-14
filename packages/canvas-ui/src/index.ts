// @invana/canvas-ui — public API surface
//
// Reusable, engine-agnostic React UI components for Invana graph tools. Two
// tracks, kept apart as folders (see CLAUDE.md):
//   • `editors/` — STATE editors: forms (generated from `@invana/forms` field
//     schemas) that emit a serializable patch via `onSubmit`.
//   • `views/`   — PRESENTATIONAL components: props in, render out, no form.
//   • `shared/`  — colour utils / presets used by both.
// All form chrome comes from `@invana/forms` / `@invana/ui` so every Invana
// tool shares one visual language.

// ═══════════════════════════════════════════════════════════════════════════
// Editors
// ═══════════════════════════════════════════════════════════════════════════

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
// `SchemaEditor` — a titled list of typed fields (ER / table-card schema).
// Edits a `NodeSchema` (label + header colour + fields[{name,type}]) and emits
// it on Apply; the consumer writes it back to a node's data + redraws.
export {
  SchemaEditor,
  SCHEMA_TYPES,
  SCHEMA_TYPE_OPTIONS,
  SCHEMA_META_FIELDS,
  SCHEMA_FIELD_ROW,
  schemaToForm,
  formToSchema,
} from './editors/schema';
export type {
  SchemaEditorProps,
  NodeSchema,
  SchemaFieldDef,
  SchemaEditorFormState,
  SchemaMetaFields,
} from './editors/schema';
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
// The free-form **node/edge template designer** moved to its own package,
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

// ─── Behaviour / Layer / Layout settings editors ───────────────────────────
// Schema-driven editors for engine construction options (rule 12). Each is
// engine-agnostic: it mirrors the class's option shape as a local serialisable
// patch (no `@invana/canvas` / layout-package import) and the host applies it
// via `setOptions` (or a layout re-run). The `optionsToForm` / `formToOptions`
// mappers are aliased per surface since the names repeat across editors.

// WheelZoomBehaviour
export { WheelZoomEditor, wheelZoomFields } from './editors/wheel-zoom';
export {
  optionsToForm as wheelZoomOptionsToForm,
  formToOptions as wheelZoomFormToOptions,
} from './editors/wheel-zoom';
export type {
  WheelZoomEditorProps,
  WheelZoomFields,
  WheelZoomFormState,
  WheelZoomOptions,
} from './editors/wheel-zoom';

// BackgroundLayer
export { BackgroundLayerEditor, backgroundLayerFields } from './editors/background-layer';
export {
  optionsToForm as backgroundLayerOptionsToForm,
  formToOptions as backgroundLayerFormToOptions,
} from './editors/background-layer';
export type {
  BackgroundLayerEditorProps,
  BackgroundLayerFields,
  BackgroundLayerFormState,
  BackgroundLayerOptions,
  BackgroundType,
  BackgroundPatternType,
  BackgroundMode,
} from './editors/background-layer';

// GeometricLayout
export {
  GeometricLayoutEditor,
  geometricLayoutFields,
  modeFields,
} from './editors/geometric-layout';


// ─────────────────────────────────────────────────────────────────────────
// Behaviour / Layer / Layout settings editors — full engine coverage (rule 12).
// Each mirrors a class's serialisable options; the aliased optionsToForm /
// formToOptions mappers seed + read back per surface.
// ─────────────────────────────────────────────────────────────────────────

// DragPanBehaviour
export { DragPanEditor, dragPanFields } from './editors/drag-pan';
export {
  optionsToForm as dragPanOptionsToForm,
  formToOptions as dragPanFormToOptions,
} from './editors/drag-pan';
export type {
  DragPanEditorProps,
  DragPanFields,
  DragPanFormState,
  DragPanOptions,
} from './editors/drag-pan';

// PinchZoomBehaviour
export { PinchZoomEditor, pinchZoomFields } from './editors/pinch-zoom';
export {
  optionsToForm as pinchZoomOptionsToForm,
  formToOptions as pinchZoomFormToOptions,
} from './editors/pinch-zoom';
export type {
  PinchZoomEditorProps,
  PinchZoomFields,
  PinchZoomFormState,
  PinchZoomOptions,
} from './editors/pinch-zoom';

// KeyboardCameraInputBehaviour
export { KeyboardCameraEditor, keyboardCameraFields } from './editors/keyboard-camera';
export {
  optionsToForm as keyboardCameraOptionsToForm,
  formToOptions as keyboardCameraFormToOptions,
} from './editors/keyboard-camera';
export type {
  KeyboardCameraEditorProps,
  KeyboardCameraFields,
  KeyboardCameraFormState,
  KeyboardCameraOptions,
} from './editors/keyboard-camera';

// DragShapeBehaviour
export { DragShapeEditor, dragShapeFields } from './editors/drag-shape';
export {
  optionsToForm as dragShapeOptionsToForm,
  formToOptions as dragShapeFormToOptions,
} from './editors/drag-shape';
export type {
  DragShapeEditorProps,
  DragShapeFields,
  DragShapeFormState,
  DragShapeOptions,
} from './editors/drag-shape';

// DevInfoLayer
export { DevInfoLayerEditor, devInfoLayerFields } from './editors/dev-info-layer';
export {
  optionsToForm as devInfoLayerOptionsToForm,
  formToOptions as devInfoLayerFormToOptions,
} from './editors/dev-info-layer';
export type {
  DevInfoLayerEditorProps,
  DevInfoLayerFields,
  DevInfoLayerFormState,
  DevInfoLayerOptions,
} from './editors/dev-info-layer';

// ClickSelectBehaviour
export { ClickSelectEditor, clickSelectFields } from './editors/click-select';
export {
  optionsToForm as clickSelectOptionsToForm,
  formToOptions as clickSelectFormToOptions,
} from './editors/click-select';
export type {
  ClickSelectEditorProps,
  ClickSelectFields,
  ClickSelectFormState,
  ClickSelectOptions,
} from './editors/click-select';

// ClickInspectBehaviour
export { ClickInspectEditor, clickInspectFields } from './editors/click-inspect';
export {
  optionsToForm as clickInspectOptionsToForm,
  formToOptions as clickInspectFormToOptions,
} from './editors/click-inspect';
export type {
  ClickInspectEditorProps,
  ClickInspectFields,
  ClickInspectFormState,
  ClickInspectOptions,
} from './editors/click-inspect';

// ClickViewBehaviour
export { ClickViewEditor, clickViewFields } from './editors/click-view';
export {
  optionsToForm as clickViewOptionsToForm,
  formToOptions as clickViewFormToOptions,
} from './editors/click-view';
export type {
  ClickViewEditorProps,
  ClickViewFields,
  ClickViewFormState,
  ClickViewOptions,
} from './editors/click-view';

// BrushSelectBehaviour
export { BrushSelectEditor, brushSelectFields } from './editors/brush-select';
export {
  optionsToForm as brushSelectOptionsToForm,
  formToOptions as brushSelectFormToOptions,
} from './editors/brush-select';
export type {
  BrushSelectEditorProps,
  BrushSelectFields,
  BrushSelectFormState,
  BrushSelectOptions,
} from './editors/brush-select';

// LassoSelectBehaviour
export { LassoSelectEditor, lassoSelectFields } from './editors/lasso-select';
export {
  optionsToForm as lassoSelectOptionsToForm,
  formToOptions as lassoSelectFormToOptions,
} from './editors/lasso-select';
export type {
  LassoSelectEditorProps,
  LassoSelectFields,
  LassoSelectFormState,
  LassoSelectOptions,
} from './editors/lasso-select';

// HoverActivateBehaviour
export { HoverActivateEditor, hoverActivateFields } from './editors/hover-activate';
export {
  optionsToForm as hoverActivateOptionsToForm,
  formToOptions as hoverActivateFormToOptions,
} from './editors/hover-activate';
export type {
  HoverActivateEditorProps,
  HoverActivateFields,
  HoverActivateFormState,
  HoverActivateOptions,
} from './editors/hover-activate';

// HoverElementPreviewBehaviour
export { HoverElementPreviewEditor, hoverElementPreviewFields } from './editors/hover-element-preview';
export {
  optionsToForm as hoverElementPreviewOptionsToForm,
  formToOptions as hoverElementPreviewFormToOptions,
} from './editors/hover-element-preview';
export type {
  HoverElementPreviewEditorProps,
  HoverElementPreviewFields,
  HoverElementPreviewFormState,
  HoverElementPreviewOptions,
} from './editors/hover-element-preview';

// DragNodeBehaviour
export { DragNodeEditor, dragNodeFields } from './editors/drag-node';
export {
  optionsToForm as dragNodeOptionsToForm,
  formToOptions as dragNodeFormToOptions,
} from './editors/drag-node';
export type {
  DragNodeEditorProps,
  DragNodeFields,
  DragNodeFormState,
  DragNodeOptions,
} from './editors/drag-node';

// NodeResizeBehaviour
export { NodeResizeEditor, nodeResizeFields } from './editors/node-resize';
export {
  optionsToForm as nodeResizeOptionsToForm,
  formToOptions as nodeResizeFormToOptions,
} from './editors/node-resize';
export type {
  NodeResizeEditorProps,
  NodeResizeFields,
  NodeResizeFormState,
  NodeResizeOptions,
} from './editors/node-resize';

// CollapseExpandBehaviour
export { CollapseExpandEditor, collapseExpandFields } from './editors/collapse-expand';
export {
  optionsToForm as collapseExpandOptionsToForm,
  formToOptions as collapseExpandFormToOptions,
} from './editors/collapse-expand';
export type {
  CollapseExpandEditorProps,
  CollapseExpandFields,
  CollapseExpandFormState,
  CollapseExpandOptions,
} from './editors/collapse-expand';

// CreateNodeBehaviour
export { CreateNodeEditor, createNodeFields } from './editors/create-node';
export {
  optionsToForm as createNodeOptionsToForm,
  formToOptions as createNodeFormToOptions,
} from './editors/create-node';
export type {
  CreateNodeEditorProps,
  CreateNodeFields,
  CreateNodeFormState,
  CreateNodeOptions,
} from './editors/create-node';

// DrawEdgeBehaviour
export { DrawEdgeEditor, drawEdgeFields } from './editors/draw-edge';
export {
  optionsToForm as drawEdgeOptionsToForm,
  formToOptions as drawEdgeFormToOptions,
} from './editors/draw-edge';
export type {
  DrawEdgeEditorProps,
  DrawEdgeFields,
  DrawEdgeFormState,
  DrawEdgeOptions,
} from './editors/draw-edge';

// EraseBehaviour
export { EraseEditor, eraseFields } from './editors/erase';
export {
  optionsToForm as eraseOptionsToForm,
  formToOptions as eraseFormToOptions,
} from './editors/erase';
export type {
  EraseEditorProps,
  EraseFields,
  EraseFormState,
  EraseOptions,
} from './editors/erase';

// ContextMenuBehaviour
export { ContextMenuEditor, contextMenuFields } from './editors/context-menu';
export {
  optionsToForm as contextMenuOptionsToForm,
  formToOptions as contextMenuFormToOptions,
} from './editors/context-menu';
export type {
  ContextMenuEditorProps,
  ContextMenuFields,
  ContextMenuFormState,
  ContextMenuOptions,
} from './editors/context-menu';

// ColorByLabelBehaviour
export { ColorByLabelEditor, colorByLabelFields } from './editors/color-by-label';
export {
  optionsToForm as colorByLabelOptionsToForm,
  formToOptions as colorByLabelFormToOptions,
} from './editors/color-by-label';
export type {
  ColorByLabelEditorProps,
  ColorByLabelFields,
  ColorByLabelFormState,
  ColorByLabelOptions,
} from './editors/color-by-label';

// ThemeBehaviour
export { ThemeEditor, themeFields } from './editors/theme';
export {
  optionsToForm as themeOptionsToForm,
  formToOptions as themeFormToOptions,
} from './editors/theme';
export type {
  ThemeEditorProps,
  ThemeFields,
  ThemeFormState,
  ThemeOptions,
} from './editors/theme';

// DegreeSizeBehaviour
export { DegreeSizeEditor, degreeSizeFields } from './editors/degree-size';
export {
  optionsToForm as degreeSizeOptionsToForm,
  formToOptions as degreeSizeFormToOptions,
} from './editors/degree-size';
export type {
  DegreeSizeEditorProps,
  DegreeSizeFields,
  DegreeSizeFormState,
  DegreeSizeOptions,
} from './editors/degree-size';

// Content-LOD behaviours (TextLODBehaviour / IconLODBehaviour / ImageLODBehaviour)
// share one option shape (a { minZoom, maxZoom } zoom band), so one editor serves
// all three. `ContentLODEditor` is the canonical component; the per-behaviour
// names alias it for discoverability + the per-behaviour editor convention.
export {
  ContentLODEditor,
  ContentLODEditor as TextLODEditor,
  ContentLODEditor as IconLODEditor,
  ContentLODEditor as ImageLODEditor,
  contentLODFields,
  textLODFields,
} from './editors/content-lod';
export {
  optionsToForm as contentLODOptionsToForm,
  formToOptions as contentLODFormToOptions,
} from './editors/content-lod';
export type {
  ContentLODEditorProps,
  ContentLODEditorProps as TextLODEditorProps,
  ContentLODEditorProps as IconLODEditorProps,
  ContentLODEditorProps as ImageLODEditorProps,
  ContentLODFields,
  ContentLODFormState,
  ContentLODOptions,
} from './editors/content-lod';

// ParallelEdgeBehaviour
export { ParallelEdgeEditor, parallelEdgeFields } from './editors/parallel-edge';
export {
  optionsToForm as parallelEdgeOptionsToForm,
  formToOptions as parallelEdgeFormToOptions,
} from './editors/parallel-edge';
export type {
  ParallelEdgeEditorProps,
  ParallelEdgeFields,
  ParallelEdgeFormState,
  ParallelEdgeOptions,
} from './editors/parallel-edge';

// TextResolutionLODBehaviour
export { TextResolutionLODEditor, textResolutionLodFields } from './editors/text-resolution-lod';
export {
  optionsToForm as textResolutionLodOptionsToForm,
  formToOptions as textResolutionLodFormToOptions,
} from './editors/text-resolution-lod';
export type {
  TextResolutionLODEditorProps,
  TextResolutionLODFields,
  TextResolutionLODFormState,
  TextResolutionLODOptions,
} from './editors/text-resolution-lod';

// NodeSizeLODBehaviour
export { NodeSizeLODEditor, nodeSizeLodFields } from './editors/node-size-lod';
export {
  optionsToForm as nodeSizeLodOptionsToForm,
  formToOptions as nodeSizeLodFormToOptions,
} from './editors/node-size-lod';
export type {
  NodeSizeLODEditorProps,
  NodeSizeLODFields,
  NodeSizeLODFormState,
  NodeSizeLODOptions,
} from './editors/node-size-lod';

// EdgeSizeLODBehaviour
export { EdgeSizeLODEditor, edgeSizeLodFields } from './editors/edge-size-lod';
export {
  optionsToForm as edgeSizeLodOptionsToForm,
  formToOptions as edgeSizeLodFormToOptions,
} from './editors/edge-size-lod';
export type {
  EdgeSizeLODEditorProps,
  EdgeSizeLODFields,
  EdgeSizeLODFormState,
  EdgeSizeLODOptions,
} from './editors/edge-size-lod';

// LabelCollisionBehaviour
export { LabelCollisionEditor, labelCollisionFields } from './editors/label-collision';
export {
  optionsToForm as labelCollisionOptionsToForm,
  formToOptions as labelCollisionFormToOptions,
} from './editors/label-collision';
export type {
  LabelCollisionEditorProps,
  LabelCollisionFields,
  LabelCollisionFormState,
  LabelCollisionOptions,
} from './editors/label-collision';

// MiniMapLayer
export { MiniMapLayerEditor, miniMapLayerFields } from './editors/minimap-layer';
export {
  optionsToForm as miniMapLayerOptionsToForm,
  formToOptions as miniMapLayerFormToOptions,
} from './editors/minimap-layer';
export type {
  MiniMapLayerEditorProps,
  MiniMapLayerFields,
  MiniMapLayerFormState,
  MiniMapLayerOptions,
} from './editors/minimap-layer';

// D3ForceLayout
export { D3ForceLayoutEditor, d3ForceLayoutFields } from './editors/d3-force-layout';
export {
  optionsToForm as d3ForceLayoutOptionsToForm,
  formToOptions as d3ForceLayoutFormToOptions,
} from './editors/d3-force-layout';
export type {
  D3ForceLayoutEditorProps,
  D3ForceLayoutFields,
  D3ForceLayoutFormState,
  D3ForceLayoutOptions,
} from './editors/d3-force-layout';

// ElkLayout
export { ElkLayoutEditor, elkLayoutFields } from './editors/elk-layout';
export {
  optionsToForm as elkLayoutOptionsToForm,
  formToOptions as elkLayoutFormToOptions,
} from './editors/elk-layout';
export type {
  ElkLayoutEditorProps,
  ElkLayoutFields,
  ElkLayoutFormState,
  ElkLayoutOptions,
} from './editors/elk-layout';

// D3HierarchyLayout
export { D3HierarchyLayoutEditor, d3HierarchyLayoutFields } from './editors/d3-hierarchy-layout';
export {
  optionsToForm as d3HierarchyLayoutOptionsToForm,
  formToOptions as d3HierarchyLayoutFormToOptions,
} from './editors/d3-hierarchy-layout';
export type {
  D3HierarchyLayoutEditorProps,
  D3HierarchyLayoutFields,
  D3HierarchyLayoutFormState,
  D3HierarchyLayoutOptions,
} from './editors/d3-hierarchy-layout';

// D3SankeyLayout
export { D3SankeyLayoutEditor, d3SankeyLayoutFields } from './editors/d3-sankey-layout';
export {
  optionsToForm as d3SankeyLayoutOptionsToForm,
  formToOptions as d3SankeyLayoutFormToOptions,
} from './editors/d3-sankey-layout';
export type {
  D3SankeyLayoutEditorProps,
  D3SankeyLayoutFields,
  D3SankeyLayoutFormState,
  D3SankeyLayoutOptions,
} from './editors/d3-sankey-layout';

// DensityContourFillLayer
export { DensityContourFillLayerEditor, densityContourFillLayerFields } from './editors/density-contour-fill-layer';
export {
  optionsToForm as densityContourFillLayerOptionsToForm,
  formToOptions as densityContourFillLayerFormToOptions,
} from './editors/density-contour-fill-layer';
export type {
  DensityContourFillLayerEditorProps,
  DensityContourFillLayerFields,
  DensityContourFillLayerFormState,
  DensityContourFillLayerOptions,
} from './editors/density-contour-fill-layer';

// DensityContourStrokeLayer
export { DensityContourStrokeLayerEditor, densityContourStrokeLayerFields } from './editors/density-contour-stroke-layer';
export {
  optionsToForm as densityContourStrokeLayerOptionsToForm,
  formToOptions as densityContourStrokeLayerFormToOptions,
} from './editors/density-contour-stroke-layer';
export type {
  DensityContourStrokeLayerEditorProps,
  DensityContourStrokeLayerFields,
  DensityContourStrokeLayerFormState,
  DensityContourStrokeLayerOptions,
} from './editors/density-contour-stroke-layer';

// BubbleSetsLayer
export { BubbleSetsLayerEditor, bubbleSetsLayerFields } from './editors/bubble-sets-layer';
export {
  optionsToForm as bubbleSetsLayerOptionsToForm,
  formToOptions as bubbleSetsLayerFormToOptions,
} from './editors/bubble-sets-layer';
export type {
  BubbleSetsLayerEditorProps,
  BubbleSetsLayerFields,
  BubbleSetsLayerFormState,
  BubbleSetsLayerOptions,
} from './editors/bubble-sets-layer';

// MapLayer
export { MapLayerEditor, mapLayerFields } from './editors/map-layer';
export {
  optionsToForm as mapLayerOptionsToForm,
  formToOptions as mapLayerFormToOptions,
} from './editors/map-layer';
export type {
  MapLayerEditorProps,
  MapLayerFields,
  MapLayerFormState,
  MapLayerOptions,
} from './editors/map-layer';
export {
  optionsToForm as geometricLayoutOptionsToForm,
  formToOptions as geometricLayoutFormToOptions,
} from './editors/geometric-layout';
export type {
  GeometricLayoutEditorProps,
  GeometricLayoutFields,
  GeometricLayoutFormState,
  GeometricLayoutOptions,
  GeometricLayoutMode,
} from './editors/geometric-layout';

// ═══════════════════════════════════════════════════════════════════════════
// Views
// ═══════════════════════════════════════════════════════════════════════════

// ─── Preview cards ───────────────────────────────────────────────────────
// Presentational node / edge hover-preview cards — engine-agnostic props-in UI
// (only `@invana/ui` chrome). A turnkey (e.g. canvas-react `<HoverElementPreviewBehaviour>`)
// owns positioning + interactivity and renders these as content.
export { NodePreviewCard, EdgePreviewCard } from './views/preview-cards';
export type {
  NodePreviewCardProps,
  EdgePreviewCardProps,
  PreviewCardRow,
} from './views/preview-cards';

// ─── Layers panel ──────────────────────────────────────────────────────────
// Photoshop-style canvas Layers browser over a live `GraphCanvas` — layer
// visibility eyes + the Graph layer's nodes/edges grouped by type with per-
// element Hide/Show. Engine-bound (takes a live canvas) but import-clean
// (`@invana/graph` types only, `@invana/ui` chrome). See its module header.
export { LayersPanelView } from './views/layers-panel';
export type { LayersPanelViewProps } from './views/layers-panel';

// ═══════════════════════════════════════════════════════════════════════════
// Shared
// ═══════════════════════════════════════════════════════════════════════════
// Colour swatch palette shared across editors, and the `0xRRGGBB` ↔ `#rrggbb`
// helpers that bridge engine colours and the design-kit colour swatch.
export { COLOR_PRESETS } from './shared/colors';
export { numberToHex, hexToNumber } from './shared/color';
