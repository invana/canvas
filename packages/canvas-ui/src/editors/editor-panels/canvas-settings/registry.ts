// The canvas-settings schema registry — one entry per editable Behaviour / Layer
// / Layout `kind`, bundling its `@invana/forms` field schema with the
// engine⇄form mappers that already live in each `editors/<surface>/` folder.
//
// `CanvasSettingsEditorPanel` reads a canvas definition keyed by these `kind`
// strings and, per instance, uses the entry to (a) seed the form from the
// instance's engine-shaped settings (`toForm`), (b) render the schema, and (c)
// map edits back to an engine-shaped patch (`toOptions`).
//
// Imports go straight to each folder's `fields.ts` / `mapping.ts` (not the
// package barrel — this file *is* part of the barrel) so the registry does not
// pull in the per-surface editor components.

import type { FieldConfig } from '@invana/forms';

import type { SettingsSection } from './types';

// ── Layers ────────────────────────────────────────────────────────────────
import { backgroundLayerFields } from '../../layers/background-layer/fields';
import {
  optionsToForm as backgroundLayerToForm,
  formToOptions as backgroundLayerToOptions,
} from '../../layers/background-layer/mapping';
import { devInfoLayerFields } from '../../layers/dev-info-layer/fields';
import {
  optionsToForm as devInfoLayerToForm,
  formToOptions as devInfoLayerToOptions,
} from '../../layers/dev-info-layer/mapping';
import { miniMapLayerFields } from '../../layers/minimap-layer/fields';
import {
  optionsToForm as miniMapLayerToForm,
  formToOptions as miniMapLayerToOptions,
} from '../../layers/minimap-layer/mapping';
import { densityContourFillLayerFields } from '../../layers/density-contour-fill-layer/fields';
import {
  optionsToForm as densityContourFillLayerToForm,
  formToOptions as densityContourFillLayerToOptions,
} from '../../layers/density-contour-fill-layer/mapping';
import { densityContourStrokeLayerFields } from '../../layers/density-contour-stroke-layer/fields';
import {
  optionsToForm as densityContourStrokeLayerToForm,
  formToOptions as densityContourStrokeLayerToOptions,
} from '../../layers/density-contour-stroke-layer/mapping';
import { bubbleSetsLayerFields } from '../../layers/bubble-sets-layer/fields';
import {
  optionsToForm as bubbleSetsLayerToForm,
  formToOptions as bubbleSetsLayerToOptions,
} from '../../layers/bubble-sets-layer/mapping';
import { mapLayerFields } from '../../layers/map-layer/fields';
import {
  optionsToForm as mapLayerToForm,
  formToOptions as mapLayerToOptions,
} from '../../layers/map-layer/mapping';

// ── Behaviours ──────────────────────────────────────────────────────────────
import { dragPanFields } from '../../behaviours/drag-pan/fields';
import {
  optionsToForm as dragPanToForm,
  formToOptions as dragPanToOptions,
} from '../../behaviours/drag-pan/mapping';
import { pinchZoomFields } from '../../behaviours/pinch-zoom/fields';
import {
  optionsToForm as pinchZoomToForm,
  formToOptions as pinchZoomToOptions,
} from '../../behaviours/pinch-zoom/mapping';
import { keyboardCameraFields } from '../../behaviours/keyboard-camera/fields';
import {
  optionsToForm as keyboardCameraToForm,
  formToOptions as keyboardCameraToOptions,
} from '../../behaviours/keyboard-camera/mapping';
import { wheelZoomFields } from '../../behaviours/wheel-zoom/fields';
import {
  optionsToForm as wheelZoomToForm,
  formToOptions as wheelZoomToOptions,
} from '../../behaviours/wheel-zoom/mapping';
import { dragShapeFields } from '../../behaviours/drag-shape/fields';
import {
  optionsToForm as dragShapeToForm,
  formToOptions as dragShapeToOptions,
} from '../../behaviours/drag-shape/mapping';
import { dragNodeFields } from '../../behaviours/drag-node/fields';
import {
  optionsToForm as dragNodeToForm,
  formToOptions as dragNodeToOptions,
} from '../../behaviours/drag-node/mapping';
import { hoverActivateFields } from '../../behaviours/hover-activate/fields';
import {
  optionsToForm as hoverActivateToForm,
  formToOptions as hoverActivateToOptions,
} from '../../behaviours/hover-activate/mapping';
import { clickSelectFields } from '../../behaviours/click-select/fields';
import {
  optionsToForm as clickSelectToForm,
  formToOptions as clickSelectToOptions,
} from '../../behaviours/click-select/mapping';
import { clickInspectFields } from '../../behaviours/click-inspect/fields';
import {
  optionsToForm as clickInspectToForm,
  formToOptions as clickInspectToOptions,
} from '../../behaviours/click-inspect/mapping';
import { clickViewFields } from '../../behaviours/click-view/fields';
import {
  optionsToForm as clickViewToForm,
  formToOptions as clickViewToOptions,
} from '../../behaviours/click-view/mapping';
import { hoverElementPreviewFields } from '../../behaviours/hover-element-preview/fields';
import {
  optionsToForm as hoverElementPreviewToForm,
  formToOptions as hoverElementPreviewToOptions,
} from '../../behaviours/hover-element-preview/mapping';
import { brushSelectFields } from '../../behaviours/brush-select/fields';
import {
  optionsToForm as brushSelectToForm,
  formToOptions as brushSelectToOptions,
} from '../../behaviours/brush-select/mapping';
import { lassoSelectFields } from '../../behaviours/lasso-select/fields';
import {
  optionsToForm as lassoSelectToForm,
  formToOptions as lassoSelectToOptions,
} from '../../behaviours/lasso-select/mapping';
import { createNodeFields } from '../../behaviours/create-node/fields';
import {
  optionsToForm as createNodeToForm,
  formToOptions as createNodeToOptions,
} from '../../behaviours/create-node/mapping';
import { drawEdgeFields } from '../../behaviours/draw-edge/fields';
import {
  optionsToForm as drawEdgeToForm,
  formToOptions as drawEdgeToOptions,
} from '../../behaviours/draw-edge/mapping';
import { eraseFields } from '../../behaviours/erase/fields';
import {
  optionsToForm as eraseToForm,
  formToOptions as eraseToOptions,
} from '../../behaviours/erase/mapping';
import { nodeResizeFields } from '../../behaviours/node-resize/fields';
import {
  optionsToForm as nodeResizeToForm,
  formToOptions as nodeResizeToOptions,
} from '../../behaviours/node-resize/mapping';
import { collapseExpandFields } from '../../behaviours/collapse-expand/fields';
import {
  optionsToForm as collapseExpandToForm,
  formToOptions as collapseExpandToOptions,
} from '../../behaviours/collapse-expand/mapping';
import { colorByLabelFields } from '../../behaviours/color-by-label/fields';
import {
  optionsToForm as colorByLabelToForm,
  formToOptions as colorByLabelToOptions,
} from '../../behaviours/color-by-label/mapping';
import { themeFields } from '../../behaviours/theme/fields';
import {
  optionsToForm as themeToForm,
  formToOptions as themeToOptions,
} from '../../behaviours/theme/mapping';
import { nodeCentralityFields } from '../../behaviours/node-centrality/fields';
import {
  optionsToForm as nodeCentralityToForm,
  formToOptions as nodeCentralityToOptions,
} from '../../behaviours/node-centrality/mapping';
import { contextMenuFields } from '../../behaviours/context-menu/fields';
import {
  optionsToForm as contextMenuToForm,
  formToOptions as contextMenuToOptions,
} from '../../behaviours/context-menu/mapping';
import { textResolutionLodFields } from '../../behaviours/text-resolution-lod/fields';
import {
  optionsToForm as textResolutionLodToForm,
  formToOptions as textResolutionLodToOptions,
} from '../../behaviours/text-resolution-lod/mapping';
import { nodeScaleLodFields } from '../../behaviours/node-scale-lod/fields';
import {
  optionsToForm as nodeScaleLodToForm,
  formToOptions as nodeScaleLodToOptions,
} from '../../behaviours/node-scale-lod/mapping';
import { edgeScaleLodFields } from '../../behaviours/edge-scale-lod/fields';
import {
  optionsToForm as edgeScaleLodToForm,
  formToOptions as edgeScaleLodToOptions,
} from '../../behaviours/edge-scale-lod/mapping';
import { parallelEdgeFields } from '../../behaviours/parallel-edge/fields';
import {
  optionsToForm as parallelEdgeToForm,
  formToOptions as parallelEdgeToOptions,
} from '../../behaviours/parallel-edge/mapping';
import { labelCollisionFields } from '../../behaviours/label-collision/fields';
import {
  optionsToForm as labelCollisionToForm,
  formToOptions as labelCollisionToOptions,
} from '../../behaviours/label-collision/mapping';

// ── Layouts ───────────────────────────────────────────────────────────────
import { d3ForceLayoutFields } from '../../layouts/d3-force-layout/fields';
import {
  optionsToForm as d3ForceLayoutToForm,
  formToOptions as d3ForceLayoutToOptions,
} from '../../layouts/d3-force-layout/mapping';
import { elkLayoutFields } from '../../layouts/elk-layout/fields';
import {
  optionsToForm as elkLayoutToForm,
  formToOptions as elkLayoutToOptions,
} from '../../layouts/elk-layout/mapping';
import { d3HierarchyLayoutFields } from '../../layouts/d3-hierarchy-layout/fields';
import {
  optionsToForm as d3HierarchyLayoutToForm,
  formToOptions as d3HierarchyLayoutToOptions,
} from '../../layouts/d3-hierarchy-layout/mapping';
import { d3SankeyLayoutFields } from '../../layouts/d3-sankey-layout/fields';
import {
  optionsToForm as d3SankeyLayoutToForm,
  formToOptions as d3SankeyLayoutToOptions,
} from '../../layouts/d3-sankey-layout/mapping';
import { geometricLayoutFields } from '../../layouts/geometric-layout/fields';
import {
  optionsToForm as geometricLayoutToForm,
  formToOptions as geometricLayoutToOptions,
} from '../../layouts/geometric-layout/mapping';

/**
 * One registry entry: everything `CanvasSettingsEditorPanel` needs to render + wire
 * one instance's settings form. Bundles the display label, the `@invana/forms`
 * field schema (static array or a `(values) => FieldConfig[]` function for the
 * conditional schemas), and the two pure mappers that bridge the engine's option
 * encoding and the flat scalar fields the form edits.
 *
 * `settings` is left untyped (`any`) here on purpose — each entry pairs a schema
 * with its own `Options`/`Fields` shapes, and the panel treats them opaquely.
 */
export interface SettingsSchemaEntry {
  /** Which config section this kind lives under (`layers` / `behaviours` / `layouts`). */
  section: SettingsSection;
  /** Human label for the kind, shown next to the instance id (e.g. `'Background Layer'`). */
  typeLabel: string;
  /** `@invana/forms` schema — a static array or a function of the live form values. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields: FieldConfig[] | ((values: any) => FieldConfig[]);
  /** Seed the flat form values from an instance's engine-shaped options. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toForm: (options: any) => any;
  /** Map the flat form values back to an engine-shaped options patch. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toOptions: (fields: any) => any;
}

/**
 * The built-in schema registry keyed by `kind`. Covers every Behaviour / Layer /
 * Layout that ships an editor in `@invana/canvas-ui` — the same coverage the
 * live `ALL_SETTINGS_EDITORS` descriptor list carries. Hosts can pass a superset
 * / subset via `CanvasSettingsEditorPanel`'s `schemas` prop.
 */
export const DEFAULT_CANVAS_SETTINGS_SCHEMAS: Record<string, SettingsSchemaEntry> = {
  // Layers
  'background-layer': { section: 'layers', typeLabel: 'Background Layer', fields: backgroundLayerFields, toForm: backgroundLayerToForm, toOptions: backgroundLayerToOptions },
  'dev-info-layer': { section: 'layers', typeLabel: 'Dev Info Layer', fields: devInfoLayerFields, toForm: devInfoLayerToForm, toOptions: devInfoLayerToOptions },
  'minimap-layer': { section: 'layers', typeLabel: 'Mini-map Layer', fields: miniMapLayerFields, toForm: miniMapLayerToForm, toOptions: miniMapLayerToOptions },
  'density-contour-fill-layer': { section: 'layers', typeLabel: 'Density Contour Fill', fields: densityContourFillLayerFields, toForm: densityContourFillLayerToForm, toOptions: densityContourFillLayerToOptions },
  'density-contour-stroke-layer': { section: 'layers', typeLabel: 'Density Contour Stroke', fields: densityContourStrokeLayerFields, toForm: densityContourStrokeLayerToForm, toOptions: densityContourStrokeLayerToOptions },
  'bubble-sets-layer': { section: 'layers', typeLabel: 'Bubble Sets Layer', fields: bubbleSetsLayerFields, toForm: bubbleSetsLayerToForm, toOptions: bubbleSetsLayerToOptions },
  'map-layer': { section: 'layers', typeLabel: 'Map Layer', fields: mapLayerFields, toForm: mapLayerToForm, toOptions: mapLayerToOptions },

  // Behaviours
  'drag-pan': { section: 'behaviours', typeLabel: 'Drag Pan', fields: dragPanFields, toForm: dragPanToForm, toOptions: dragPanToOptions },
  'pinch-zoom': { section: 'behaviours', typeLabel: 'Pinch Zoom', fields: pinchZoomFields, toForm: pinchZoomToForm, toOptions: pinchZoomToOptions },
  'keyboard-camera': { section: 'behaviours', typeLabel: 'Keyboard Camera', fields: keyboardCameraFields, toForm: keyboardCameraToForm, toOptions: keyboardCameraToOptions },
  'wheel-zoom': { section: 'behaviours', typeLabel: 'Wheel Zoom', fields: wheelZoomFields, toForm: wheelZoomToForm, toOptions: wheelZoomToOptions },
  'drag-shape': { section: 'behaviours', typeLabel: 'Drag Shape', fields: dragShapeFields, toForm: dragShapeToForm, toOptions: dragShapeToOptions },
  'drag-node': { section: 'behaviours', typeLabel: 'Drag Node', fields: dragNodeFields, toForm: dragNodeToForm, toOptions: dragNodeToOptions },
  'hover-activate': { section: 'behaviours', typeLabel: 'Hover Activate', fields: hoverActivateFields, toForm: hoverActivateToForm, toOptions: hoverActivateToOptions },
  'click-select': { section: 'behaviours', typeLabel: 'Click Select', fields: clickSelectFields, toForm: clickSelectToForm, toOptions: clickSelectToOptions },
  'click-inspect': { section: 'behaviours', typeLabel: 'Click Inspect', fields: clickInspectFields, toForm: clickInspectToForm, toOptions: clickInspectToOptions },
  'click-view': { section: 'behaviours', typeLabel: 'Click View', fields: clickViewFields, toForm: clickViewToForm, toOptions: clickViewToOptions },
  'hover-element-preview': { section: 'behaviours', typeLabel: 'Hover Preview', fields: hoverElementPreviewFields, toForm: hoverElementPreviewToForm, toOptions: hoverElementPreviewToOptions },
  'brush-select': { section: 'behaviours', typeLabel: 'Brush Select', fields: brushSelectFields, toForm: brushSelectToForm, toOptions: brushSelectToOptions },
  'lasso-select': { section: 'behaviours', typeLabel: 'Lasso Select', fields: lassoSelectFields, toForm: lassoSelectToForm, toOptions: lassoSelectToOptions },
  'create-node': { section: 'behaviours', typeLabel: 'Create Node', fields: createNodeFields, toForm: createNodeToForm, toOptions: createNodeToOptions },
  'draw-edge': { section: 'behaviours', typeLabel: 'Draw Edge', fields: drawEdgeFields, toForm: drawEdgeToForm, toOptions: drawEdgeToOptions },
  'erase': { section: 'behaviours', typeLabel: 'Erase', fields: eraseFields, toForm: eraseToForm, toOptions: eraseToOptions },
  'node-resize': { section: 'behaviours', typeLabel: 'Node Resize', fields: nodeResizeFields, toForm: nodeResizeToForm, toOptions: nodeResizeToOptions },
  'collapse-expand': { section: 'behaviours', typeLabel: 'Collapse / Expand', fields: collapseExpandFields, toForm: collapseExpandToForm, toOptions: collapseExpandToOptions },
  'color-by-label': { section: 'behaviours', typeLabel: 'Color by Label', fields: colorByLabelFields, toForm: colorByLabelToForm, toOptions: colorByLabelToOptions },
  'theme': { section: 'behaviours', typeLabel: 'Theme', fields: themeFields, toForm: themeToForm, toOptions: themeToOptions },
  'degree-size': { section: 'behaviours', typeLabel: 'Degree Size', fields: nodeCentralityFields, toForm: nodeCentralityToForm, toOptions: nodeCentralityToOptions },
  'context-menu': { section: 'behaviours', typeLabel: 'Context Menu', fields: contextMenuFields, toForm: contextMenuToForm, toOptions: contextMenuToOptions },
  'label-resolution-lod': { section: 'behaviours', typeLabel: 'Label Resolution LOD', fields: textResolutionLodFields, toForm: textResolutionLodToForm, toOptions: textResolutionLodToOptions },
  'node-size-lod': { section: 'behaviours', typeLabel: 'Node Size LOD', fields: nodeScaleLodFields, toForm: nodeScaleLodToForm, toOptions: nodeScaleLodToOptions },
  'edge-size-lod': { section: 'behaviours', typeLabel: 'Edge Size LOD', fields: edgeScaleLodFields, toForm: edgeScaleLodToForm, toOptions: edgeScaleLodToOptions },
  'parallel-edge': { section: 'behaviours', typeLabel: 'Parallel Edge', fields: parallelEdgeFields, toForm: parallelEdgeToForm, toOptions: parallelEdgeToOptions },
  'label-collision': { section: 'behaviours', typeLabel: 'Label Collision', fields: labelCollisionFields, toForm: labelCollisionToForm, toOptions: labelCollisionToOptions },

  // Layouts
  'd3-force-layout': { section: 'layouts', typeLabel: 'D3 Force', fields: d3ForceLayoutFields, toForm: d3ForceLayoutToForm, toOptions: d3ForceLayoutToOptions },
  'elk-layout': { section: 'layouts', typeLabel: 'ELK', fields: elkLayoutFields, toForm: elkLayoutToForm, toOptions: elkLayoutToOptions },
  'd3-hierarchy-layout': { section: 'layouts', typeLabel: 'D3 Hierarchy', fields: d3HierarchyLayoutFields, toForm: d3HierarchyLayoutToForm, toOptions: d3HierarchyLayoutToOptions },
  'd3-sankey-layout': { section: 'layouts', typeLabel: 'D3 Sankey', fields: d3SankeyLayoutFields, toForm: d3SankeyLayoutToForm, toOptions: d3SankeyLayoutToOptions },
  'geometric-layout': { section: 'layouts', typeLabel: 'Geometric', fields: geometricLayoutFields, toForm: geometricLayoutToForm, toOptions: geometricLayoutToOptions },
};
