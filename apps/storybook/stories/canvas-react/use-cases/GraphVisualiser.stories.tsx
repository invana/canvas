/**
 * Graph data **visualiser** — config-first `@invana/canvas-react`. Every engine
 * instance is registered by a *minimal* JSX child (id + non-serialisable wiring
 * only); a single `canvasOptions` object — the same serialisable shape the
 * imperative stories use — supplies all their settings by id. UI chrome (the
 * combined toolbar, context menus, history/clipboard providers) stays as
 * children and drives the engine by id straight from context.
 *
 * The chrome is **one combined toolbar** pinned top-centre. Each group is a
 * self-wiring toolbar rendered `bare`; a single shared `<Panel>` stacks them.
 * Left-to-right: `<HistoryToolbar>`, `<GraphLayoutToolbar>` (layout + select-mode
 * switcher, driven by `useLayout` factories + `useSelectMode` ids),
 * `<EdgeTypePicker>`, `<EditToolbar>`, `<ViewToolbar>`, `<GridToolbar>`, and a
 * theme toggle. The minimap sits bottom-right.
 *
 * Theming is **external** (the engine is theme-agnostic): node/edge/background
 * colours are concrete in `canvasOptions`, and `useSystemTheme` + the manual
 * theme toggle push light/dark patches through `canvas.update()`.
 */

import { useCallback, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
  DragNodeBehaviour,
  DragPanBehaviour,
  EditToolbar,
  GraphClipboardProvider,
  GraphHistoryProvider,
  GraphLayer,
  GraphLayoutToolbar,
  GridToolbar,
  HistoryToolbar,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  LassoSelectBehaviour,
  MiniMapLayer,
  Panel,
  PinchZoomBehaviour,
  ToolbarItems,
  ViewToolbar,
  WheelZoomBehaviour,
  useGraphCanvasUpdate,
  useStyleEditorSection,
  useSystemTheme,
  type CanvasConfig,
  type ToolbarItem,
  type LayoutFactory,
  type GraphNodeMenuContext,
  type GraphEdgeMenuContext,
  type GraphBackgroundMenuContext,
} from '@invana/canvas-react';
import { Separator, type MenuItem } from '@invana/ui';
import type { GraphNode } from '@invana/graph';
import type * as graph from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { lesMiserables } from '@invana/graph-datasets';
import {
  Cable,
  ClipboardPaste,
  CornerDownRight,
  Copy,
  Eraser,
  Grid3x3,
  Lasso,
  Lock,
  LockOpen,
  Maximize,
  Minus,
  Moon,
  MousePointer2,
  Redo2,
  RefreshCw,
  Scissors,
  Spline,
  SquareDashedMousePointer,
  Sun,
  Undo2,
  Waypoints,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const meta: Meta = { title: 'canvas-react/usecases/GraphVisualiser' };
export default meta;
type Story = StoryObj;

// "Focus on node" zooms in to at least this scale (never zooms out) so the
// focused node is comfortably sized; tune to taste.
const FOCUS_ZOOM = 2;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;
type LesMisData = { group: number };
const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;

// Layout factories — each call produces a fresh instance. Module-level so the
// reference is stable across renders (keeps `useLayout`'s `applyLayout` stable).
const LAYOUTS: Record<string, LayoutFactory> = {
  'd3-force': () =>
    new D3ForceLayout({
      charge: { strength: -160 },
      link: { distance: 56 },
      collide: { radius: 14 },
      // Snap to the settled layout instead of animating every tick (ELK is
      // already one-shot, so this makes all three layouts apply instantly).
      animate: false,
    }),
  'elk-layered': () => new ElkLayout({ algorithm: 'layered', direction: 'RIGHT' }),
  'elk-stress': () => new ElkLayout({ algorithm: 'stress' }),
};
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

// Select-mode key → registered behaviour id. `useSelectMode` enables exactly
// one entry and disables the rest. Brush and lasso are both Shift+drag, so only
// one can be live. Click-select is always on (Shift+click) and doesn't collide,
// so its `click` entry maps to an empty id: picking it arms NO drag-select
// without disabling click-select — the hook skips ids it can't resolve.
const SELECT_MODE_IDS = { click: '', brush: 'brush-select', lasso: 'lasso-select' };
const SELECT_LABEL: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};
// Icon per select mode, shown on the dropdown trigger and beside each option.
const SELECT_ICONS = {
  click: MousePointer2,
  brush: SquareDashedMousePointer,
  lasso: Lasso,
};

// Icon per edge routing type, shown on the <EdgeTypePicker> trigger + options.
const EDGE_TYPE_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable,
};

// ── Serialisable config (settings by id) — same shape as the imperative
// `canvasOptions`. The non-serialisable bits (bgFill/labelText resolvers, the
// `data`, the cross-layer `graphLayerId`, behaviour `targetLayerId`/`degree`/`multiple`)
// ride on the minimal children below. Colours that follow the theme are pushed
// in via `useSystemTheme` / the theme toggle (see THEME patches). ──────────────
const CANVAS_OPTIONS: CanvasConfig = {
  layers: {
    // Theme-driven colours (backgroundColor/color) are NOT here — they're only
    // in LIGHT_PATCH/DARK_PATCH, pushed by <SystemTheme>. (The <Canvas> applies
    // this base config *after* the SystemTheme child effect, so a colour here
    // would clobber the resolved theme on mount.)
    background: { type: 'pattern', patternType: 'grid' },
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
    minimap: { position: 'bottom-right', margin: { x: 20 } },
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
    'label-lod': { enabled: true },
  },
};

// Light / dark colour patches (node labels + borders, edge strokes/arrows,
// background) pushed through `canvas.update()` — the theme-agnostic replacement
// for the old `<ResponsiveThemeBehaviour>`.
const LIGHT_PATCH: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#94a3b8' },
    graph: {
      node: { style: { labelColor: 0x334155, bgStrokeColor: 0xffffff } },
      edge: { style: { strokeColor: 0xcbd5e1, arrowTargetColor: 0xcbd5e1 } },
    },
  },
};
const DARK_PATCH: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#334155' },
    graph: {
      node: { style: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a } },
      edge: { style: { strokeColor: 0x475569, arrowTargetColor: 0x475569 } },
    },
  },
};

/**
 * Flip the `@invana/ui` chrome (toolbar buttons, menus) to match the canvas
 * theme, so the floating controls stay legible against the canvas.
 */
function applyChromeTheme(dark: boolean): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-theme', dark ? 'default-dark' : 'default-light');
  root.classList.remove('theme-default-light', 'theme-default-dark', 'light', 'dark');
  root.classList.add(dark ? 'theme-default-dark' : 'theme-default-light', dark ? 'dark' : 'light');
}

/** Whether the OS currently prefers a dark colour scheme. */
function osPrefersDark(): boolean {
  return (
    typeof window !== 'undefined'
    && !!window.matchMedia
    && window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/** Follows the OS scheme by pushing the matching colour patch through update(). */
function SystemTheme() {
  useSystemTheme(LIGHT_PATCH, DARK_PATCH);
  return null;
}

/** Edge-routing picker — the Style Editor section ({@link useStyleEditorSection}). */
function EdgeTypeControl() {
  const items = useStyleEditorSection({ layerId: 'graph', icons: EDGE_TYPE_ICONS });
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/** Manual theme toggle — pushes a light/dark patch via `useGraphCanvasUpdate`. */
function ThemeControl() {
  const update = useGraphCanvasUpdate();
  const [kind, setKind] = useState<'light' | 'dark'>(() => (osPrefersDark() ? 'dark' : 'light'));
  const toggle = (): void => {
    const next = kind === 'dark' ? 'light' : 'dark';
    setKind(next);
    update(next === 'dark' ? DARK_PATCH : LIGHT_PATCH);
    applyChromeTheme(next === 'dark');
  };
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'theme',
      icon: Sun,
      activeIcon: Moon,
      label: 'Switch to dark theme',
      activeLabel: 'Switch to light theme',
      active: kind === 'dark',
      onToggle: toggle,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

function Visualiser() {
  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);

  // Right-click menu item builders — one per target, each a single engine
  // method off the `canvas` handed in on `ctx`, resolved by id.
  const nodeItems = useCallback(({ id, canvas }: GraphNodeMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<graph.GraphLayer>('graph');
    if (!layer) return [];
    const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
    return [
      {
        id: 'focus',
        label: 'Focus on node',
        // Select the node, then focus the camera on it (centre + zoom in).
        onClick: () => {
          select?.select(id, 'shape');
          layer.focusNode(id, { zoom: FOCUS_ZOOM });
        },
      },
      { id: 'select', label: 'Select node', onClick: () => select?.select(id, 'shape') },
      {
        id: 'select-hood',
        label: 'Select neighbourhood',
        onClick: () => select?.selectNeighbourhood(id),
      },
      {
        id: 'highlight',
        label: 'Highlight neighbours',
        onClick: () => layer.highlightNeighbourhood(id),
      },
    ];
  }, []);

  const edgeItems = useCallback(({ id, canvas }: GraphEdgeMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<graph.GraphLayer>('graph');
    if (!layer) return [];
    const store = layer.store;
    const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
    return [
      {
        id: 'focus',
        label: 'Focus on edge',
        // Centre + select the edge (no forced zoom — a long edge would clip).
        onClick: () => {
          select?.select(id, 'connector');
          layer.focusEdges([id]);
        },
      },
      { id: 'select', label: 'Select edge', onClick: () => select?.select(id, 'connector') },
      {
        id: 'highlight',
        label: 'Highlight edge',
        onClick: () => {
          // One batch → one flush → one paint (§2.5).
          store.batch(() => {
            store.addEdgeState(id, 'highlighted');
            const ed = store.getEdge(id);
            if (ed) {
              store.addNodeState(ed.source, 'highlighted');
              store.addNodeState(ed.target, 'highlighted');
            }
          });
        },
      },
    ];
  }, []);

  const backgroundItems = useCallback(({ canvas }: GraphBackgroundMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<graph.GraphLayer>('graph');
    if (!layer) return [];
    const store = layer.store;
    const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
    return [
      { id: 'fit', label: 'Fit to content', onClick: () => canvas.camera.fitContent(layer.getBounds(), 80) },
      { id: 'select-all', label: 'Select all', shortcut: '⌘A', onClick: () => select?.selectAll() },
      { id: 'clear-sel', label: 'Clear selection', onClick: () => select?.clearSelection() },
      {
        id: 'clear-hl',
        label: 'Clear highlights',
        onClick: () => {
          store.clearNodeState('highlighted');
          store.clearEdgeState('highlighted');
        },
      },
    ];
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      {/* Minimal children register the engine instances by id; CANVAS_OPTIONS
          supplies all their settings. UI chrome stays as children. */}
      <Canvas autoResize config={CANVAS_OPTIONS}>
        {/* Engine layers */}
        <BackgroundLayer id="background" />
        <GraphLayer
          id="graph"
          data={lesMiserables}
          node={{
            style: {
              bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]!,
              labelText: (n: GraphNode) => String(n.id),
            },
          }}
        />
        <MiniMapLayer id="minimap" graphLayerId="graph" />

        {/* Engine behaviours — enabled state comes from CANVAS_OPTIONS. */}
        <DragPanBehaviour id="pan" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        <WheelZoomBehaviour id="wheel" />
        <PinchZoomBehaviour id="pinch" />
        <HoverActivateBehaviour id="hover" targetLayerId="graph" degree={1} state="highlighted" />
        <ClickSelectBehaviour id="click-select" targetLayerId="graph" multiple />
        <BrushSelectBehaviour id="brush-select" targetLayerId="graph" />
        <LassoSelectBehaviour id="lasso-select" targetLayerId="graph" />
        <LabelResolutionLODBehaviour id="label-lod" targetLayerId="graph" />

        {/* OS dark-mode follow (theme-agnostic engine; external patch). */}
        <SystemTheme />

        {/* History + clipboard providers + the combined toolbar + context menus. */}
        <GraphHistoryProvider layerId="graph">
          <GraphClipboardProvider layerId="graph">
            <Panel position="top-center" orientation="horizontal" gap={12}>
              <HistoryToolbar bare icons={{ undo: Undo2, redo: Redo2, redraw: RefreshCw }} />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              <GraphLayoutToolbar
                bare
                layouts={LAYOUTS}
                layoutLabels={LAYOUT_LABEL}
                initialLayout="d3-force"
                selectModeBehaviourIds={SELECT_MODE_IDS}
                selectModeLabels={SELECT_LABEL}
                selectModeIcons={SELECT_ICONS}
                initialSelectMode="click"
              />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              {/* Edge routing picker — self-wires to the 'graph' layer. */}
              <EdgeTypeControl />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              <EditToolbar
                bare
                icons={{
                  cut: Scissors,
                  copy: Copy,
                  paste: ClipboardPaste,
                  clear: Eraser,
                }}
              />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              {/* ViewToolbar defaults to vertical — force horizontal for the row. */}
              <ViewToolbar
                bare
                orientation="horizontal"
                icons={{
                  zoomIn: ZoomIn,
                  zoomOut: ZoomOut,
                  fit: Maximize,
                  locked: Lock,
                  unlocked: LockOpen,
                }}
              />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              <GridToolbar bare icons={{ grid: Grid3x3 }} />
              <Separator orientation="vertical" style={{ alignSelf: 'center', height: 16 }} />
              {/* Manual light/dark toggle — flips the canvas + chrome together. */}
              <ThemeControl />
            </Panel>
            {/* Right-click menus — one component per target. */}
            <GraphNodeContextMenu items={nodeItems} />
            <GraphEdgeContextMenu items={edgeItems} />
            <GraphBackgroundContextMenu items={backgroundItems} />
          </GraphClipboardProvider>
        </GraphHistoryProvider>
      </Canvas>
    </div>
  );
}

export const GraphVisualiser: Story = {
  render: () => <Visualiser />,
};
