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
 * ### Why the context is lifted
 *
 * `AppLayoutBase` lays out `header` / `main` / `footer` as siblings, but the
 * `<Canvas>` (which owns the engine + its `CanvasContext`) lives inside `main`.
 * Toolbars in the header and the status bar in the footer therefore sit *outside*
 * the `<Canvas>` subtree and can't read its context. So we lift a
 * `CanvasContext.Provider` **above** the whole shell and feed it the engine once
 * it's live — every header / footer control then resolves the same instance.
 *
 * The engine is surfaced by `EngineBridge`, rendered as the **last** `<Canvas>`
 * child: its mount effect runs *after* every layer / behaviour above it has
 * registered, so by the time the header (with its `GraphHistoryProvider` /
 * `GraphClipboardProvider`) and footer mount, the `'graph'` layer and all
 * behaviours already exist — no effect-ordering races.
 */

import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  CanvasContext,
  BackgroundLayer,
  BrushSelectBehaviour,
  ClickSelectBehaviour,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
  DragNodeBehaviour,
  DragPanBehaviour,
  EdgeTypePicker,
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
  PinchZoomBehaviour,
  ResponsiveThemeBehaviour,
  ThemeToggle,
  ViewToolbar,
  WheelZoomBehaviour,
  useCanvas,
  useCanvasEvent,
  useZoom,
  type LayoutFactory,
  type GraphNodeMenuContext,
  type GraphEdgeMenuContext,
  type GraphBackgroundMenuContext,
} from '@invana/canvas-react';
import { AppLayoutBase } from '@invana/themes';
import { Separator, type MenuItem } from '@invana/ui';
import type { Canvas as EngineCanvas } from '@invana/canvas';
import type {
  GraphNode,
  ClickSelectBehaviour as EngineClickSelectBehaviour,
  GraphLayer as EngineGraphLayer,
} from '@invana/graph';
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
  Trash2,
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

// Icon per edge routing type, shown on the <EdgeTypePicker> trigger + options.
const EDGE_TYPE_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable,
};

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
 * Surfaces the live engine from inside `<Canvas>` (where {@link useCanvas} is
 * guaranteed non-null) up to the shell, so the lifted `CanvasContext` can feed
 * header / footer chrome. Rendered as the **last** `<Canvas>` child: its mount
 * effect runs after every layer / behaviour above it has registered, so the
 * lifted engine is only published once the graph is fully wired.
 */
function EngineBridge({ onReady }: { onReady: (canvas: EngineCanvas | null) => void }) {
  const canvas = useCanvas();
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
 */
function HeaderToolbar() {
  return (
    <GraphHistoryProvider layerId="graph">
      <GraphClipboardProvider layerId="graph">
        <div style={toolbarRowStyle}>
          <HistoryToolbar bare icons={{ undo: Undo2, redo: Redo2, redraw: RefreshCw }} />
          <Separator orientation="vertical" style={dividerStyle} />
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
          <Separator orientation="vertical" style={dividerStyle} />
          <EdgeTypePicker layerId="graph" icons={EDGE_TYPE_ICONS} />
          <Separator orientation="vertical" style={dividerStyle} />
          <EditToolbar
            bare
            icons={{
              cut: Scissors,
              copy: Copy,
              paste: ClipboardPaste,
              delete: Trash2,
              clear: Eraser,
            }}
          />
          <Separator orientation="vertical" style={dividerStyle} />
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
          <Separator orientation="vertical" style={dividerStyle} />
          <GridToolbar bare icons={{ grid: Grid3x3 }} />
        </div>
      </GraphClipboardProvider>
    </GraphHistoryProvider>
  );
}

/** Hovered element descriptor for the status bar. */
type HoverInfo = { kind: 'node' | 'edge'; id: string };

/**
 * The shell footer's live status bar — read-only telemetry off the engine:
 * camera zoom (`useZoom`), pan offset (`camera:pan`), the pointer's world
 * position (a `pointermove` listener on the pixi canvas element projected via
 * `camera.toWorld`), and the hovered node / edge (the graph renderer's
 * `shape:` / `connector:pointerover|out` events). Reads the lifted
 * `CanvasContext`, so it works from the footer (outside `<Canvas>`).
 */
function StatusBar() {
  const canvas = useCanvas();
  const { zoom } = useZoom();
  const [pan, setPan] = useState({ x: canvas.camera.x, y: canvas.camera.y });
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);
  const [hover, setHover] = useState<HoverInfo | null>(null);

  // Camera translation — re-synced live as the user pans.
  useCanvasEvent('camera:pan', ({ x, y }) => setPan({ x, y }));

  // Pointer world position — the canvas-wide bus drops high-frequency
  // pointermove, so listen on the pixi canvas element and project to world.
  useEffect(() => {
    const el = canvas.application?.canvas;
    if (!el) return;
    const onMove = (e: PointerEvent): void => setPointer(canvas.camera.toWorld(e.offsetX, e.offsetY));
    const onLeave = (): void => setPointer(null);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [canvas]);

  // Hovered node / edge — raw pointer-hit events off the graph layer's renderer.
  useEffect(() => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    const renderer = layer?.getRenderer();
    if (!renderer) return;
    const onShapeOver = (e: { id: string }): void => setHover({ kind: 'node', id: e.id });
    const onConnOver = (e: { id: string }): void => setHover({ kind: 'edge', id: e.id });
    const onOut = (): void => setHover(null);
    renderer.events.on('shape:pointerover', onShapeOver);
    renderer.events.on('shape:pointerout', onOut);
    renderer.events.on('connector:pointerover', onConnOver);
    renderer.events.on('connector:pointerout', onOut);
    return () => {
      renderer.events.off('shape:pointerover', onShapeOver);
      renderer.events.off('shape:pointerout', onOut);
      renderer.events.off('connector:pointerover', onConnOver);
      renderer.events.off('connector:pointerout', onOut);
    };
  }, [canvas]);

  const coord = (p: { x: number; y: number } | null): string =>
    p ? `${p.x.toFixed(0)}, ${p.y.toFixed(0)}` : '—';

  return (
    <div style={statusRowStyle}>
      <span>Zoom: {Math.round(zoom * 100)}%</span>
      <span style={statusSepStyle}>·</span>
      <span>Pan: {coord(pan)}</span>
      <span style={statusSepStyle}>·</span>
      <span>Pointer: {coord(pointer)}</span>
      <span style={statusSepStyle}>·</span>
      <span>Hover: {hover ? `${hover.kind} ${hover.id}` : '—'}</span>
    </div>
  );
}

function VisualiserApp() {
  // The live engine, lifted out of <Canvas> by <EngineBridge>. Null until the
  // graph is fully wired; gates the header/footer chrome that depends on it.
  const [engine, setEngine] = useState<EngineCanvas | null>(null);
  const handleReady = useCallback((c: EngineCanvas | null) => setEngine(c), []);

  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);

  // Right-click menu builders — navigation + selection + annotation, each a
  // single engine method off the `canvas` handed in on `ctx`. The visualiser is
  // read-only, so no structural edits here (clipboard cut/copy/paste lives in
  // <EditToolbar>).
  const nodeItems = useCallback(({ id, canvas }: GraphNodeMenuContext): MenuItem[] => {
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return [];
    const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
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
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return [];
    const store = layer.store;
    const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
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
    const layer = canvas.layers.get<EngineGraphLayer>('graph');
    if (!layer) return [];
    const store = layer.store;
    const select = canvas.behaviours.get<EngineClickSelectBehaviour>('click-select');
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
    // Lifted context: the engine reaches the header toolbar + footer status bar,
    // which live in AppLayoutBase's header/footer (siblings of <Canvas>, so
    // outside its own provider).
    <CanvasContext.Provider value={engine}>
      <AppLayoutBase
        header={{
          left: <span style={brandStyle}>Graph Visualiser</span>,
          center: engine ? <HeaderToolbar /> : null,
          right: engine ? (
            <ThemeToggle
              lightIcon={Sun}
              darkIcon={Moon}
              backgroundLayerId="background"
              onChange={(kind) => applyChromeTheme(kind === 'dark')}
            />
          ) : null,
        }}
        mainClassName="relative"
        main={
          <Canvas autoResize>
            {/* A grid pattern so <GridToolbar> has something to toggle. The
                `{ light, dark }` pairs follow the OS `prefers-color-scheme`. */}
            <BackgroundLayer
              type="pattern"
              patternType="grid"
              backgroundColor={{ light: '#f8fafc', dark: '#0f172a' }}
              color={{ light: '#94a3b8', dark: '#334155' }}
            />
            <GraphLayer
              id="graph"
              data={lesMiserables}
              node={{
                style: {
                  shape: { kind: 'circle', radius: 8 },
                  bgFill: (n: GraphNode) => PALETTE[groupOf(n) % PALETTE.length]!,
                  bgStrokeWidth: 1.5,
                  labelText: (n: GraphNode) => String(n.id),
                  labelFontSize: 11,
                  labelPlacement: 'bottom',
                  labelOffsetY: 4,
                },
              }}
              edge={{ style: { strokeWidth: 1, arrowTargetShape: 'none' } }}
            />
            <ResponsiveThemeBehaviour
              layerId="graph"
              node={{
                light: { labelColor: 0x334155, bgStrokeColor: 0xffffff },
                dark: { labelColor: 0xe2e8f0, bgStrokeColor: 0x0f172a },
              }}
              edge={{
                light: { strokeColor: 0xcbd5e1, arrowTargetColor: 0xcbd5e1 },
                dark: { strokeColor: 0x475569, arrowTargetColor: 0x475569 },
              }}
            />

            {/* Camera + interaction. Pan + node-drag are what <ViewToolbar>'s
                lock disables. */}
            <DragPanBehaviour />
            <DragNodeBehaviour layerId="graph" />
            <WheelZoomBehaviour />
            <PinchZoomBehaviour />
            <HoverActivateBehaviour layerId="graph" degree={1} state="highlighted" />

            {/* Selection — Shift+click selects; <GraphLayoutToolbar>'s mode picker
                arms exactly one of brush / lasso (both Shift+drag). */}
            <ClickSelectBehaviour layerId="graph" enabled multiple />
            <BrushSelectBehaviour layerId="graph" enabled={false} />
            <LassoSelectBehaviour layerId="graph" enabled={false} />

            <LabelResolutionLODBehaviour layerId="graph" />
            <MiniMapLayer graphLayerId="graph" position="bottom-right" margin={{ x: 20 }} />

            {/* Right-click menus — each owns its own behaviour + overlay. */}
            <GraphNodeContextMenu items={nodeItems} />
            <GraphEdgeContextMenu items={edgeItems} />
            <GraphBackgroundContextMenu items={backgroundItems} />

            {/* Last child: publishes the live engine to the lifted context only
                after everything above has registered. */}
            <EngineBridge onReady={handleReady} />
          </Canvas>
        }
        footer={{ left: engine ? <StatusBar /> : null }}
      />
    </CanvasContext.Provider>
  );
}

const toolbarRowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const dividerStyle: CSSProperties = { alignSelf: 'center', height: 16 };
const brandStyle: CSSProperties = { fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' };
const statusRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  fontSize: 12,
  fontVariantNumeric: 'tabular-nums',
  opacity: 0.8,
  whiteSpace: 'nowrap',
};
const statusSepStyle: CSSProperties = { opacity: 0.4 };

export const GraphVisualiserApp: Story = {
  render: () => <VisualiserApp />,
};
