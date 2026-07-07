import type { ComponentType } from 'react';
import type { SettingsEditorDescriptor, SettingsSection } from '@invana/canvas-react';

// Engine classes — matched by `instanceof` so a descriptor only lights up when
// that class is actually registered on the canvas (survives minified builds).
import { BackgroundLayer, DevInfoLayer, DragPanBehaviour, PinchZoomBehaviour, KeyboardCameraInputBehaviour, WheelZoomBehaviour, DragShapeBehaviour } from '@invana/canvas';
import { MiniMapLayer, DragNodeBehaviour, HoverActivateBehaviour, ClickSelectBehaviour, ClickInspectBehaviour, ClickViewBehaviour, HoverElementPreviewBehaviour, BrushSelectBehaviour, LassoSelectBehaviour, CreateNodeBehaviour, DrawEdgeBehaviour, EraseBehaviour, NodeResizeBehaviour, CollapseExpandBehaviour, ColorByLabelBehaviour, ThemeBehaviour, DegreeSizeBehaviour, ContextMenuBehaviour, LabelResolutionLODBehaviour, NodeSizeLODBehaviour, EdgeSizeLODBehaviour, ParallelEdgeBehaviour, LabelCollisionBehaviour } from '@invana/graph';
import { DensityContourFillLayer, DensityContourStrokeLayer } from '@invana/graph-layer-d3-contour';
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';
import { MapLayer } from '@invana/graph-layer-maplibre';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { D3SankeyLayout } from '@invana/graph-layout-d3-sankey';
import { GeometricLayout } from '@invana/graph-layout-geometric';

// Every settings editor + its options↔form mappers from the editors package.
import {
  BackgroundLayerEditor,
  backgroundLayerOptionsToForm,
  backgroundLayerFormToOptions,
  DevInfoLayerEditor,
  devInfoLayerOptionsToForm,
  devInfoLayerFormToOptions,
  MiniMapLayerEditor,
  miniMapLayerOptionsToForm,
  miniMapLayerFormToOptions,
  DensityContourFillLayerEditor,
  densityContourFillLayerOptionsToForm,
  densityContourFillLayerFormToOptions,
  DensityContourStrokeLayerEditor,
  densityContourStrokeLayerOptionsToForm,
  densityContourStrokeLayerFormToOptions,
  BubbleSetsLayerEditor,
  bubbleSetsLayerOptionsToForm,
  bubbleSetsLayerFormToOptions,
  MapLayerEditor,
  mapLayerOptionsToForm,
  mapLayerFormToOptions,
  DragPanEditor,
  dragPanOptionsToForm,
  dragPanFormToOptions,
  PinchZoomEditor,
  pinchZoomOptionsToForm,
  pinchZoomFormToOptions,
  KeyboardCameraEditor,
  keyboardCameraOptionsToForm,
  keyboardCameraFormToOptions,
  WheelZoomEditor,
  wheelZoomOptionsToForm,
  wheelZoomFormToOptions,
  DragShapeEditor,
  dragShapeOptionsToForm,
  dragShapeFormToOptions,
  DragNodeEditor,
  dragNodeOptionsToForm,
  dragNodeFormToOptions,
  HoverActivateEditor,
  hoverActivateOptionsToForm,
  hoverActivateFormToOptions,
  ClickSelectEditor,
  clickSelectOptionsToForm,
  clickSelectFormToOptions,
  ClickInspectEditor,
  clickInspectOptionsToForm,
  clickInspectFormToOptions,
  ClickViewEditor,
  clickViewOptionsToForm,
  clickViewFormToOptions,
  HoverElementPreviewEditor,
  hoverElementPreviewOptionsToForm,
  hoverElementPreviewFormToOptions,
  BrushSelectEditor,
  brushSelectOptionsToForm,
  brushSelectFormToOptions,
  LassoSelectEditor,
  lassoSelectOptionsToForm,
  lassoSelectFormToOptions,
  CreateNodeEditor,
  createNodeOptionsToForm,
  createNodeFormToOptions,
  DrawEdgeEditor,
  drawEdgeOptionsToForm,
  drawEdgeFormToOptions,
  EraseEditor,
  eraseOptionsToForm,
  eraseFormToOptions,
  NodeResizeEditor,
  nodeResizeOptionsToForm,
  nodeResizeFormToOptions,
  CollapseExpandEditor,
  collapseExpandOptionsToForm,
  collapseExpandFormToOptions,
  ColorByLabelEditor,
  colorByLabelOptionsToForm,
  colorByLabelFormToOptions,
  ThemeEditor,
  themeOptionsToForm,
  themeFormToOptions,
  DegreeSizeEditor,
  degreeSizeOptionsToForm,
  degreeSizeFormToOptions,
  ContextMenuEditor,
  contextMenuOptionsToForm,
  contextMenuFormToOptions,
  LabelResolutionLODEditor,
  labelResolutionLodOptionsToForm,
  labelResolutionLodFormToOptions,
  NodeSizeLODEditor,
  nodeSizeLodOptionsToForm,
  nodeSizeLodFormToOptions,
  EdgeSizeLODEditor,
  edgeSizeLodOptionsToForm,
  edgeSizeLodFormToOptions,
  ParallelEdgeEditor,
  parallelEdgeOptionsToForm,
  parallelEdgeFormToOptions,
  LabelCollisionEditor,
  labelCollisionOptionsToForm,
  labelCollisionFormToOptions,
  D3ForceLayoutEditor,
  d3ForceLayoutOptionsToForm,
  d3ForceLayoutFormToOptions,
  ElkLayoutEditor,
  elkLayoutOptionsToForm,
  elkLayoutFormToOptions,
  D3HierarchyLayoutEditor,
  d3HierarchyLayoutOptionsToForm,
  d3HierarchyLayoutFormToOptions,
  D3SankeyLayoutEditor,
  d3SankeyLayoutOptionsToForm,
  d3SankeyLayoutFormToOptions,
  GeometricLayoutEditor,
  geometricLayoutOptionsToForm,
  geometricLayoutFormToOptions,
} from '@invana/canvas-ui';

/** Minimal shape every editor component satisfies (defaults + onSubmit). */
type EditorProps<F> = { defaults?: F; onSubmit: (values: F) => void };

/**
 * Bind one editable engine class to its editor: match by `instanceof`, seed the
 * form from the live instance's options (`toForm`), and on Apply map back and
 * push the patch to the canvas (`toOptions` → `apply`).
 */
function make<O, F>(
  section: SettingsSection,
  typeLabel: string,
  match: (instance: unknown) => boolean,
  Editor: ComponentType<EditorProps<F>>,
  toForm: (options: O) => F,
  toOptions: (fields: F) => O,
): SettingsEditorDescriptor {
  return {
    section,
    typeLabel,
    match,
    render: ({ options, apply }) => (
      <Editor
        defaults={toForm(options as O)}
        onSubmit={(v) => apply(toOptions(v) as Record<string, unknown>)}
      />
    ),
  };
}

/**
 * The full registry for `<CanvasSettingsBrowser>` — one descriptor per
 * Behaviour / Layer / Layout editor in `@invana/canvas-ui`. Pass it as the
 * browser's `registry`; whichever classes are registered on the canvas render
 * their editor, the rest simply don't appear.
 */
export const ALL_SETTINGS_EDITORS: SettingsEditorDescriptor[] = [
  make('layers', 'Background Layer', (i) => i instanceof BackgroundLayer, BackgroundLayerEditor, backgroundLayerOptionsToForm, backgroundLayerFormToOptions),
  make('layers', 'Dev Info Layer', (i) => i instanceof DevInfoLayer, DevInfoLayerEditor, devInfoLayerOptionsToForm, devInfoLayerFormToOptions),
  make('layers', 'Mini-map Layer', (i) => i instanceof MiniMapLayer, MiniMapLayerEditor, miniMapLayerOptionsToForm, miniMapLayerFormToOptions),
  make('layers', 'Density Contour Fill', (i) => i instanceof DensityContourFillLayer, DensityContourFillLayerEditor, densityContourFillLayerOptionsToForm, densityContourFillLayerFormToOptions),
  make('layers', 'Density Contour Stroke', (i) => i instanceof DensityContourStrokeLayer, DensityContourStrokeLayerEditor, densityContourStrokeLayerOptionsToForm, densityContourStrokeLayerFormToOptions),
  make('layers', 'Bubble Sets Layer', (i) => i instanceof BubbleSetsLayer, BubbleSetsLayerEditor, bubbleSetsLayerOptionsToForm, bubbleSetsLayerFormToOptions),
  make('layers', 'Map Layer', (i) => i instanceof MapLayer, MapLayerEditor, mapLayerOptionsToForm, mapLayerFormToOptions),
  make('behaviours', 'Drag Pan', (i) => i instanceof DragPanBehaviour, DragPanEditor, dragPanOptionsToForm, dragPanFormToOptions),
  make('behaviours', 'Pinch Zoom', (i) => i instanceof PinchZoomBehaviour, PinchZoomEditor, pinchZoomOptionsToForm, pinchZoomFormToOptions),
  make('behaviours', 'Keyboard Camera', (i) => i instanceof KeyboardCameraInputBehaviour, KeyboardCameraEditor, keyboardCameraOptionsToForm, keyboardCameraFormToOptions),
  make('behaviours', 'Wheel Zoom', (i) => i instanceof WheelZoomBehaviour, WheelZoomEditor, wheelZoomOptionsToForm, wheelZoomFormToOptions),
  make('behaviours', 'Drag Shape', (i) => i instanceof DragShapeBehaviour, DragShapeEditor, dragShapeOptionsToForm, dragShapeFormToOptions),
  make('behaviours', 'Drag Node', (i) => i instanceof DragNodeBehaviour, DragNodeEditor, dragNodeOptionsToForm, dragNodeFormToOptions),
  make('behaviours', 'Hover Activate', (i) => i instanceof HoverActivateBehaviour, HoverActivateEditor, hoverActivateOptionsToForm, hoverActivateFormToOptions),
  make('behaviours', 'Click Select', (i) => i instanceof ClickSelectBehaviour, ClickSelectEditor, clickSelectOptionsToForm, clickSelectFormToOptions),
  make('behaviours', 'Click Inspect', (i) => i instanceof ClickInspectBehaviour, ClickInspectEditor, clickInspectOptionsToForm, clickInspectFormToOptions),
  make('behaviours', 'Click View', (i) => i instanceof ClickViewBehaviour, ClickViewEditor, clickViewOptionsToForm, clickViewFormToOptions),
  make('behaviours', 'Hover Preview', (i) => i instanceof HoverElementPreviewBehaviour, HoverElementPreviewEditor, hoverElementPreviewOptionsToForm, hoverElementPreviewFormToOptions),
  make('behaviours', 'Brush Select', (i) => i instanceof BrushSelectBehaviour, BrushSelectEditor, brushSelectOptionsToForm, brushSelectFormToOptions),
  make('behaviours', 'Lasso Select', (i) => i instanceof LassoSelectBehaviour, LassoSelectEditor, lassoSelectOptionsToForm, lassoSelectFormToOptions),
  make('behaviours', 'Create Node', (i) => i instanceof CreateNodeBehaviour, CreateNodeEditor, createNodeOptionsToForm, createNodeFormToOptions),
  make('behaviours', 'Draw Edge', (i) => i instanceof DrawEdgeBehaviour, DrawEdgeEditor, drawEdgeOptionsToForm, drawEdgeFormToOptions),
  make('behaviours', 'Erase', (i) => i instanceof EraseBehaviour, EraseEditor, eraseOptionsToForm, eraseFormToOptions),
  make('behaviours', 'Node Resize', (i) => i instanceof NodeResizeBehaviour, NodeResizeEditor, nodeResizeOptionsToForm, nodeResizeFormToOptions),
  make('behaviours', 'Collapse / Expand', (i) => i instanceof CollapseExpandBehaviour, CollapseExpandEditor, collapseExpandOptionsToForm, collapseExpandFormToOptions),
  make('behaviours', 'Color by Label', (i) => i instanceof ColorByLabelBehaviour, ColorByLabelEditor, colorByLabelOptionsToForm, colorByLabelFormToOptions),
  make('behaviours', 'Theme', (i) => i instanceof ThemeBehaviour, ThemeEditor, themeOptionsToForm, themeFormToOptions),
  make('behaviours', 'Degree Size', (i) => i instanceof DegreeSizeBehaviour, DegreeSizeEditor, degreeSizeOptionsToForm, degreeSizeFormToOptions),
  make('behaviours', 'Context Menu', (i) => i instanceof ContextMenuBehaviour, ContextMenuEditor, contextMenuOptionsToForm, contextMenuFormToOptions),
  make('behaviours', 'Label Resolution LOD', (i) => i instanceof LabelResolutionLODBehaviour, LabelResolutionLODEditor, labelResolutionLodOptionsToForm, labelResolutionLodFormToOptions),
  make('behaviours', 'Node Size LOD', (i) => i instanceof NodeSizeLODBehaviour, NodeSizeLODEditor, nodeSizeLodOptionsToForm, nodeSizeLodFormToOptions),
  make('behaviours', 'Edge Size LOD', (i) => i instanceof EdgeSizeLODBehaviour, EdgeSizeLODEditor, edgeSizeLodOptionsToForm, edgeSizeLodFormToOptions),
  make('behaviours', 'Parallel Edge', (i) => i instanceof ParallelEdgeBehaviour, ParallelEdgeEditor, parallelEdgeOptionsToForm, parallelEdgeFormToOptions),
  make('behaviours', 'Label Collision', (i) => i instanceof LabelCollisionBehaviour, LabelCollisionEditor, labelCollisionOptionsToForm, labelCollisionFormToOptions),
  make('layouts', 'D3 Force', (i) => i instanceof D3ForceLayout, D3ForceLayoutEditor, d3ForceLayoutOptionsToForm, d3ForceLayoutFormToOptions),
  make('layouts', 'ELK', (i) => i instanceof ElkLayout, ElkLayoutEditor, elkLayoutOptionsToForm, elkLayoutFormToOptions),
  make('layouts', 'D3 Hierarchy', (i) => i instanceof D3HierarchyLayout, D3HierarchyLayoutEditor, d3HierarchyLayoutOptionsToForm, d3HierarchyLayoutFormToOptions),
  make('layouts', 'D3 Sankey', (i) => i instanceof D3SankeyLayout, D3SankeyLayoutEditor, d3SankeyLayoutOptionsToForm, d3SankeyLayoutFormToOptions),
  make('layouts', 'Geometric', (i) => i instanceof GeometricLayout, GeometricLayoutEditor, geometricLayoutOptionsToForm, geometricLayoutFormToOptions),
];
