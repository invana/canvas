// The canvas-settings schema registry — one entry per editable Behaviour / Layer
// / Layout `kind`, bundling its `@invana/forms` field schema with the
// engine⇄form mappers that already live in each `editors/<surface>/` folder.
//
// `CanvasSettingsEditor` reads a canvas definition keyed by these `kind`
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
import { backgroundLayerFields } from '../background-layer/fields';
import {
  optionsToForm as backgroundLayerToForm,
  formToOptions as backgroundLayerToOptions,
} from '../background-layer/mapping';
import { devInfoLayerFields } from '../dev-info-layer/fields';
import {
  optionsToForm as devInfoLayerToForm,
  formToOptions as devInfoLayerToOptions,
} from '../dev-info-layer/mapping';
import { miniMapLayerFields } from '../minimap-layer/fields';
import {
  optionsToForm as miniMapLayerToForm,
  formToOptions as miniMapLayerToOptions,
} from '../minimap-layer/mapping';
import { densityContourFillLayerFields } from '../density-contour-fill-layer/fields';
import {
  optionsToForm as densityContourFillLayerToForm,
  formToOptions as densityContourFillLayerToOptions,
} from '../density-contour-fill-layer/mapping';
import { densityContourStrokeLayerFields } from '../density-contour-stroke-layer/fields';
import {
  optionsToForm as densityContourStrokeLayerToForm,
  formToOptions as densityContourStrokeLayerToOptions,
} from '../density-contour-stroke-layer/mapping';
import { bubbleSetsLayerFields } from '../bubble-sets-layer/fields';
import {
  optionsToForm as bubbleSetsLayerToForm,
  formToOptions as bubbleSetsLayerToOptions,
} from '../bubble-sets-layer/mapping';
import { mapLayerFields } from '../map-layer/fields';
import {
  optionsToForm as mapLayerToForm,
  formToOptions as mapLayerToOptions,
} from '../map-layer/mapping';

// ── Behaviours ──────────────────────────────────────────────────────────────
import { dragPanFields } from '../drag-pan/fields';
import {
  optionsToForm as dragPanToForm,
  formToOptions as dragPanToOptions,
} from '../drag-pan/mapping';
import { pinchZoomFields } from '../pinch-zoom/fields';
import {
  optionsToForm as pinchZoomToForm,
  formToOptions as pinchZoomToOptions,
} from '../pinch-zoom/mapping';
import { keyboardCameraFields } from '../keyboard-camera/fields';
import {
  optionsToForm as keyboardCameraToForm,
  formToOptions as keyboardCameraToOptions,
} from '../keyboard-camera/mapping';
import { wheelZoomFields } from '../wheel-zoom/fields';
import {
  optionsToForm as wheelZoomToForm,
  formToOptions as wheelZoomToOptions,
} from '../wheel-zoom/mapping';
import { dragShapeFields } from '../drag-shape/fields';
import {
  optionsToForm as dragShapeToForm,
  formToOptions as dragShapeToOptions,
} from '../drag-shape/mapping';
import { dragNodeFields } from '../drag-node/fields';
import {
  optionsToForm as dragNodeToForm,
  formToOptions as dragNodeToOptions,
} from '../drag-node/mapping';
import { hoverActivateFields } from '../hover-activate/fields';
import {
  optionsToForm as hoverActivateToForm,
  formToOptions as hoverActivateToOptions,
} from '../hover-activate/mapping';
import { clickSelectFields } from '../click-select/fields';
import {
  optionsToForm as clickSelectToForm,
  formToOptions as clickSelectToOptions,
} from '../click-select/mapping';
import { clickInspectFields } from '../click-inspect/fields';
import {
  optionsToForm as clickInspectToForm,
  formToOptions as clickInspectToOptions,
} from '../click-inspect/mapping';
import { clickViewFields } from '../click-view/fields';
import {
  optionsToForm as clickViewToForm,
  formToOptions as clickViewToOptions,
} from '../click-view/mapping';
import { hoverElementPreviewFields } from '../hover-element-preview/fields';
import {
  optionsToForm as hoverElementPreviewToForm,
  formToOptions as hoverElementPreviewToOptions,
} from '../hover-element-preview/mapping';
import { brushSelectFields } from '../brush-select/fields';
import {
  optionsToForm as brushSelectToForm,
  formToOptions as brushSelectToOptions,
} from '../brush-select/mapping';
import { lassoSelectFields } from '../lasso-select/fields';
import {
  optionsToForm as lassoSelectToForm,
  formToOptions as lassoSelectToOptions,
} from '../lasso-select/mapping';
import { createNodeFields } from '../create-node/fields';
import {
  optionsToForm as createNodeToForm,
  formToOptions as createNodeToOptions,
} from '../create-node/mapping';
import { drawEdgeFields } from '../draw-edge/fields';
import {
  optionsToForm as drawEdgeToForm,
  formToOptions as drawEdgeToOptions,
} from '../draw-edge/mapping';
import { eraseFields } from '../erase/fields';
import {
  optionsToForm as eraseToForm,
  formToOptions as eraseToOptions,
} from '../erase/mapping';
import { nodeResizeFields } from '../node-resize/fields';
import {
  optionsToForm as nodeResizeToForm,
  formToOptions as nodeResizeToOptions,
} from '../node-resize/mapping';
import { collapseExpandFields } from '../collapse-expand/fields';
import {
  optionsToForm as collapseExpandToForm,
  formToOptions as collapseExpandToOptions,
} from '../collapse-expand/mapping';
import { colorByLabelFields } from '../color-by-label/fields';
import {
  optionsToForm as colorByLabelToForm,
  formToOptions as colorByLabelToOptions,
} from '../color-by-label/mapping';
import { themeFields } from '../theme/fields';
import {
  optionsToForm as themeToForm,
  formToOptions as themeToOptions,
} from '../theme/mapping';
import { nodeCentralityFields } from '../node-centrality/fields';
import {
  optionsToForm as nodeCentralityToForm,
  formToOptions as nodeCentralityToOptions,
} from '../node-centrality/mapping';
import { contextMenuFields } from '../context-menu/fields';
import {
  optionsToForm as contextMenuToForm,
  formToOptions as contextMenuToOptions,
} from '../context-menu/mapping';
import { textResolutionLodFields } from '../text-resolution-lod/fields';
import {
  optionsToForm as textResolutionLodToForm,
  formToOptions as textResolutionLodToOptions,
} from '../text-resolution-lod/mapping';
import { nodeScaleLodFields } from '../node-scale-lod/fields';
import {
  optionsToForm as nodeScaleLodToForm,
  formToOptions as nodeScaleLodToOptions,
} from '../node-scale-lod/mapping';
import { edgeScaleLodFields } from '../edge-scale-lod/fields';
import {
  optionsToForm as edgeScaleLodToForm,
  formToOptions as edgeScaleLodToOptions,
} from '../edge-scale-lod/mapping';
import { parallelEdgeFields } from '../parallel-edge/fields';
import {
  optionsToForm as parallelEdgeToForm,
  formToOptions as parallelEdgeToOptions,
} from '../parallel-edge/mapping';
import { labelCollisionFields } from '../label-collision/fields';
import {
  optionsToForm as labelCollisionToForm,
  formToOptions as labelCollisionToOptions,
} from '../label-collision/mapping';

// ── Layouts ───────────────────────────────────────────────────────────────
import { d3ForceLayoutFields } from '../d3-force-layout/fields';
import {
  optionsToForm as d3ForceLayoutToForm,
  formToOptions as d3ForceLayoutToOptions,
} from '../d3-force-layout/mapping';
import { elkLayoutFields } from '../elk-layout/fields';
import {
  optionsToForm as elkLayoutToForm,
  formToOptions as elkLayoutToOptions,
} from '../elk-layout/mapping';
import { d3HierarchyLayoutFields } from '../d3-hierarchy-layout/fields';
import {
  optionsToForm as d3HierarchyLayoutToForm,
  formToOptions as d3HierarchyLayoutToOptions,
} from '../d3-hierarchy-layout/mapping';
import { d3SankeyLayoutFields } from '../d3-sankey-layout/fields';
import {
  optionsToForm as d3SankeyLayoutToForm,
  formToOptions as d3SankeyLayoutToOptions,
} from '../d3-sankey-layout/mapping';
import { geometricLayoutFields } from '../geometric-layout/fields';
import {
  optionsToForm as geometricLayoutToForm,
  formToOptions as geometricLayoutToOptions,
} from '../geometric-layout/mapping';

/**
 * One registry entry: everything `CanvasSettingsEditor` needs to render + wire
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
 * / subset via `CanvasSettingsEditor`'s `schemas` prop.
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
