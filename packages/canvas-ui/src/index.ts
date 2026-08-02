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

// ═══════════════════════════════════════════════════════════════════════════
// Canvas settings editor panel
// ═══════════════════════════════════════════════════════════════════════════
// One JSON-driven, store-connected editor panel over the whole canvas definition
// (all layers / behaviours / layouts + their settings). Takes the live engine as
// a required `canvas` prop, introspects the live registries, resolves each
// instance's form from the built-in schema registry (`kind` → fields + engine⇄
// form mappers), and applies every edit via `canvas.update(...)`. The `*Fields` /
// `optionsToForm` / `formToOptions` exports below feed its registry.
export {
  CanvasSettingsEditorPanel,
  type CanvasSettingsEditorPanelProps,
  DEFAULT_CANVAS_SETTINGS_SCHEMAS,
} from './editor-panels/canvas-settings';
export type {
  SettingsSchemaEntry,
  CanvasSettingsDefinition,
  CanvasSettingsInstance,
  SettingsSection,
} from './editor-panels/canvas-settings';

// ─── Node style editors ──────────────────────────────────────────────────
// `NodeStyleEditorPanel` dispatches on the `kind` prop to the full-spec **simple**
// editor (flat `NodeStyle`) or the full-spec **composite** editor (a
// `CompositeShapeOption`). Both variants + their field configs + mappers are
// exported for standalone use.
export {
  NodeStyleEditorPanel,
  SimpleNodeStyleEditorPanel,
  CompositeNodeStyleEditorPanel,
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
} from './editor-panels/node-style';
export type {
  NodeStyleEditorPanelProps,
  SimpleNodeStyleEditorPanelProps,
  CompositeNodeStyleEditorPanelProps,
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
} from './editor-panels/node-style';

// ─── Node style overview editor ────────────────────────────────────────────
// A minimal colour-only editor that recolours a node. `recolorNodeStyle` turns
// the chosen colour into the right patch for a simple shape (`bgFill`) or a
// composite card (body + accent parts), so one control works for both kinds.
export {
  NodeStyleOverviewEditorPanel,
  nodeStyleOverviewFields,
  colorToForm,
  formToColor,
  recolorNodeStyle,
} from './editor-panels/node-style-overview';
export type {
  NodeStyleOverviewEditorPanelProps,
  NodeStyleOverviewFields,
  NodeStyleOverviewFormState,
} from './editor-panels/node-style-overview';

// ─── Hover-preview-card editor ─────────────────────────────────────────────
// Engine-agnostic form (à la NodeStyleEditorPanel) that produces one serializable
// `HoverElementPreviewCardSpec` — the per-type card definition. Compose one per
// node/edge type to build the behaviour's `cards` config from a UI.
export {
  HoverPreviewCardEditorPanel,
  CARD_SCALAR_FIELDS,
  CARD_ROW_FIELDS,
  specToForm,
  formToSpec,
} from './editor-panels/hover-preview-card';
export type {
  HoverPreviewCardEditorPanelProps,
  CardSpecFields,
  CardScalarFields,
  CardRowField,
  CardImageShape,
} from './editor-panels/hover-preview-card';

// ─── Node template editors ────────────────────────────────────────────────
// Schema-driven editors for the three-layer node model: a `NodeStructureEditorPanel`
// (per-type binding — structure + styling + the slot→data-field map) and a
// `NodeStylingEditorPanel` (roles + typography). Both produce pure JSON the host
// pushes via `canvas.update({ layers: { graph: { … } } })`.
export {
  NodeStructureEditorPanel,
  bindingScalarFields,
  bindingToForm,
  formToBinding,
} from './editor-panels/node-structure';
export type {
  NodeStructureEditorPanelProps,
  NodeStructureFormState,
  NodeStructureScalarFields,
  BindingRow,
} from './editor-panels/node-structure';
// `SchemaEditorPanel` — a titled list of typed fields (ER / table-card schema).
// Edits a `NodeSchema` (label + header colour + fields[{name,type}]) and emits
// it on Apply; the consumer writes it back to a node's data + redraws.
export {
  SchemaEditorPanel,
  SCHEMA_TYPES,
  SCHEMA_TYPE_OPTIONS,
  SCHEMA_META_FIELDS,
  SCHEMA_FIELD_ROW,
  schemaToForm,
  formToSchema,
} from './editor-panels/schema';
export type {
  SchemaEditorPanelProps,
  NodeSchema,
  SchemaFieldDef,
  SchemaEditorFormState,
  SchemaMetaFields,
} from './editor-panels/schema';
export {
  NodeStylingEditorPanel,
  STYLING_SCALAR_FIELDS,
  SIMPLE_STYLING_FIELDS,
  CARD_STYLING_FIELDS,
  SLOT_STYLING_FIELDS,
  stylingToForm,
  formToStyling,
} from './editor-panels/node-styling';
export type {
  NodeStylingEditorPanelProps,
  NodeStylingFormState,
  NodeStylingScalarFields,
  SlotStylingRow,
} from './editor-panels/node-styling';
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
export { WheelZoomEditorPanel, wheelZoomFields } from './editors/behaviours/wheel-zoom';
export {
  optionsToForm as wheelZoomOptionsToForm,
  formToOptions as wheelZoomFormToOptions,
} from './editors/behaviours/wheel-zoom';
export type {
  WheelZoomEditorPanelProps,
  WheelZoomFields,
  WheelZoomFormState,
  WheelZoomOptions,
} from './editors/behaviours/wheel-zoom';

// BackgroundLayer
export { BackgroundLayerEditorPanel, backgroundLayerFields } from './editors/layers/background-layer';
export {
  optionsToForm as backgroundLayerOptionsToForm,
  formToOptions as backgroundLayerFormToOptions,
} from './editors/layers/background-layer';
export type {
  BackgroundLayerEditorPanelProps,
  BackgroundLayerFields,
  BackgroundLayerFormState,
  BackgroundLayerOptions,
  BackgroundType,
  BackgroundPatternType,
  BackgroundMode,
} from './editors/layers/background-layer';

// GeometricLayout
export {
  GeometricLayoutEditorPanel,
  geometricLayoutFields,
  modeFields,
} from './editors/layouts/geometric-layout';


// ─────────────────────────────────────────────────────────────────────────
// Behaviour / Layer / Layout settings editors — full engine coverage (rule 12).
// Each mirrors a class's serialisable options; the aliased optionsToForm /
// formToOptions mappers seed + read back per surface.
// ─────────────────────────────────────────────────────────────────────────

// DragPanBehaviour
export { DragPanEditorPanel, dragPanFields } from './editors/behaviours/drag-pan';
export {
  optionsToForm as dragPanOptionsToForm,
  formToOptions as dragPanFormToOptions,
} from './editors/behaviours/drag-pan';
export type {
  DragPanEditorPanelProps,
  DragPanFields,
  DragPanFormState,
  DragPanOptions,
} from './editors/behaviours/drag-pan';

// PinchZoomBehaviour
export { PinchZoomEditorPanel, pinchZoomFields } from './editors/behaviours/pinch-zoom';
export {
  optionsToForm as pinchZoomOptionsToForm,
  formToOptions as pinchZoomFormToOptions,
} from './editors/behaviours/pinch-zoom';
export type {
  PinchZoomEditorPanelProps,
  PinchZoomFields,
  PinchZoomFormState,
  PinchZoomOptions,
} from './editors/behaviours/pinch-zoom';

// KeyboardCameraInputBehaviour
export { KeyboardCameraEditorPanel, keyboardCameraFields } from './editors/behaviours/keyboard-camera';
export {
  optionsToForm as keyboardCameraOptionsToForm,
  formToOptions as keyboardCameraFormToOptions,
} from './editors/behaviours/keyboard-camera';
export type {
  KeyboardCameraEditorPanelProps,
  KeyboardCameraFields,
  KeyboardCameraFormState,
  KeyboardCameraOptions,
} from './editors/behaviours/keyboard-camera';

// DragShapeBehaviour
export { DragShapeEditorPanel, dragShapeFields } from './editors/behaviours/drag-shape';
export {
  optionsToForm as dragShapeOptionsToForm,
  formToOptions as dragShapeFormToOptions,
} from './editors/behaviours/drag-shape';
export type {
  DragShapeEditorPanelProps,
  DragShapeFields,
  DragShapeFormState,
  DragShapeOptions,
} from './editors/behaviours/drag-shape';

// DevInfoLayer
export { DevInfoLayerEditorPanel, devInfoLayerFields } from './editors/layers/dev-info-layer';
export {
  optionsToForm as devInfoLayerOptionsToForm,
  formToOptions as devInfoLayerFormToOptions,
} from './editors/layers/dev-info-layer';
export type {
  DevInfoLayerEditorPanelProps,
  DevInfoLayerFields,
  DevInfoLayerFormState,
  DevInfoLayerOptions,
} from './editors/layers/dev-info-layer';

// ClickSelectBehaviour
export { ClickSelectEditorPanel, clickSelectFields } from './editors/behaviours/click-select';
export {
  optionsToForm as clickSelectOptionsToForm,
  formToOptions as clickSelectFormToOptions,
} from './editors/behaviours/click-select';
export type {
  ClickSelectEditorPanelProps,
  ClickSelectFields,
  ClickSelectFormState,
  ClickSelectOptions,
} from './editors/behaviours/click-select';

// ClickInspectBehaviour
export { ClickInspectEditorPanel, clickInspectFields } from './editors/behaviours/click-inspect';
export {
  optionsToForm as clickInspectOptionsToForm,
  formToOptions as clickInspectFormToOptions,
} from './editors/behaviours/click-inspect';
export type {
  ClickInspectEditorPanelProps,
  ClickInspectFields,
  ClickInspectFormState,
  ClickInspectOptions,
} from './editors/behaviours/click-inspect';

// ClickViewBehaviour
export { ClickViewEditorPanel, clickViewFields } from './editors/behaviours/click-view';
export {
  optionsToForm as clickViewOptionsToForm,
  formToOptions as clickViewFormToOptions,
} from './editors/behaviours/click-view';
export type {
  ClickViewEditorPanelProps,
  ClickViewFields,
  ClickViewFormState,
  ClickViewOptions,
} from './editors/behaviours/click-view';

// BrushSelectBehaviour
export { BrushSelectEditorPanel, brushSelectFields } from './editors/behaviours/brush-select';
export {
  optionsToForm as brushSelectOptionsToForm,
  formToOptions as brushSelectFormToOptions,
} from './editors/behaviours/brush-select';
export type {
  BrushSelectEditorPanelProps,
  BrushSelectFields,
  BrushSelectFormState,
  BrushSelectOptions,
} from './editors/behaviours/brush-select';

// LassoSelectBehaviour
export { LassoSelectEditorPanel, lassoSelectFields } from './editors/behaviours/lasso-select';
export {
  optionsToForm as lassoSelectOptionsToForm,
  formToOptions as lassoSelectFormToOptions,
} from './editors/behaviours/lasso-select';
export type {
  LassoSelectEditorPanelProps,
  LassoSelectFields,
  LassoSelectFormState,
  LassoSelectOptions,
} from './editors/behaviours/lasso-select';

// HoverActivateBehaviour
export { HoverActivateEditorPanel, hoverActivateFields } from './editors/behaviours/hover-activate';
export {
  optionsToForm as hoverActivateOptionsToForm,
  formToOptions as hoverActivateFormToOptions,
} from './editors/behaviours/hover-activate';
export type {
  HoverActivateEditorPanelProps,
  HoverActivateFields,
  HoverActivateFormState,
  HoverActivateOptions,
} from './editors/behaviours/hover-activate';

// HoverElementPreviewBehaviour
export { HoverElementPreviewEditorPanel, hoverElementPreviewFields } from './editors/behaviours/hover-element-preview';
export {
  optionsToForm as hoverElementPreviewOptionsToForm,
  formToOptions as hoverElementPreviewFormToOptions,
} from './editors/behaviours/hover-element-preview';
export type {
  HoverElementPreviewEditorPanelProps,
  HoverElementPreviewFields,
  HoverElementPreviewFormState,
  HoverElementPreviewOptions,
} from './editors/behaviours/hover-element-preview';

// DragNodeBehaviour
export { DragNodeEditorPanel, dragNodeFields } from './editors/behaviours/drag-node';
export {
  optionsToForm as dragNodeOptionsToForm,
  formToOptions as dragNodeFormToOptions,
} from './editors/behaviours/drag-node';
export type {
  DragNodeEditorPanelProps,
  DragNodeFields,
  DragNodeFormState,
  DragNodeOptions,
} from './editors/behaviours/drag-node';

// NodeResizeBehaviour
export { NodeResizeEditorPanel, nodeResizeFields } from './editors/behaviours/node-resize';
export {
  optionsToForm as nodeResizeOptionsToForm,
  formToOptions as nodeResizeFormToOptions,
} from './editors/behaviours/node-resize';
export type {
  NodeResizeEditorPanelProps,
  NodeResizeFields,
  NodeResizeFormState,
  NodeResizeOptions,
} from './editors/behaviours/node-resize';

// CollapseExpandBehaviour
export { CollapseExpandEditorPanel, collapseExpandFields } from './editors/behaviours/collapse-expand';
export {
  optionsToForm as collapseExpandOptionsToForm,
  formToOptions as collapseExpandFormToOptions,
} from './editors/behaviours/collapse-expand';
export type {
  CollapseExpandEditorPanelProps,
  CollapseExpandFields,
  CollapseExpandFormState,
  CollapseExpandOptions,
} from './editors/behaviours/collapse-expand';

// CreateNodeBehaviour
export { CreateNodeEditorPanel, createNodeFields } from './editors/behaviours/create-node';
export {
  optionsToForm as createNodeOptionsToForm,
  formToOptions as createNodeFormToOptions,
} from './editors/behaviours/create-node';
export type {
  CreateNodeEditorPanelProps,
  CreateNodeFields,
  CreateNodeFormState,
  CreateNodeOptions,
} from './editors/behaviours/create-node';

// DrawEdgeBehaviour
export { DrawEdgeEditorPanel, drawEdgeFields } from './editors/behaviours/draw-edge';
export {
  optionsToForm as drawEdgeOptionsToForm,
  formToOptions as drawEdgeFormToOptions,
} from './editors/behaviours/draw-edge';
export type {
  DrawEdgeEditorPanelProps,
  DrawEdgeFields,
  DrawEdgeFormState,
  DrawEdgeOptions,
} from './editors/behaviours/draw-edge';

// EraseBehaviour
export { EraseEditorPanel, eraseFields } from './editors/behaviours/erase';
export {
  optionsToForm as eraseOptionsToForm,
  formToOptions as eraseFormToOptions,
} from './editors/behaviours/erase';
export type {
  EraseEditorPanelProps,
  EraseFields,
  EraseFormState,
  EraseOptions,
} from './editors/behaviours/erase';

// ContextMenuBehaviour
export { ContextMenuEditorPanel, contextMenuFields } from './editors/behaviours/context-menu';
export {
  optionsToForm as contextMenuOptionsToForm,
  formToOptions as contextMenuFormToOptions,
} from './editors/behaviours/context-menu';
export type {
  ContextMenuEditorPanelProps,
  ContextMenuFields,
  ContextMenuFormState,
  ContextMenuOptions,
} from './editors/behaviours/context-menu';

// ColorByBehaviour
export { ColorByEditorPanel, colorByFields } from './editors/behaviours/color-by';
export {
  optionsToForm as colorByOptionsToForm,
  formToOptions as colorByFormToOptions,
} from './editors/behaviours/color-by';
export type {
  ColorByEditorPanelProps,
  ColorByFields,
  ColorByFormState,
  ColorByModeValue,
  ColorByOptions,
  ColorByScaleValue,
} from './editors/behaviours/color-by';

// ThemeBehaviour
export { ThemeEditorPanel, themeFields } from './editors/behaviours/theme';
export {
  optionsToForm as themeOptionsToForm,
  formToOptions as themeFormToOptions,
} from './editors/behaviours/theme';
export type {
  ThemeEditorPanelProps,
  ThemeFields,
  ThemeFormState,
  ThemeOptions,
} from './editors/behaviours/theme';

// NodeCentralityBehaviour
export { NodeCentralityEditorPanel, nodeCentralityFields } from './editors/behaviours/node-centrality';
export {
  optionsToForm as nodeCentralityOptionsToForm,
  formToOptions as nodeCentralityFormToOptions,
} from './editors/behaviours/node-centrality';
export type {
  NodeCentralityEditorPanelProps,
  NodeCentralityFields,
  NodeCentralityFormState,
  NodeCentralityOptions,
} from './editors/behaviours/node-centrality';

// Content-LOD behaviours (TextLODBehaviour / IconLODBehaviour / ImageLODBehaviour)
// share one option shape (a { minZoom, maxZoom } zoom band), so one editor serves
// all three. `ContentLODEditorPanel` is the canonical component; the per-behaviour
// names alias it for discoverability + the per-behaviour editor convention.
export {
  ContentLODEditorPanel,
  ContentLODEditorPanel as TextLODEditorPanel,
  ContentLODEditorPanel as IconLODEditorPanel,
  ContentLODEditorPanel as ImageLODEditorPanel,
  contentLODFields,
  textLODFields,
} from './editors/behaviours/content-lod';
export {
  optionsToForm as contentLODOptionsToForm,
  formToOptions as contentLODFormToOptions,
} from './editors/behaviours/content-lod';
export type {
  ContentLODEditorPanelProps,
  ContentLODEditorPanelProps as TextLODEditorPanelProps,
  ContentLODEditorPanelProps as IconLODEditorPanelProps,
  ContentLODEditorPanelProps as ImageLODEditorPanelProps,
  ContentLODFields,
  ContentLODFormState,
  ContentLODOptions,
} from './editors/behaviours/content-lod';

// EdgeLODBehaviour (thin edges below a zoom threshold)
export { EdgeLODEditorPanel, edgeLODFields } from './editors/behaviours/edge-lod';
export {
  optionsToForm as edgeLODOptionsToForm,
  formToOptions as edgeLODFormToOptions,
} from './editors/behaviours/edge-lod';
export type {
  EdgeLODEditorPanelProps,
  EdgeLODFields,
  EdgeLODFormState,
  EdgeLODKeepBy,
  EdgeLODOptions,
} from './editors/behaviours/edge-lod';

// ParallelEdgeBehaviour
export { ParallelEdgeEditorPanel, parallelEdgeFields } from './editors/behaviours/parallel-edge';
export {
  optionsToForm as parallelEdgeOptionsToForm,
  formToOptions as parallelEdgeFormToOptions,
} from './editors/behaviours/parallel-edge';
export type {
  ParallelEdgeEditorPanelProps,
  ParallelEdgeFields,
  ParallelEdgeFormState,
  ParallelEdgeOptions,
} from './editors/behaviours/parallel-edge';

// TextResolutionLODBehaviour
export { TextResolutionLODEditorPanel, textResolutionLodFields } from './editors/behaviours/text-resolution-lod';
export {
  optionsToForm as textResolutionLodOptionsToForm,
  formToOptions as textResolutionLodFormToOptions,
} from './editors/behaviours/text-resolution-lod';
export type {
  TextResolutionLODEditorPanelProps,
  TextResolutionLODFields,
  TextResolutionLODFormState,
  TextResolutionLODOptions,
} from './editors/behaviours/text-resolution-lod';

// NodeScaleLODBehaviour
export { NodeScaleLODEditorPanel, nodeScaleLodFields } from './editors/behaviours/node-scale-lod';
export {
  optionsToForm as nodeScaleLodOptionsToForm,
  formToOptions as nodeScaleLodFormToOptions,
} from './editors/behaviours/node-scale-lod';
export type {
  NodeScaleLODEditorPanelProps,
  NodeScaleLODFields,
  NodeScaleLODFormState,
  NodeScaleLODOptions,
} from './editors/behaviours/node-scale-lod';

// EdgeScaleLODBehaviour
export { EdgeScaleLODEditorPanel, edgeScaleLodFields } from './editors/behaviours/edge-scale-lod';
export {
  optionsToForm as edgeScaleLodOptionsToForm,
  formToOptions as edgeScaleLodFormToOptions,
} from './editors/behaviours/edge-scale-lod';
export type {
  EdgeScaleLODEditorPanelProps,
  EdgeScaleLODFields,
  EdgeScaleLODFormState,
  EdgeScaleLODOptions,
} from './editors/behaviours/edge-scale-lod';

// LabelCollisionBehaviour
export { LabelCollisionEditorPanel, labelCollisionFields } from './editors/behaviours/label-collision';
export {
  optionsToForm as labelCollisionOptionsToForm,
  formToOptions as labelCollisionFormToOptions,
} from './editors/behaviours/label-collision';
export type {
  LabelCollisionEditorPanelProps,
  LabelCollisionFields,
  LabelCollisionFormState,
  LabelCollisionOptions,
} from './editors/behaviours/label-collision';

// MiniMapLayer
export { MiniMapLayerEditorPanel, miniMapLayerFields } from './editors/layers/minimap-layer';
export {
  optionsToForm as miniMapLayerOptionsToForm,
  formToOptions as miniMapLayerFormToOptions,
} from './editors/layers/minimap-layer';
export type {
  MiniMapLayerEditorPanelProps,
  MiniMapLayerFields,
  MiniMapLayerFormState,
  MiniMapLayerOptions,
} from './editors/layers/minimap-layer';

// GraphLegendLayer
export { GraphLegendLayerEditorPanel, graphLegendLayerFields } from './editors/layers/graph-legend-layer';
export {
  optionsToForm as graphLegendLayerOptionsToForm,
  formToOptions as graphLegendLayerFormToOptions,
} from './editors/layers/graph-legend-layer';
export type {
  GraphLegendLayerEditorPanelProps,
  GraphLegendLayerFields,
  GraphLegendLayerFormState,
  GraphLegendLayerOptions,
} from './editors/layers/graph-legend-layer';

// D3ForceLayout
export { D3ForceLayoutEditorPanel, d3ForceLayoutFields } from './editors/layouts/d3-force-layout';
export {
  optionsToForm as d3ForceLayoutOptionsToForm,
  formToOptions as d3ForceLayoutFormToOptions,
} from './editors/layouts/d3-force-layout';
export type {
  D3ForceLayoutEditorPanelProps,
  D3ForceLayoutFields,
  D3ForceLayoutFormState,
  D3ForceLayoutOptions,
} from './editors/layouts/d3-force-layout';

// ElkLayout
export { ElkLayoutEditorPanel, elkLayoutFields } from './editors/layouts/elk-layout';
export {
  optionsToForm as elkLayoutOptionsToForm,
  formToOptions as elkLayoutFormToOptions,
} from './editors/layouts/elk-layout';
export type {
  ElkLayoutEditorPanelProps,
  ElkLayoutFields,
  ElkLayoutFormState,
  ElkLayoutOptions,
} from './editors/layouts/elk-layout';

// D3HierarchyLayout
export { D3HierarchyLayoutEditorPanel, d3HierarchyLayoutFields } from './editors/layouts/d3-hierarchy-layout';
export {
  optionsToForm as d3HierarchyLayoutOptionsToForm,
  formToOptions as d3HierarchyLayoutFormToOptions,
} from './editors/layouts/d3-hierarchy-layout';
export type {
  D3HierarchyLayoutEditorPanelProps,
  D3HierarchyLayoutFields,
  D3HierarchyLayoutFormState,
  D3HierarchyLayoutOptions,
} from './editors/layouts/d3-hierarchy-layout';

// D3SankeyLayout
export { D3SankeyLayoutEditorPanel, d3SankeyLayoutFields } from './editors/layouts/d3-sankey-layout';
export {
  optionsToForm as d3SankeyLayoutOptionsToForm,
  formToOptions as d3SankeyLayoutFormToOptions,
} from './editors/layouts/d3-sankey-layout';
export type {
  D3SankeyLayoutEditorPanelProps,
  D3SankeyLayoutFields,
  D3SankeyLayoutFormState,
  D3SankeyLayoutOptions,
} from './editors/layouts/d3-sankey-layout';

// DensityContourFillLayer
export { DensityContourFillLayerEditorPanel, densityContourFillLayerFields } from './editors/layers/density-contour-fill-layer';
export {
  optionsToForm as densityContourFillLayerOptionsToForm,
  formToOptions as densityContourFillLayerFormToOptions,
} from './editors/layers/density-contour-fill-layer';
export type {
  DensityContourFillLayerEditorPanelProps,
  DensityContourFillLayerFields,
  DensityContourFillLayerFormState,
  DensityContourFillLayerOptions,
} from './editors/layers/density-contour-fill-layer';

// DensityContourStrokeLayer
export { DensityContourStrokeLayerEditorPanel, densityContourStrokeLayerFields } from './editors/layers/density-contour-stroke-layer';
export {
  optionsToForm as densityContourStrokeLayerOptionsToForm,
  formToOptions as densityContourStrokeLayerFormToOptions,
} from './editors/layers/density-contour-stroke-layer';
export type {
  DensityContourStrokeLayerEditorPanelProps,
  DensityContourStrokeLayerFields,
  DensityContourStrokeLayerFormState,
  DensityContourStrokeLayerOptions,
} from './editors/layers/density-contour-stroke-layer';

// BubbleSetsLayer
export { BubbleSetsLayerEditorPanel, bubbleSetsLayerFields } from './editors/layers/bubble-sets-layer';
export {
  optionsToForm as bubbleSetsLayerOptionsToForm,
  formToOptions as bubbleSetsLayerFormToOptions,
} from './editors/layers/bubble-sets-layer';
export type {
  BubbleSetsLayerEditorPanelProps,
  BubbleSetsLayerFields,
  BubbleSetsLayerFormState,
  BubbleSetsLayerOptions,
} from './editors/layers/bubble-sets-layer';

// MapLayer
export { MapLayerEditorPanel, mapLayerFields } from './editors/layers/map-layer';
export {
  optionsToForm as mapLayerOptionsToForm,
  formToOptions as mapLayerFormToOptions,
} from './editors/layers/map-layer';
export type {
  MapLayerEditorPanelProps,
  MapLayerFields,
  MapLayerFormState,
  MapLayerOptions,
} from './editors/layers/map-layer';
export {
  optionsToForm as geometricLayoutOptionsToForm,
  formToOptions as geometricLayoutFormToOptions,
} from './editors/layouts/geometric-layout';
export type {
  GeometricLayoutEditorPanelProps,
  GeometricLayoutFields,
  GeometricLayoutFormState,
  GeometricLayoutOptions,
  GeometricLayoutMode,
} from './editors/layouts/geometric-layout';

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

// ─── Find in canvas ──────────────────────────────────────────────────────────
// A structured search over a `GraphCanvas`: AND-combined field filters (id /
// label / any property, contains / equals) → a live list of matching nodes and
// edges; a result click **focuses + selects** it (non-destructive locate, never a
// hide). Engine-bound (takes a live canvas), import-clean (`@invana/graph` types
// only, `@invana/ui` + `@invana/forms` chrome).
export { FindInCanvasViewPanel } from './view-panels/find-in-canvas';
export type { FindInCanvasViewPanelProps } from './view-panels/find-in-canvas';

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

// ─── Hooks (UI-only turnkey) ─────────────────────────────────────────────────
// `useSidePanels` — an activity-bar controller for `GraphCanvasApp` side panels:
// pass panel descriptors, get the shared toolbar `items` + the active panel's
// `region` (one panel docked at a time). Keeps the shell panel-agnostic.
export { useSidePanels } from './hooks';
export type { SidePanelDef, UseSidePanelsOptions, UseSidePanelsResult } from './hooks';

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
  // `CanvasSettingsEditorPanel` `SettingsSection` exported above.
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
