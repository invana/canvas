/**
 * Graph **modeller, dressed in the app shell** — the same drawing tool as
 * `GraphModeller`, but ported into `@invana/themes`' `AppLayoutBase` (the
 * "appbase" layout built on `@invana/ui`'s `NavHorizontal`), the modeller
 * counterpart of `GraphVisualiserApp`. Instead of floating the drawing toolbar
 * and the per-tool hint over the canvas in `<Panel>`s, the chrome lives in the
 * shell's real header / footer bars:
 *
 *   - **Header** — the `ModellerToolbar` (`bare`): a brand on the left, the tool
 *     row (Select · Add · Connect · Delete + the Add-tool shape picker · undo/redo
 *     · erase) in the centre, and the light/dark theme toggle on the right.
 *   - **Main** — the `<Canvas>`, filling the shell's content area, carrying the
 *     tool-gated drawing behaviours.
 *   - **Footer** — a live **status bar** (zoom · pan · pointer world-pos) on the
 *     left, and the **per-tool hint** ("Drag a node to move it…") on the right via
 *     the canvas message channel (replacing the standalone modeller's bottom-centre
 *     hint panel).
 *
 * Clicking a single node / edge (Select tool) opens an `InspectorPanel` (top-right)
 * to edit its `type` (mirrored to the drawn label via `typeAsLabel`) + key/value
 * properties; edges add a Reverse-direction button. Apply commits an undoable
 * update. It's driven by a dedicated `ClickInspectBehaviour`, orthogonal to the
 * `ClickSelectBehaviour` used for drag-selection.
 *
 * ### Why the providers + context are lifted
 *
 * `AppLayoutBase` lays out `header` / `main` / `footer` as siblings, but the
 * `<Canvas>` (engine + its `CanvasContext`) lives inside `main`. The header
 * toolbar and footer therefore sit *outside* the `<Canvas>` subtree. The header's
 * `ModellerToolbar` and the in-canvas drawing behaviours must share the **same**
 * `GraphToolProvider` (active tool + node shape) and `GraphHistoryProvider`
 * (undoable edits) — so both providers, plus a `CanvasContext.Provider` fed the
 * engine once it's live, are lifted **above** the whole shell.
 *
 * `GraphHistoryProvider` resolves its store from the (initially-null) lifted
 * context and rebuilds the history once the engine appears; `useDrawHistory`
 * reads history through a ref, so the drawing behaviours — which mount before the
 * engine is published — still journal correctly. The engine is surfaced by
 * `CanvasBridge`, rendered as the **last** `<Canvas>` child, so it publishes only
 * after every layer / behaviour above it has registered.
 */

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  MousePointer2,
  Plus,
  Spline,
  Eraser,
  Undo2,
  Redo2,
  Trash2,
  Circle,
  Square,
  Diamond,
  Sun,
  Moon,
} from 'lucide-react';
import {
  Canvas,
  CanvasContext,
  CanvasMessageBar,
  BackgroundLayer,
  GraphLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  ClickSelectBehaviour,
  ClickInspectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  ParallelEdgeBehaviour,
  GraphNodeContextMenu,
  GraphEdgeContextMenu,
  GraphBackgroundContextMenu,
  GraphHistoryProvider,
  GraphToolProvider,
  HistoryContext,
  ModellerToolbar,
  InspectorPanel,
  GraphStatusBar,
  ToolbarItems,
  useGraphCanvas,
  useGraphCanvasUpdate,
  useSystemTheme,
  useTool,
  useDrawHistory,
  useFitContent,
  useClearGraph,
} from '@invana/canvas-react';
import type {
  CanvasConfig,
  GraphNodeMenuContext,
  GraphEdgeMenuContext,
  GraphBackgroundMenuContext,
  ToolbarItem,
} from '@invana/canvas-react';
import { AppLayoutBase } from '@invana/themes';
import type { MenuItem } from '@invana/ui';
import type {
  GraphCanvas,
  GraphData,
  GraphEdge,
  GraphHistory,
  NodeShapeOptions,
} from '@invana/graph';
import type * as graph from '@invana/graph';

const meta: Meta = { title: 'canvas-react/usecases/GraphModellerApp' };
export default meta;
type Story = StoryObj;

const SEED: GraphData = {
  nodes: [
    { id: 'a', position: { x: -120, y: -60 }, style: { labelText: 'A' } },
    { id: 'b', position: { x: 120, y: -60 }, style: { labelText: 'B' } },
    { id: 'c', position: { x: 0, y: 90 }, style: { labelText: 'C' } },
  ],
  edges: [{ id: 'a-b', source: 'a', target: 'b' }],
};

/** Node shapes the Add tool can drop, keyed by the picker's option key. */
const SHAPES: Record<string, NodeShapeOptions> = {
  circle: { kind: 'circle', radius: 22 },
  rect: { kind: 'rect', width: 52, height: 36, cornerRadius: 6 },
  diamond: { kind: 'regular-polygon', sides: 4, radius: 26 },
};

// Human labels + icons per shape key — shared by the header's Add-tool shape
// picker and the background context menu's "Add node here" submenu.
const SHAPE_LABELS: Record<string, string> = { circle: 'Circle', rect: 'Rectangle', diamond: 'Diamond' };
const SHAPE_ICONS = { circle: Circle, rect: Square, diamond: Diamond } as const;

/**
 * Group by unordered node pair so edges drawn either way fan apart together.
 * Self-loops (source === target) are excluded — they use loop routing, not
 * the parallel-edge bow.
 */
const undirectedPair = (e: GraphEdge): string | null =>
  e.source === e.target ? null : [e.source, e.target].sort().join('::');

// Per-tool hint copy, pushed to the canvas message channel on a tool switch and
// shown (sticky) in the footer's <CanvasMessageBar>. App-owned text — the
// channel just displays it.
const HINTS: Record<string, string> = {
  select:
    'Drag a node to move it · click a node or edge to edit it · click empty canvas to clear',
  add: 'Click empty canvas to add a node · pick its shape in the toolbar · Esc to exit',
  connect: 'Drag node→node to connect · release on the same node for a self-loop · Esc to exit',
  delete: 'Click a node (removes its edges) or an edge to erase it · Esc to exit',
};

// Serialisable settings by id (same shape as the imperative `canvasOptions`).
// The always-on camera behaviours live here; the tool-gated drawing behaviours
// keep their reactive `enabled={tool === …}` on the children below (config
// can't express a value that tracks React state). Theme-driven colours
// (node/edge stroke, background) come from the patches + `useSystemTheme`.
const MODELLER_OPTIONS: CanvasConfig = {
  layers: {
    // Theme-driven background colours live only in M_LIGHT/M_DARK (pushed by
    // <SystemTheme>) — not here, or the base config would clobber the resolved
    // theme on mount (the <Canvas> applies config after the SystemTheme effect).
    background: { type: 'pattern', patternType: 'grid' },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 22 },
          bgFill: 0x3b82f6,
          bgStrokeWidth: 2,
          labelColor: 0xf8fafc,
          labelFontSize: 13,
          labelPlacement: 'center',
        },
      },
      edge: { style: { strokeWidth: 2 } },
    },
  },
  behaviours: { pan: { enabled: true }, wheel: { enabled: true } },
};

const M_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#94a3b8' },
    graph: { node: { style: { bgStrokeColor: 0xffffff } }, edge: { style: { strokeColor: 0xcbd5e1 } } },
  },
};
const M_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#334155' },
    graph: { node: { style: { bgStrokeColor: 0x0f172a } }, edge: { style: { strokeColor: 0x475569 } } },
  },
};

/** Follows the OS scheme by pushing the matching colour patch through update(). */
function SystemTheme() {
  useSystemTheme(M_LIGHT, M_DARK);
  return null;
}

/**
 * Flip the `@invana/ui` chrome (the whole `AppLayoutBase` shell — its
 * `bg-background` / `border-border` / `text-foreground` tokens, plus the toolbar
 * buttons and menus) to match the canvas theme, so the app stays coherent instead
 * of the shell following the OS independently. Mirrors the storybook's own
 * `bootstrapOsTheme` (`.storybook/preview.ts`), which switches the design-kit by
 * `data-theme`.
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
 * Lifts the `GraphHistory` built by the in-`<Canvas>` `<GraphHistoryProvider>`
 * up to the shell, so the header `ModellerToolbar`'s Undo / Redo — a sibling of
 * `<Canvas>`, outside that provider — drives the **same** history the in-canvas
 * drawing behaviours journal into. The `GraphHistoryProvider` stays inside
 * `<Canvas>` (so it resolves a live engine + store); this bridge is the history
 * counterpart of {@link CanvasBridge}.
 */
function HistoryBridge({ onReady }: { onReady: (history: GraphHistory | null) => void }) {
  const history = useContext(HistoryContext);
  useEffect(() => {
    onReady(history);
    return () => onReady(null);
  }, [history, onReady]);
  return null;
}

/**
 * The drawing toolbar that fills the shell header. `ModellerToolbar` in `bare`
 * mode renders its `Nav*` only (no `<Panel>`). It self-wires from the lifted
 * `GraphToolProvider` (active tool + node shape) and `GraphHistoryProvider`
 * (undo / redo / erase) — both ancestors of the whole shell — so it stays in
 * lockstep with the in-canvas drawing behaviours.
 */
function HeaderToolbar() {
  return (
    <ModellerToolbar
      bare
      icons={{
        select: MousePointer2,
        add: Plus,
        connect: Spline,
        delete: Eraser,
        undo: Undo2,
        redo: Redo2,
        clear: Trash2,
      }}
      nodeKinds={SHAPE_LABELS}
      nodeKindIcons={SHAPE_ICONS}
    />
  );
}

/** Header-right theme toggle — pushes a light/dark patch via `useGraphCanvasUpdate`. */
function HeaderThemeToggle() {
  const update = useGraphCanvasUpdate();
  const [kind, setKind] = useState<'light' | 'dark'>(() => (osPrefersDark() ? 'dark' : 'light'));
  const toggle = (): void => {
    const next = kind === 'dark' ? 'light' : 'dark';
    setKind(next);
    update(next === 'dark' ? M_DARK : M_LIGHT);
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

/**
 * The drawing behaviours + inspector + right-click context menus. Lives inside
 * `<Canvas>` (so the behaviours register on the engine) and inside the lifted
 * providers, so it can read the active tool (`useTool`) and journal gestures
 * (`useDrawHistory` / `useClearGraph`). Each behaviour's `enabled` is gated on
 * the active tool — only one is live at a time. The toolbar itself lives in the
 * header; the per-tool hint is pushed to the footer message channel from here.
 */
function DrawingTools() {
  const canvas = useGraphCanvas();
  const { tool, nodeKind, setTool } = useTool();
  const draw = useDrawHistory();
  const { fitContent } = useFitContent('graph');
  const { clear } = useClearGraph('graph');
  // Raw history instance (from the lifted `<GraphHistoryProvider>`) — context-menu
  // edits run as `history.transaction(...)` so the recorder applies + journals
  // them in one undoable step. `draw` above stays for the drawing *behaviours*.
  const history = useContext(HistoryContext);

  // Surface the active tool's guidance on the canvas message channel — sticky
  // (no timeout), so the footer always shows the current tool's hint. Replaces
  // the standalone modeller's always-on bottom-centre hint panel.
  useEffect(() => {
    canvas.showMessage(HINTS[tool] ?? '');
  }, [tool, canvas]);

  // The Add tool's createNode factory is captured once by the behaviour; read
  // the live shape + a running counter through refs so it stays current.
  const nodeKindRef = useRef(nodeKind);
  nodeKindRef.current = nodeKind;
  const seqRef = useRef(SEED.nodes.length);
  // Separate counter for context-menu-created nodes/edges (distinct `cm-` prefix
  // so ids never collide with the Add tool's `n-` ids).
  const cmSeqRef = useRef(0);

  // ─── Context-menu item builders ────────────────────────────────────────────
  // One per target, consumed by the `<Graph*ContextMenu>` rendered below. Each
  // action is a single engine call: structural edits (add / delete) run through
  // `history.transaction` — the recorder applies the mutation AND journals its
  // inverse (cascading incident edges), so the toolbar's Undo / Redo reverse them
  // with no manual snapshotting. Pin and reverse are direct store sugar
  // (`setPinned` / `reverseEdge`). The right-clicked `id` and the live `canvas`
  // arrive on each builder's `ctx`.

  // Add a fresh node at `pos`, as one undoable entry. `shapeKey` picks the drawn
  // shape (defaults to the layer's circle); `fromId` links it from an existing
  // node. `rec.addNode` / `rec.addEdge` apply + journal together.
  const addNodeAt = useCallback(
    (pos: { x: number; y: number }, opts?: { shapeKey?: string; fromId?: string }): void => {
      const { shapeKey, fromId } = opts ?? {};
      const n = (cmSeqRef.current += 1);
      const stamp = Date.now().toString(36);
      const newId = `cm-n-${n}-${stamp}`;
      const shape = shapeKey ? SHAPES[shapeKey] : undefined;
      history?.transaction('add node', (rec) => {
        rec.addNode({
          id: newId,
          position: pos,
          style: { labelText: `N${n}`, ...(shape ? { shape } : {}) },
        });
        if (fromId) rec.addEdge({ id: `cm-e-${n}-${stamp}`, source: fromId, target: newId });
      });
    },
    [history],
  );

  const nodeItems = useCallback(
    ({ id, canvas }: GraphNodeMenuContext): MenuItem[] => {
      const layer = canvas.layers.get<graph.GraphLayer>('graph');
      if (!layer) return [];
      const store = layer.store;
      const inspect = canvas.behaviours.get<graph.ClickInspectBehaviour>('click-inspect');
      return [
        {
          id: 'edit',
          label: 'Edit properties…',
          // arm Select so the inspector + drag are live
          onClick: () => {
            setTool('select');
            inspect?.setTarget({ kind: 'node', id });
          },
        },
        {
          id: 'pin',
          label: store.isPinned(id) ? 'Unpin' : 'Pin',
          onClick: () => store.setPinned(id, !store.isPinned(id)),
        },
        {
          id: 'add-connected',
          label: 'Add connected node',
          onClick: () => {
            const origin = store.getNode(id)?.position ?? { x: 0, y: 0 };
            addNodeAt({ x: origin.x + 90, y: origin.y + 70 }, { fromId: id });
          },
        },
        {
          id: 'delete',
          label: 'Delete node',
          shortcut: '⌫',
          onClick: () => history?.transaction('delete node', (rec) => rec.removeNode(id)),
        },
      ];
    },
    [setTool, addNodeAt, history],
  );

  const edgeItems = useCallback(
    ({ id, canvas }: GraphEdgeMenuContext): MenuItem[] => {
      const layer = canvas.layers.get<graph.GraphLayer>('graph');
      if (!layer) return [];
      const store = layer.store;
      const inspect = canvas.behaviours.get<graph.ClickInspectBehaviour>('click-inspect');
      return [
        {
          id: 'edit',
          label: 'Edit properties…',
          // arm Select so the inspector is live
          onClick: () => {
            setTool('select');
            inspect?.setTarget({ kind: 'edge', id });
          },
        },
        { id: 'reverse', label: 'Reverse direction', onClick: () => store.reverseEdge(id) },
        {
          id: 'delete',
          label: 'Delete edge',
          shortcut: '⌫',
          onClick: () => history?.transaction('delete edge', (rec) => rec.removeEdge(id)),
        },
      ];
    },
    [setTool, history],
  );

  const backgroundItems = useCallback(
    ({ world, canvas }: GraphBackgroundMenuContext): MenuItem[] => {
      const layer = canvas.layers.get<graph.GraphLayer>('graph');
      if (!layer) return [];
      return [
        // One "Add <shape>" entry per available shape — selecting one drops that
        // shape at the right-clicked world point. (The design-kit's NestedMenu
        // submenu opens on hover with a slide-in gap and no hover bridge, which
        // collapses unreliably inside this floating overlay — so the shapes live
        // as flat top-level items rather than under a hover submenu.)
        ...Object.keys(SHAPES).map((key) => ({
          id: `add-${key}`,
          label: `Add ${SHAPE_LABELS[key]?.toLowerCase() ?? key}`,
          icon: SHAPE_ICONS[key as keyof typeof SHAPE_ICONS],
          onClick: () => addNodeAt({ x: world.x, y: world.y }, { shapeKey: key }),
        })),
        { id: 'fit', label: 'Fit to content', onClick: () => fitContent() },
        { id: 'clear', label: 'Clear all', onClick: () => clear() },
      ];
    },
    [addNodeAt, fitContent, clear],
  );

  return (
    <>
      {/* Mode-gated — only `enabled` flips; nothing remounts. */}
      <DragNodeBehaviour targetLayerId="graph" enabled={tool === 'select'} />
      <ClickSelectBehaviour targetLayerId="graph" enabled={tool === 'select'} multiple={false} />
      {/* Click-to-edit target for the InspectorPanel — a dedicated behaviour so
          the editor follows the last-clicked node/edge regardless of the
          (multi-)selection ClickSelect maintains for dragging. */}
      <ClickInspectBehaviour targetLayerId="graph" enabled={tool === 'select'} />
      <CreateNodeBehaviour
        targetLayerId="graph"
        enabled={tool === 'add'}
        createNode={(world) => {
          const n = (seqRef.current += 1);
          return {
            id: `n-${n}-${Date.now().toString(36)}`,
            position: world,
            style: { shape: SHAPES[nodeKindRef.current] ?? SHAPES.circle, labelText: String(n) },
          };
        }}
        onNodeCreate={draw.onNodeCreate}
      />
      <DrawEdgeBehaviour
        targetLayerId="graph"
        enabled={tool === 'connect'}
        allowSelfLoop
        onEdgeCreate={draw.onEdgeCreate}
      />
      <EraseBehaviour targetLayerId="graph" enabled={tool === 'delete'} onErase={draw.onErase} />
      {/* Fan out edges that share a node pair (drawn either direction). */}
      <ParallelEdgeBehaviour targetLayerId="graph" spacing={18} groupBy={undirectedPair} />

      {/* Click a node/edge (Select tool) → edit its `type` (shown as the drawn
          label in modelling) + key/value properties; edges add a reverse-direction
          button. `typeAsLabel` mirrors the type to the label for both. Apply
          commits an undoable update. Reads the click-inspect target above. */}
      <InspectorPanel layerId="graph" position="top-right" typeAsLabel />

      {/* Right-click menus — one component per target, each owning its own
          behaviour + overlay + dismissal. Builders defined above (they need the
          tool + draw-history hooks, so they live here rather than in `Modeller`). */}
      <GraphNodeContextMenu items={nodeItems} />
      <GraphEdgeContextMenu items={edgeItems} />
      <GraphBackgroundContextMenu items={backgroundItems} />
    </>
  );
}

function ModellerApp() {
  // The live canvas, lifted out of <Canvas> by <CanvasBridge>. Null until the
  // graph is fully wired; gates the header/footer chrome that depends on it.
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const handleReady = useCallback((c: GraphCanvas | null) => setCanvas(c), []);

  // The undo history, lifted out of the in-<Canvas> <GraphHistoryProvider> by
  // <HistoryBridge>, so the header toolbar's Undo / Redo share the same instance
  // the in-canvas drawing behaviours journal into.
  const [history, setHistory] = useState<GraphHistory | null>(null);
  const handleHistory = useCallback((h: GraphHistory | null) => setHistory(h), []);

  // The theme toggle pins the chrome theme; restore it to the OS preference on
  // unmount so the pinned theme doesn't leak into the next story.
  useEffect(() => () => applyChromeTheme(osPrefersDark()), []);

  return (
    // Lifted context + providers reach the header toolbar (a sibling of <Canvas>,
    // outside its own provider): the engine via CanvasContext, the active tool via
    // GraphToolProvider (pure state — owns no engine), and the undo history via a
    // lifted HistoryContext fed by <HistoryBridge>. The actual <GraphHistoryProvider>
    // stays *inside* <Canvas> (so it resolves a live engine + store); both the
    // header and the in-canvas behaviours then read the same history. The footer
    // hint rides the engine itself (Canvas.showMessage), so it needs no provider.
    <CanvasContext.Provider value={canvas}>
      <HistoryContext.Provider value={history}>
        <GraphToolProvider>
          <AppLayoutBase
            header={{
              left: <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>Graph Modeller</span>,
              center: canvas ? <HeaderToolbar /> : null,
              right: canvas ? <HeaderThemeToggle /> : null,
            }}
            mainClassName="relative"
            // Minimal children register the classes by id; MODELLER_OPTIONS holds
            // all settings. Node/edge stroke + background colours follow the OS
            // scheme via <SystemTheme> (theme-agnostic engine).
            main={
              <Canvas autoResize config={MODELLER_OPTIONS}>
                <BackgroundLayer id="background" />
                <GraphLayer id="graph" data={SEED} />
                {/* OS dark-mode follow — external colour patches through update(). */}
                <SystemTheme />

                <DragPanBehaviour id="pan" />
                <WheelZoomBehaviour id="wheel" />

                {/* History over the graph store — lives inside <Canvas> so it
                    resolves the live engine. <DrawingTools> reads it directly;
                    <HistoryBridge> lifts the instance up to the header. */}
                <GraphHistoryProvider layerId="graph">
                  <DrawingTools />
                  <HistoryBridge onReady={handleHistory} />
                </GraphHistoryProvider>

                {/* Last child: publishes the live engine to the lifted context
                    only after everything above has registered. */}
                <CanvasBridge onReady={handleReady} />
              </Canvas>
            }
            footer={{
              left: canvas ? <GraphStatusBar /> : null,
              // Shows the active tool's hint (pushed via Canvas.showMessage from
              // <DrawingTools>); updates as the tool changes.
              right: canvas ? <CanvasMessageBar /> : null,
            }}
          />
        </GraphToolProvider>
      </HistoryContext.Provider>
    </CanvasContext.Provider>
  );
}

export const GraphModellerApp: Story = {
  render: () => <ModellerApp />,
};
