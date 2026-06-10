/**
 * Graph **visualiser, dressed in the app shell** — the same read-only explorer
 * as `GraphVisualiser`, but ported into `@invana/themes`' `AppLayoutBase` (the
 * "appbase" layout built on `@invana/ui`'s `NavHorizontal`). Instead of floating
 * the controls over the canvas in a `<Panel>`, the chrome lives in the shell's
 * real header / footer bars:
 *
 *   - **Header** — the canvas toolbar. A brand on the left, the combined control
 *     row (history · layout/select · edge routing · edit · view · grid) in the
 *     centre, and the light/dark `ThemeToggle` on the right.
 *   - **Main** — the `<Canvas>` itself, filling the shell's content area.
 *   - **Footer** — a live **status bar**: zoom level, camera pan offset, the
 *     pointer's world position, and the currently hovered node / edge.
 *
 * Clicking a node / edge opens a read-only **property viewer**
 * (`PropertyViewerPanel`, top-right) showing its label / type / data. It's
 * driven by a dedicated `ClickViewBehaviour` — its own target, orthogonal to the
 * `ClickSelectBehaviour` that owns the visual highlight.
 *
 * ### Why the context is lifted
 *
 * `AppLayoutBase` lays out `header` / `main` / `footer` as siblings, but the
 * `<Canvas>` (which owns the engine + its `CanvasContext`) lives inside `main`.
 * Toolbars in the header and the status bar in the footer therefore sit *outside*
 * the `<Canvas>` subtree and can't read its context. So we lift a
 * `CanvasContext.Provider` **above** the whole shell and feed it the engine once
 * it's live — every header / footer control then resolves the same instance.
 *
 * The engine is surfaced by `CanvasBridge`, rendered as the **last** `<Canvas>`
 * child: its mount effect runs *after* every layer / behaviour above it has
 * registered, so by the time the header (with its `GraphHistoryProvider` /
 * `GraphClipboardProvider`) and footer mount, the `'graph'` layer and all
 * behaviours already exist — no effect-ordering races.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  CanvasContext,
  CanvasMessageBar,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  ClickViewBehaviour,
  ColorByLabelBehaviour,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphClipboardProvider,
  GraphHistoryProvider,
  GraphLayer,
  HoverActivateBehaviour,
  LabelResolutionLODBehaviour,
  LassoSelectBehaviour,
  MiniMapLayer,
  PinchZoomBehaviour,
  PropertyViewerPanel,
  GraphStatusBar,
  ToolbarItems,
  WheelZoomBehaviour,
  useCanvas,
  useGraphCanvas,
  useGraphCanvasUpdate,
  useHistorySection,
  useEditorSection,
  useViewSection,
  useLayout,
  useStyleEditorSection,
  useSelectMode,
  useGrid,
  useSystemTheme,
  type CanvasConfig,
  type ToolbarItem,
  type LayoutFactory,
  type ViewContext,
  type GraphNodeMenuContext,
  type GraphEdgeMenuContext,
  type GraphBackgroundMenuContext,
} from '@invana/canvas-react';
import { AppLayoutBase } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import type { GraphCanvas, GraphData, GraphNode } from '@invana/graph';
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
  Magnet,
  Maximize,
  Minus,
  Moon,
  MousePointer2,
  Play,
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

const meta: Meta = { title: 'canvas-react/usecases/GraphVisualiserApp' };
export default meta;
type Story = StoryObj;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;
type LesMisData = { group: number };
const groupOf = (n: GraphNode): number => (n.data as LesMisData | undefined)?.group ?? 0;

// Les Misérables ships no `type` — in a graph DB every node/edge carries a label
// (its "type"), distinct from the drawn `labelText`. Stamp graph-DB-style labels
// on so the property viewer's Type row has something to show: characters are
// `Character`, co-occurrence edges are `APPEARS_WITH`.
const SEED: GraphData = {
  nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
  edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
};

// Layout factories — each call produces a fresh instance. Module-level so the
// reference is stable across renders (keeps `useLayout`'s `applyLayout` stable).
const LAYOUTS: Record<string, LayoutFactory> = {
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
const LAYOUT_LABEL: Record<string, string> = {
  'd3-force': 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

// Select-mode key → registered behaviour id. `useSelectMode` enables exactly one
// entry and disables the rest. Click maps to an empty id (no drag-select armed).
const SELECT_MODE_IDS = { click: '', brush: 'brush-select', lasso: 'lasso-select' };
const SELECT_LABEL: Record<string, string> = {
  click: 'Click select',
  brush: 'Brush select',
  lasso: 'Lasso select',
};
const SELECT_ICONS = {
  click: MousePointer2,
  brush: SquareDashedMousePointer,
  lasso: Lasso,
};
// Gesture copy per select mode — pushed to the message channel on a mode switch.
// App-owned text (not a library default); the channel just displays it.
const SELECT_HINT: Record<string, string> = {
  click: 'Click a node or edge to select',
  brush: 'Hold Shift + drag to select nodes & edges',
  lasso: 'Hold Shift + drag a lasso around nodes & edges',
};

// Icon per edge routing type, shown on the <EdgeTypePicker> trigger + options.
const EDGE_TYPE_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable,
};

// Serialisable settings by id (same shape as the imperative `canvasOptions`).
// Non-serialisable / behaviour-owned bits ride on the children: `labelText`
// resolver + `data` on <GraphLayer>, `bgFill` on <ColorByLabelBehaviour>, the
// `graphLayerId` + the reactive hover `degree`, the click-view `panel`.
// Theme-driven colours are NOT here — only in APP_LIGHT/APP_DARK (pushed by
// <SystemTheme>), since <Canvas> applies this config *after* the SystemTheme
// child effect and would otherwise clobber the resolved theme on mount.
const APP_OPTIONS: CanvasConfig = {
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

const APP_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#e2e8f0' },
    graph: {
      node: { style: { labelColor: 0x334155, bgStrokeColor: 0xffffff } },
      edge: { style: { strokeColor: 0x475569, arrowTargetColor: 0x475569 } },
    },
    minimap: { backgroundColor: 0xf8fafc, borderColor: 0x94a3b8 },
  },
};
const APP_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#1e293b' },
    graph: {
      node: { style: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a } },
      edge: { style: { strokeColor: 0x64748b, arrowTargetColor: 0x64748b } },
    },
    minimap: { backgroundColor: 0x0f172a, borderColor: 0x334155 },
  },
};

/** Follows the OS scheme by pushing the matching colour patch through update(). */
function SystemTheme() {
  useSystemTheme(APP_LIGHT, APP_DARK);
  return null;
}

/**
 * Flip the `@invana/ui` chrome (the whole `AppLayoutBase` shell — its
 * `bg-background` / `border-border` / `text-foreground` tokens, plus the toolbar
 * buttons and menus) to match the canvas theme, so the app stays coherent
 * instead of the shell following the OS independently. Mirrors the storybook's
 * own `bootstrapOsTheme` (`.storybook/preview.ts`), which switches the
 * design-kit by `data-theme`.
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

/**
 * Surfaces the live canvas from inside `<Canvas>` (where {@link useGraphCanvas}
 * is guaranteed non-null) up to the shell, so the lifted `CanvasContext` can feed
 * header / footer chrome. Rendered as the **last** `<Canvas>` child: its mount
 * effect runs after every layer / behaviour above it has registered, so the
 * lifted engine is only published once the graph is fully wired.
 */
function CanvasBridge({ onReady }: { onReady: (canvas: GraphCanvas | null) => void }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}

/**
 * The canvas toolbar that fills the shell header. The `bare` toolbars render
 * their `Nav*` only (no `<Panel>`); a flex row stacks them with separators so
 * they read as one bar of distinct pill-groups. Wrapped in the history +
 * clipboard providers (over the `'graph'` store) that `<HistoryToolbar>` /
 * `<EditToolbar>` consume — it only mounts once the engine (and thus the layer)
 * is live, so the providers find the store immediately.
 *
 * The `magnet` toggle drives the `<HoverActivateBehaviour>`'s neighbour radius:
 * on → hovering a node lights up its 1st-degree neighbours; off → only the
 * hovered node lights up.
 */
function HeaderToolbar({
  magnet,
  onToggleMagnet,
}: {
  magnet: boolean;
  onToggleMagnet: () => void;
}) {
  // The builder hooks read the history / clipboard providers, so item assembly
  // lives in a child mounted *inside* them.
  return (
    <GraphHistoryProvider layerId="graph">
      <GraphClipboardProvider layerId="graph">
        <HeaderToolbarItems magnet={magnet} onToggleMagnet={onToggleMagnet} />
      </GraphClipboardProvider>
    </GraphHistoryProvider>
  );
}

/**
 * The whole header bar as one data-driven `<ToolbarItems>`. The five named
 * sections come from section hooks ({@link useHistorySection},
 * {@link useLayoutsSection}, {@link useEditorSection}, {@link useViewSection},
 * {@link useStyleEditorSection}); select-mode, grid, and magnet are hand-built
 * `ToolbarItem`s off the raw hooks — concatenated with `divider`s. The Magnet
 * toggle flips the hover behaviour between "neighbours" (degree 1) and "node
 * only" (degree 0).
 */
function HeaderToolbarItems({
  magnet,
  onToggleMagnet,
}: {
  magnet: boolean;
  onToggleMagnet: () => void;
}) {
  // Live engine — the header only renders once it's live, so this is non-null.
  const canvas = useCanvas();

  // Five named sections.
  const history = useHistorySection({ icons: { undo: Undo2, redo: Redo2 } });
  const { layout, layoutOptions, applyLayout, isRunning } = useLayout(LAYOUTS, { labels: LAYOUT_LABEL, initial: 'd3-force' });
  // Surface layout progress on the canvas message channel: a sticky "Running…"
  // while it runs, then a "ready" that auto-clears after 3s. Wired off the
  // layout's running state — copy lives here, not in the library.
  const wasRunning = useRef(false);
  useEffect(() => {
    const label = LAYOUT_LABEL[layout] ?? layout;
    if (isRunning && !wasRunning.current) canvas.showMessage(`Running ${label} layout…`);
    else if (!isRunning && wasRunning.current) canvas.showMessage(`${label} layout ready`, 3000);
    wasRunning.current = isRunning;
  }, [isRunning, layout, canvas]);
  const editor = useEditorSection({ icons: { cut: Scissors, copy: Copy, paste: ClipboardPaste, erase: Eraser } });
  const view = useViewSection({ icons: { zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize, locked: Lock, unlocked: LockOpen } });
  const style = useStyleEditorSection({ layerId: 'graph', icons: EDGE_TYPE_ICONS });

  // Extras hand-built off the raw hooks (not one of the five sections).
  const { mode, modeOptions, setMode } = useSelectMode(SELECT_MODE_IDS, { labels: SELECT_LABEL, initial: 'click' });
  // Announce the gesture for the newly-armed select mode + the magnet toggle on
  // the message channel (skip the initial mount). Same pattern any interaction
  // would use — the behaviour/handler just calls canvas.showMessage.
  const firstMode = useRef(true);
  useEffect(() => {
    if (firstMode.current) { firstMode.current = false; return; }
    canvas.showMessage(SELECT_HINT[mode] ?? '', 4000);
  }, [mode, canvas]);
  const firstMagnet = useRef(true);
  useEffect(() => {
    if (firstMagnet.current) { firstMagnet.current = false; return; }
    canvas.showMessage(magnet ? 'Hover highlights neighbours' : 'Hover highlights the node only', 2500);
  }, [magnet, canvas]);
  const { showGrid, toggleGrid } = useGrid();

  const div = (key: string): ToolbarItem => ({ type: 'divider', key });
  const items: ToolbarItem[] = [
    ...history, div('d1'),
    { type: 'select', key: 'layout', label: 'Layout', value: layout, options: layoutOptions, onChange: applyLayout },
    { type: 'button', key: 'run-layout', icon: Play, label: 'Run layout', onClick: () => applyLayout(layout), disabled: isRunning },
    { type: 'button', key: 'refresh', icon: RefreshCw, label: 'Re-render (re-run layout + repaint)', onClick: () => void canvas.refresh() },
    div('d2'),
    { type: 'select', key: 'select-mode', label: 'Select', value: mode, options: modeOptions, icons: SELECT_ICONS, onChange: setMode }, div('d3'),
    ...style, div('d4'),
    ...editor, div('d5'),
    ...view, div('d6'),
    { type: 'toggle', key: 'grid', icon: Grid3x3, label: 'Toggle grid', active: showGrid, onToggle: toggleGrid }, div('d7'),
    {
      type: 'toggle',
      key: 'magnet',
      icon: Magnet,
      label: 'Highlight neighbours: off',
      activeLabel: 'Highlight neighbours: on',
      active: magnet,
      onToggle: onToggleMagnet,
    },
  ];

  return <ToolbarItems items={items} orientation="horizontal" />;
}

/** Header-right theme toggle — pushes a light/dark patch via `useGraphCanvasUpdate`. */
function HeaderThemeToggle() {
  const update = useGraphCanvasUpdate();
  const [kind, setKind] = useState<'light' | 'dark'>(() => (osPrefersDark() ? 'dark' : 'light'));
  const toggle = (): void => {
    const next = kind === 'dark' ? 'light' : 'dark';
    setKind(next);
    update(next === 'dark' ? APP_DARK : APP_LIGHT);
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

function VisualiserApp() {
  // The live canvas, lifted out of <Canvas> by <CanvasBridge>. Null until the
  // graph is fully wired; gates the header/footer chrome that depends on it.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const handleReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);

  // Magnet toggle → hover neighbour radius. On (default): hovering a node lights
  // up its 1st-degree neighbours (degree 1). Off: only the hovered node lights
  // up (degree 0). Reactive on <HoverActivateBehaviour> — no remount.
  const [magnet, setMagnet] = useState(true);
  const toggleMagnet = useCallback(() => setMagnet((m) => !m), []);

  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);

  // Right-click menu builders — navigation + selection + annotation, each a
  // single engine method off the `canvas` handed in on `ctx`. The visualiser is
  // read-only, so no structural edits here (clipboard cut/copy/paste lives in
  // <EditToolbar>).
  const nodeItems = useCallback(({ id, canvas }: GraphNodeMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<graph.GraphLayer>('graph');
    if (!layer) return [];
    const select = canvas.behaviours.get<graph.ClickSelectBehaviour>('click-select');
    return [
      { id: 'zoom', label: 'Zoom to node', onClick: () => layer.focusNodes([id]) },
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
      { id: 'zoom', label: 'Zoom to edge', onClick: () => layer.focusEdges([id]) },
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
      {
        id: 'fit',
        label: 'Fit to content',
        onClick: () => canvas.camera.fitContent(layer.getBounds(), 80),
      },
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
    // Lifted context: the engine reaches the header toolbar + footer status/
    // message bars, which live in AppLayoutBase's header/footer (siblings of
    // <Canvas>, outside its own provider). The message channel rides the engine
    // itself (Canvas.showMessage), so no extra provider is needed.
    <CanvasContext.Provider value={canvas}>
      <AppLayoutBase
        header={{
          left: <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Graph Visualiser</span>,
          center: canvas ? <HeaderToolbar magnet={magnet} onToggleMagnet={toggleMagnet} /> : null,
          right: canvas ? <HeaderThemeToggle /> : null,
        }}
        mainClassName="relative"
        // Minimal children register the classes by id; APP_OPTIONS holds all
        // settings. Node `bgFill` is owned by <ColorByLabelBehaviour>; the
        // theme-driven colours follow the OS scheme via <SystemTheme>.
        main={
          <Canvas autoResize config={APP_OPTIONS}>
            <BackgroundLayer id="background" />
            <GraphLayer
              id="graph"
              data={SEED}
              node={{ style: { labelText: (n: GraphNode) => String(n.id) } }}
            />

            {/* Colour-by-category: a unique colour per distinct label drives node
                `bgFill`. Applied via template resolvers (non-serialisable → stays
                a child); here we colour nodes by their les-mis community. */}
            <ColorByLabelBehaviour
              targetLayerId="graph"
              palette={PALETTE}
              nodeLabel={(n) => `community-${groupOf(n)}`}
            />

            {/* OS dark-mode follow — external colour patches through update(). */}
            <SystemTheme />

            {/* Camera + interaction. Pan + node-drag are what <ViewToolbar>'s
                lock disables. Enabled state comes from APP_OPTIONS. */}
            <DragPanBehaviour id="pan" />
            <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
            <WheelZoomBehaviour id="wheel" />
            <PinchZoomBehaviour id="pinch" />
            {/* Hover highlighting. `degree` is driven by the header's magnet
                toggle: 1 = hovered node + 1st-degree neighbours, 0 = hovered
                node only. Reactive — flips live without remounting. */}
            <HoverActivateBehaviour
              id="hover"
              targetLayerId="graph"
              degree={magnet ? 1 : 0}
              state="highlighted"
            />

            {/* Selection — Shift+click selects; the header's mode picker arms
                exactly one of brush / lasso (both Shift+drag). */}
            <ClickSelectBehaviour id="click-select" targetLayerId="graph" multiple />
            <BrushSelectBehaviour id="brush-select" targetLayerId="graph" />
            <LassoSelectBehaviour id="lasso-select" targetLayerId="graph" />

            {/* Dedicated click-to-view behaviour for the property viewer — its own
                target, orthogonal to ClickSelect. The `panel` render-prop renders
                the read-only <PropertyViewerPanel>. */}
            <ClickViewBehaviour
              id="click-view"
              targetLayerId="graph"
              panel={(ctx: ViewContext) => (
                <PropertyViewerPanel ctx={ctx} position="top-right" fullHeight />
              )}
            />

            <LabelResolutionLODBehaviour id="label-lod" targetLayerId="graph" />
            {/* Bottom-left — clear of the full-height property viewer that docks
                on the right when an element is clicked. Colours are theme-driven
                (APP_LIGHT/APP_DARK via <SystemTheme>). */}
            <MiniMapLayer id="minimap" graphLayerId="graph" />

            {/* Right-click menus — each owns its own behaviour + overlay. */}
            <GraphNodeContextMenu items={nodeItems} />
            <GraphEdgeContextMenu items={edgeItems} />
            <GraphBackgroundContextMenu items={backgroundItems} />

            {/* Last child: publishes the live engine to the lifted context only
                after everything above has registered. */}
            <CanvasBridge onReady={handleReady} />
          </Canvas>
        }
        footer={{
          left: canvas ? <GraphStatusBar /> : null,
          // The shared message bar — shows whatever was last pushed via
          // Canvas.showMessage (e.g. the layout "Running… / ready"); empty when idle.
          right: canvas ? <CanvasMessageBar /> : null,
        }}
      />
    </CanvasContext.Provider>
  );
}

export const GraphVisualiserApp: Story = {
  render: () => <VisualiserApp />,
};
