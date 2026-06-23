// Shared configuration for the canvas-react story shell (`<StoryGraphApp>`).
//
// These are the serialisable config blocks, palette, layout factories, and
// select-mode maps extracted (verbatim) from the original
// `use-cases/GraphVisualiserApp.stories.tsx` so every canvas-react story can
// reuse the same explorer-like defaults. Nothing here touches the engine — it's
// pure data + factory functions.

import type { CanvasConfig, LayoutFactory } from '@invana/canvas-react';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import {
  Cable,
  CornerDownRight,
  Lasso,
  Minus,
  MousePointer2,
  Spline,
  SquareDashedMousePointer,
  Waypoints,
} from 'lucide-react';

/** "Focus on node" zooms in to at least this scale so the node is comfortably sized. */
export const FOCUS_ZOOM = 2;

/** PixiJS render backend, switched live from the header toolbar. */
export type CanvasBackend = 'webgl' | 'webgpu';
export const BACKEND_LABEL: Record<CanvasBackend, string> = {
  webgl: 'WebGL',
  webgpu: 'WebGPU',
};

/**
 * Id of the registered active layout — shared by the `<D3ForceLayout>` that
 * registers it, the `<AutoLayoutBridge>` that runs it on data change, and the
 * header's "Re-render" button (`canvas.refresh()` re-runs `activeLayout`).
 */
export const ACTIVE_LAYOUT_ID = 'd3-force-active';

/**
 * Forces for the registered active layout. `animate: false` so the simulation
 * settles off-thread and snaps into place (clean for static story data) rather
 * than drifting visibly.
 */
export const FORCE_OPTS = {
  charge: { strength: -160 },
  link: { distance: 56 },
  collide: { radius: 14 },
  animate: false,
};

/** Distinct colour per node label (its graph-DB type / category). */
export const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

/**
 * Theme-independent settings keyed by id (same shape as the imperative
 * `canvasOptions`). Theme colours live in {@link APP_LIGHT} / {@link APP_DARK}
 * and are pushed by the shell's `SystemTheme` child. `activeLayout` points at the
 * registered `<D3ForceLayout id={ACTIVE_LAYOUT_ID}>` so the header's "Re-render"
 * re-runs it.
 */
export const APP_OPTIONS: CanvasConfig = {
  activeLayout: ACTIVE_LAYOUT_ID,
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.5 },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 8 },
          bgStrokeWidth: 1.5,
          labelFontSize: 11,
          labelPlacement: 'bottom',
          labelOffsetY: 4,
        },
      },
      edge: { style: { strokeWidth: 1, arrowTargetShape: 'none' } },
    },
    minimap: { position: 'bottom-left', margin: { x: 20 } },
  },
  behaviours: {
    pan: { enabled: true },
    'drag-node': { enabled: true },
    wheel: { enabled: true },
    pinch: { enabled: true },
    hover: { enabled: true },
    'click-select': { enabled: true },
    'brush-select': { enabled: false },
    'lasso-select': { enabled: false },
    'click-view': { enabled: true },
    'label-lod': { enabled: true },
  },
};

export const APP_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#e2e8f0' },
    graph: {
      node: { style: { labelColor: 0x334155, bgStrokeColor: 0xffffff } },
      edge: { style: { strokeColor: 0x475569, arrowTargetColor: 0x475569 } },
    },
    // Background colour is mirrored from the `background` layer via the
    // minimap's `backgroundLayerId`; only the border needs a theme colour here.
    minimap: { borderColor: 0x94a3b8 },
  },
};
export const APP_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#1e293b' },
    graph: {
      node: { style: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a } },
      edge: { style: { strokeColor: 0x64748b, arrowTargetColor: 0x64748b } },
    },
    minimap: { borderColor: 0x334155 },
  },
};

/**
 * Default layout factories for the header picker — each call yields a fresh
 * instance. Module-level so the reference stays stable across renders (keeps
 * `useLayout`'s `applyLayout` stable). Stories can override via the
 * `<StoryGraphApp layouts>` prop.
 */
export const DEFAULT_LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({
      charge: { strength: -160 },
      link: { distance: 56 },
      collide: { radius: 14 },
      animate: false,
    }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
  'elk-stress': () => new ElkLayout({ algorithm: 'stress' }),
};
export const DEFAULT_LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

/** Select-mode key → registered behaviour id. Click = empty id (no drag-select). */
export const SELECT_MODE_IDS = { click: '', brush: 'brush-select', lasso: 'lasso-select' };
export const SELECT_LABEL: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};
export const SELECT_ICONS = {
  click: MousePointer2,
  brush: SquareDashedMousePointer,
  lasso: Lasso,
};
/** Gesture copy per select mode — pushed to the message channel on a mode switch. */
export const SELECT_HINT: Record<string, string> = {
  click: 'Click a node or edge to select',
  brush: 'Hold Shift + drag to select nodes & edges',
  lasso: 'Hold Shift + drag a lasso around nodes & edges',
};

/** Icon per edge routing type, shown on the edge-routing picker. */
export const EDGE_TYPE_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable,
};
