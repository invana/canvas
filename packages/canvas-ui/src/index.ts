// @invana/canvas-ui — public API surface
//
// The React UI kit for @invana/canvas, built on @invana/canvas-react's hooks so
// it couples to @invana/canvas-store and is live by default. Folder tracks (see
// CLAUDE.md): components/ (dumb blocks) · toolbars/ · menus/ · panels/ (store-
// connected) · editors/ (schema state editors) · views/ (presentational) ·
// apps/ (GraphCanvasApp) · hooks/ (turnkey) · behaviours/ (UI-rendering wrappers).
// All chrome comes from @invana/forms / @invana/ui for one visual language.

// ═══════════════════════════════════════════════════════════════════════════
// Editors
// ═══════════════════════════════════════════════════════════════════════════

// ─── Canvas settings editor ────────────────────────────────────────────────
// One JSON-driven editor over the whole canvas definition (all layers /
// behaviours / layouts + their settings). Resolves each instance's form from the
// built-in schema registry (`kind` → fields + engine⇄form mappers) and hands
// edits back as engine-shaped patches. Supersedes the per-surface editors as the
// delivery vehicle; the `*Fields` / `optionsToForm` / `formToOptions` exports
// below feed its registry.
export {
  CanvasSettingsEditor,
  DEFAULT_CANVAS_SETTINGS_SCHEMAS,
} from './editors/canvas-settings';
export type {
  CanvasSettingsEditorProps,
  SettingsSchemaEntry,
  CanvasSettingsDefinition,
  CanvasSettingsInstance,
  SettingsSection,
} from './editors/canvas-settings';

// ═══════════════════════════════════════════════════════════════════════════
// Panels (store-connected)
// ═══════════════════════════════════════════════════════════════════════════
// Self-wiring smart panels: drop into a <Canvas>/<GraphCanvas>/GraphCanvasApp
// subtree and they bind to that canvas via context (multi-canvas safe), reading
// and writing @invana/canvas-store through @invana/canvas-react hooks — no props.
// `CanvasSettingsPanel` packages the introspection↔CanvasSettingsEditor bridge.
export { CanvasSettingsPanel, type CanvasSettingsPanelProps } from './panels/canvas-settings';

// ─── Node style editors ──────────────────────────────────────────────────
// `NodeStyleEditor` dispatches on the `kind` prop to the full-spec **simple**
// editor (flat `NodeStyle`) or the full-spec **composite** editor (a
// `CompositeShapeOption`). Both variants + their field configs + mappers are
// exported for standalone use.
export {
  NodeStyleEditor,
  SimpleNodeStyleEditor,
  CompositeNodeStyleEditor,
  // simple: field configs + mapping — supply/override the schema, seed
  // (`styleToForm`), and read edits back (`formToStyle`). `basic*`/`advanced*`
  // are the two-tier default split (basics vs. the collapsed advanced set).
  nodeStyleFields,
  basicNodeStyleFields,
  advancedNodeStyleFields,
  geometryFields,
  BACKGROUND_FIELDS,
  STROKE_FIELDS,
  LABEL_FIELDS,
  styleToForm,
  formToStyle,
  defaultShapeFor,
  // composite: field configs + mapping (`compositeToForm` / `formToComposite`)
  compositeScalarFields,
  basicCompositeFields,
  advancedCompositeScalarFields,
  rootFields,
  partRowFields,
  compositeToForm,
  formToComposite,
} from './editors/node-style';
export type {
  NodeStyleEditorProps,
  SimpleNodeStyleEditorProps,
  CompositeNodeStyleEditorProps,
  NodeStyleFields,
  NodeStyleFormState,
  ShapeKind,
  StrokeAlignment,
  StrokeCap,
  StrokeJoin,
  LabelPlacement,
  CompositeFormState,
  CompositeScalarFields,
  CompositePartRow,
  CompositeRootKind,
  CompositePartKind,
  CompositeIconKind,
} from './editors/node-style';

// ─── Node style overview editor ────────────────────────────────────────────
// A minimal colour-only editor that recolours a node. `recolorNodeStyle` turns
// the chosen colour into the right patch for a simple shape (`bgFill`) or a
// composite card (body + accent parts), so one control works for both kinds.
export {
  NodeStyleOverviewEditor,
  nodeStyleOverviewFields,
  colorToForm,
  formToColor,
  recolorNodeStyle,
} from './editors/node-style-overview';
export type {
  NodeStyleOverviewEditorProps,
  NodeStyleOverviewFields,
  NodeStyleOverviewFormState,
} from './editors/node-style-overview';

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

// NodeCentralityBehaviour
export { NodeCentralityEditor, nodeCentralityFields } from './editors/node-centrality';
export {
  optionsToForm as nodeCentralityOptionsToForm,
  formToOptions as nodeCentralityFormToOptions,
} from './editors/node-centrality';
export type {
  NodeCentralityEditorProps,
  NodeCentralityFields,
  NodeCentralityFormState,
  NodeCentralityOptions,
} from './editors/node-centrality';

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

// EdgeLODBehaviour (thin edges below a zoom threshold)
export { EdgeLODEditor, edgeLODFields } from './editors/edge-lod';
export {
  optionsToForm as edgeLODOptionsToForm,
  formToOptions as edgeLODFormToOptions,
} from './editors/edge-lod';
export type {
  EdgeLODEditorProps,
  EdgeLODFields,
  EdgeLODFormState,
  EdgeLODKeepBy,
  EdgeLODOptions,
} from './editors/edge-lod';

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

// NodeScaleLODBehaviour
export { NodeScaleLODEditor, nodeScaleLodFields } from './editors/node-scale-lod';
export {
  optionsToForm as nodeScaleLodOptionsToForm,
  formToOptions as nodeScaleLodFormToOptions,
} from './editors/node-scale-lod';
export type {
  NodeScaleLODEditorProps,
  NodeScaleLODFields,
  NodeScaleLODFormState,
  NodeScaleLODOptions,
} from './editors/node-scale-lod';

// EdgeScaleLODBehaviour
export { EdgeScaleLODEditor, edgeScaleLodFields } from './editors/edge-scale-lod';
export {
  optionsToForm as edgeScaleLodOptionsToForm,
  formToOptions as edgeScaleLodFormToOptions,
} from './editors/edge-scale-lod';
export type {
  EdgeScaleLODEditorProps,
  EdgeScaleLODFields,
  EdgeScaleLODFormState,
  EdgeScaleLODOptions,
} from './editors/edge-scale-lod';

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
export { NodePreviewCard, EdgePreviewCard } from './view-panels/preview-cards';
export type {
  NodePreviewCardProps,
  EdgePreviewCardProps,
  PreviewCardRow,
} from './view-panels/preview-cards';

// ─── Layers panel ──────────────────────────────────────────────────────────
// Photoshop-style canvas Layers browser over a live `GraphCanvas` — layer
// visibility eyes + the Graph layer's nodes/edges grouped by type with per-
// element Hide/Show. Engine-bound (takes a live canvas) but import-clean
// (`@invana/graph` types only, `@invana/ui` chrome). See its module header.
export { LayersViewPanel } from './view-panels/layers';
export type { LayersViewPanelProps } from './view-panels/layers';

// ─── Hidden elements ─────────────────────────────────────────────────────────
// A live list of the elements explicitly hidden on a `GraphCanvas`, with per-item
// + "Show all" restore — the companion to `LayersViewPanel` (which hides) and to
// `GraphContextMenu`'s Hide action. Engine-bound (takes a live canvas) but
// import-clean (`@invana/graph` types only, `@invana/ui` chrome).
export { CanvasFiltersViewPanel } from './view-panels/canvas-filters';
export type { CanvasFiltersViewPanelProps } from './view-panels/canvas-filters';

// ─── Canvas pages tab strip ──────────────────────────────────────────────────
// A tab strip over independent "pages" (boards), styled like `@invana/ui`'s
// `TabbedPanel` but with per-tab **edit** + **close** controls revealed on hover.
// Presentational + engine-agnostic; keeps inactive pages mounted (state kept) by
// default so a canvas per page survives tab switches. See its module header.
export { CanvasPagesViewPanel } from './view-panels/canvas-pages';
export type {
  CanvasHeaderAction,
  CanvasPage,
  CanvasPageMenuItem,
  CanvasPagesViewPanelProps,
} from './view-panels/canvas-pages';

// ─── Schema view ─────────────────────────────────────────────────────────────
// The graph's *schema* (its node/edge types + connectivity), derived live from a
// source `GraphCanvas` and rendered by `SchemaViewPanel` as an interactive metagraph
// in a nested engine instance — simple discs or composite ER **table** cards, with
// a top `SchemaToolbar` (nodes · layout · edges · fit). Engine-bound (takes a live
// canvas). The `deriveSchema` core + `useDerivedSchema` hook are reusable standalone.
export {
  SchemaViewPanel,
  SCHEMA_METAGRAPH_LAYER_ID,
  useDerivedSchema,
  deriveSchema,
  schemaSignature,
  schemaToMetaGraph,
  typeColor,
  defaultNodeTypeOf,
  defaultEdgeTypeOf,
} from './view-panels/schema';
export type {
  SchemaViewPanelProps,
  SchemaViewPanelBaseProps,
  UseDerivedSchemaOptions,
  GraphSchema,
  SchemaNodeType,
  SchemaEdgeType,
  SchemaEdgeConnection,
  SchemaProperty,
  SchemaMetaGraphOptions,
  DeriveSchemaOptions,
  SchemaNodeMode,
  SchemaEdgeRouting,
} from './view-panels/schema';

// ═══════════════════════════════════════════════════════════════════════════
// Shared
// ═══════════════════════════════════════════════════════════════════════════
// Colour swatch palette shared across editors, and the `0xRRGGBB` ↔ `#rrggbb`
// helpers that bridge engine colours and the design-kit colour swatch.
export { COLOR_PRESETS } from './shared/colors';
export { numberToHex, hexToNumber } from './shared/color';

// ═══════════════════════════════════════════════════════════════════════════
// Application UI (moved from @invana/canvas-react)
// ═══════════════════════════════════════════════════════════════════════════
// The pixels: the `GraphCanvasApp` shell, assembled toolbars, dumb building-block
// components, context menus, and the two turnkey UI hooks. All built on
// `@invana/canvas-react`'s headless hooks/context.

// ─── App (batteries-included composition) ────────────────────────────────────
export { GraphCanvasApp, CanvasThemeSync, graphCanvasAppBaseConfig } from './apps';
export type { CanvasThemeSyncProps } from './apps';
export type {
  GraphCanvasAppProps,
  GraphCanvasAppControlContext,
  GraphCanvasAppSectionOptions,
  RegionSlot,
  ThemeKind,
  BottomSpan,
  GraphCanvasAppHeaderOptions,
  GraphCanvasAppFooterOptions,
} from './apps';

// ─── Toolbars ──────────────────────────────────────────────────────────────
// `CanvasControlsToolbar` self-wires from context (React Flow's `<Controls>`);
// `GraphToolbar` is a turnkey layout/select/clear bar. Toolbar components carry
// the `*Toolbar` suffix.
export {
  CanvasControlsToolbar,
  SchemaToolbar,
  GraphToolbar,
  GraphControlsToolbar,
  GraphControlsToolbarLite,
  HistoryToolbar,
  EditToolbar,
  ViewToolbar,
  GridToolbar,
  GraphLayoutToolbar,
  ModellerToolbar,
  ExportImageToolbar,
  ExportStateToolbar,
  ClearCanvasToolbar,
  InspectorPanel,
  NodeDetailView,
  EdgeDetailView,
  dockCardClassName,
  ThemeToggle,
  MiniMapToggleButton,
  DevInfoToggleButton,
} from './toolbars';
export type {
  CanvasControlsToolbarProps,
  SchemaToolbarProps,
  SchemaToolbarSections,
  GraphToolbarProps,
  GraphControlsToolbarProps,
  GraphControlsSections,
  HistoryToolbarProps,
  EditToolbarProps,
  ViewToolbarProps,
  GridToolbarProps,
  GraphLayoutToolbarProps,
  ModellerToolbarProps,
  ExportImageToolbarProps,
  ExportImageFormatKey,
  ExportStateToolbarProps,
  ClearCanvasToolbarProps,
  InspectorPanelProps,
  NodeDetailViewProps,
  EdgeDetailViewProps,
  BaseDetailViewProps,
  ThemeToggleProps,
  MiniMapToggleButtonProps,
  DevInfoToggleButtonProps,
} from './toolbars';

// ─── UI components (building blocks) ───────────────────────────────────────
// The toolbar layer is data-driven: the `ToolbarItems` renderer compiles
// `ToolbarItem[]` (from the builder hooks) straight to `@invana/ui` chrome — no
// per-control wrapper components. `Panel` positions overlays; `Tooltipped` is
// the shared tooltip helper; the rest are standalone panels.
export {
  Panel,
  PanelContent,
  ToolbarItems,
  applyIconOverrides,
  Tooltipped,
  ExportImagePanel,
  EXPORT_IMAGE_FORMAT_OPTIONS,
  EXPORT_IMAGE_AREA_OPTIONS,
  EXPORT_IMAGE_BACKGROUND_OPTIONS,
  EXPORT_IMAGE_SCALE_OPTIONS,
  EXPORT_IMAGE_RATIO_OPTIONS,
  ExportStatePanel,
  CanvasMessageBar,
  GraphStatusBar,
  PropertiesEditor,
  DetailCard,
  PropertyDetailView,
  EdgeEndpoints,
  defaultPropertyRenderers,
  resolvePropertyRenderer,
  renderPropertyValue,
  isSafeHref,
  isImageUrl,
  ContextMenuOverlay,
  HoverElementPreviewCard,
  CanvasSettingsBrowser,
} from './components';
export type {
  PanelProps,
  PanelContentProps,
  PanelPosition,
  CanvasSettingsBrowserProps,
  SettingsEditorDescriptor,
  SettingsEditorContext,
  // `CanvasSettingsBrowser`'s section shape — aliased to avoid colliding with the
  // `CanvasSettingsEditor` `SettingsSection` exported above.
  SettingsSection as CanvasSettingsBrowserSection,
  ToolbarItemsProps,
  ToolbarItem,
  ToolbarButtonItem,
  ToolbarToggleItem,
  ToolbarSelectItem,
  ToolbarDividerItem,
  ToolbarCustomItem,
  TooltippedProps,
  TooltipSide,
  ExportImagePanelProps,
  ExportImagePanelValue,
  ExportImagePanelOption,
  ExportImageAreaKey,
  ExportStatePanelProps,
  CanvasMessageBarProps,
  GraphStatusBarProps,
  PropertiesEditorProps,
  PropertiesEditorValues,
  DetailCardProps,
  DetailRow,
  PropertyDetailViewProps,
  EdgeEndpointsProps,
  EdgeEndpoint,
  PropertyRenderer,
  PropertyRenderContext,
  PropertyKind,
  ContextMenuOverlayProps,
  HoverElementPreviewCardProps,
  ToolbarIcon,
} from './components';

// ─── Context menus ───────────────────────────────────────────────────────────
// `GraphContextMenu` — the standard, zero-config right-click menu (node + edge:
// Focus · Select · Hide/Show), the menu equivalent of the default settings panel.
// Beneath it, the target-scoped primitives — one per target (node / edge /
// background), each wiring a `ContextMenuBehaviour` + `ContextMenuOverlay`; pass an
// `items` builder when the standard set doesn't fit. Compose freely.
export {
  GraphContextMenu,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
} from './menus';
export type {
  GraphContextMenuProps,
  GraphNodeContextMenuProps,
  GraphNodeMenuContext,
  GraphEdgeContextMenuProps,
  GraphEdgeMenuContext,
  GraphBackgroundContextMenuProps,
  GraphBackgroundMenuContext,
  GraphContextMenuCommonProps,
  GraphContextMenuContext,
  GraphTargetMenuContext,
} from './menus';

// The hover-preview **behaviour** is headless and lives in `@invana/canvas-react`
// (`HoverElementPreviewBehaviour`). This package contributes only the **card** it
// renders — `HoverElementPreviewCard` (exported above). Wire it in as a render-
// prop: `<HoverElementPreviewBehaviour renderCard={(s) => <HoverElementPreviewCard card={s.card} />} />`.

// The turnkey minimap / dev-overlay toggles are now single self-wiring button
// components — `MiniMapToggleButton` / `DevInfoToggleButton` in `./toolbars`
// (each renders its own screen-fixed layer from wherever it's dropped), so there
// is no separate `useMiniMap` / `useDevTool` hook to place a `.layer` node.
