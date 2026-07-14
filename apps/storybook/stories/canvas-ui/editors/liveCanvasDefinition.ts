import type { CanvasSettingsInstance, SettingsSection } from '@invana/canvas-ui';

// Engine classes — matched by `instanceof` so a `kind` is resolved only when that
// class is actually registered on the canvas (survives minified builds).
import {
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
} from '@invana/canvas';
import {
  MiniMapLayer,
  DragNodeBehaviour,
  HoverActivateBehaviour,
  ClickSelectBehaviour,
  ClickInspectBehaviour,
  ClickViewBehaviour,
  HoverElementPreviewBehaviour,
  BrushSelectBehaviour,
  LassoSelectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  NodeResizeBehaviour,
  CollapseExpandBehaviour,
  ColorByLabelBehaviour,
  ThemeBehaviour,
  NodeCentralityBehaviour,
  ContextMenuBehaviour,
  TextResolutionLODBehaviour,
  NodeScaleLODBehaviour,
  EdgeScaleLODBehaviour,
  ParallelEdgeBehaviour,
  LabelCollisionBehaviour,
} from '@invana/graph';
import { DensityContourFillLayer, DensityContourStrokeLayer } from '@invana/graph-layer-d3-contour';
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';
import { MapLayer } from '@invana/graph-layer-maplibre';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { D3SankeyLayout } from '@invana/graph-layout-d3-sankey';
import { GeometricLayout } from '@invana/graph-layout-geometric';

/**
 * Maps a live engine instance to a `CanvasSettingsPanelView` registry `kind` by
 * class. The `kind` strings match `DEFAULT_CANVAS_SETTINGS_SCHEMAS` in
 * `@invana/canvas-ui`, so the panel resolves each instance's schema + mappers.
 */
const KIND_MATCHERS: { match: (i: unknown) => boolean; kind: string }[] = [
  // Layers
  { match: (i) => i instanceof BackgroundLayer, kind: 'background-layer' },
  { match: (i) => i instanceof DevInfoLayer, kind: 'dev-info-layer' },
  { match: (i) => i instanceof MiniMapLayer, kind: 'minimap-layer' },
  { match: (i) => i instanceof DensityContourFillLayer, kind: 'density-contour-fill-layer' },
  { match: (i) => i instanceof DensityContourStrokeLayer, kind: 'density-contour-stroke-layer' },
  { match: (i) => i instanceof BubbleSetsLayer, kind: 'bubble-sets-layer' },
  { match: (i) => i instanceof MapLayer, kind: 'map-layer' },
  // Behaviours
  { match: (i) => i instanceof DragPanBehaviour, kind: 'drag-pan' },
  { match: (i) => i instanceof PinchZoomBehaviour, kind: 'pinch-zoom' },
  { match: (i) => i instanceof KeyboardCameraInputBehaviour, kind: 'keyboard-camera' },
  { match: (i) => i instanceof WheelZoomBehaviour, kind: 'wheel-zoom' },
  { match: (i) => i instanceof DragShapeBehaviour, kind: 'drag-shape' },
  { match: (i) => i instanceof DragNodeBehaviour, kind: 'drag-node' },
  { match: (i) => i instanceof HoverActivateBehaviour, kind: 'hover-activate' },
  { match: (i) => i instanceof ClickSelectBehaviour, kind: 'click-select' },
  { match: (i) => i instanceof ClickInspectBehaviour, kind: 'click-inspect' },
  { match: (i) => i instanceof ClickViewBehaviour, kind: 'click-view' },
  { match: (i) => i instanceof HoverElementPreviewBehaviour, kind: 'hover-element-preview' },
  { match: (i) => i instanceof BrushSelectBehaviour, kind: 'brush-select' },
  { match: (i) => i instanceof LassoSelectBehaviour, kind: 'lasso-select' },
  { match: (i) => i instanceof CreateNodeBehaviour, kind: 'create-node' },
  { match: (i) => i instanceof DrawEdgeBehaviour, kind: 'draw-edge' },
  { match: (i) => i instanceof EraseBehaviour, kind: 'erase' },
  { match: (i) => i instanceof NodeResizeBehaviour, kind: 'node-resize' },
  { match: (i) => i instanceof CollapseExpandBehaviour, kind: 'collapse-expand' },
  { match: (i) => i instanceof ColorByLabelBehaviour, kind: 'color-by-label' },
  { match: (i) => i instanceof ThemeBehaviour, kind: 'theme' },
  { match: (i) => i instanceof NodeCentralityBehaviour, kind: 'degree-size' },
  { match: (i) => i instanceof ContextMenuBehaviour, kind: 'context-menu' },
  { match: (i) => i instanceof TextResolutionLODBehaviour, kind: 'label-resolution-lod' },
  { match: (i) => i instanceof NodeScaleLODBehaviour, kind: 'node-size-lod' },
  { match: (i) => i instanceof EdgeScaleLODBehaviour, kind: 'edge-size-lod' },
  { match: (i) => i instanceof ParallelEdgeBehaviour, kind: 'parallel-edge' },
  { match: (i) => i instanceof LabelCollisionBehaviour, kind: 'label-collision' },
  // Layouts
  { match: (i) => i instanceof D3ForceLayout, kind: 'd3-force-layout' },
  { match: (i) => i instanceof ElkLayout, kind: 'elk-layout' },
  { match: (i) => i instanceof D3HierarchyLayout, kind: 'd3-hierarchy-layout' },
  { match: (i) => i instanceof D3SankeyLayout, kind: 'd3-sankey-layout' },
  { match: (i) => i instanceof GeometricLayout, kind: 'geometric-layout' },
];

/** Resolve a live instance's registry `kind`, or `undefined` if unrecognised. */
export function resolveKind(instance: unknown): string | undefined {
  return KIND_MATCHERS.find((k) => k.match(instance))?.kind;
}

/** Best-effort read of an instance's current options for seeding the panel. */
export function readOptions(instance: unknown): Record<string, unknown> {
  const getOptions = (instance as { getOptions?: () => unknown }).getOptions;
  if (typeof getOptions === 'function') {
    const opts = getOptions.call(instance);
    if (opts && typeof opts === 'object') return { ...(opts as Record<string, unknown>) };
  }
  const options = (instance as { options?: unknown }).options;
  if (options && typeof options === 'object') return { ...(options as Record<string, unknown>) };
  return {};
}

/** Turn one live instance into a `CanvasSettingsInstance` for the panel. */
export function toSettingsInstance(
  instance: unknown,
  section: SettingsSection,
): CanvasSettingsInstance {
  return {
    id: (instance as { id: string }).id,
    kind: resolveKind(instance) ?? (instance as object).constructor.name,
    // Behaviours carry an on/off toggle; layers/layouts don't here.
    enabled:
      section === 'behaviours' ? (instance as { enabled?: boolean }).enabled : undefined,
    settings: readOptions(instance),
  };
}
