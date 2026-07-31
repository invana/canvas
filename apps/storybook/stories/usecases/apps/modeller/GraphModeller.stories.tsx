/**
 * Graph **modeller, dressed in the app shell** — a full drawing tool composed as
 * an *arrangement* of `<GraphCanvasApp>` (`bundle={false}`), the modeller
 * counterpart of `apps/visualiser/GraphVisualiser`. It's the proof the app hosts *any* use
 * case: where the visualiser feeds the batteries bundle a read-only graph, this
 * story turns the bundle off and feeds tool-gated drawing behaviours + a
 * `ModellerToolbar` as `children`, with the chrome in the app's header / footer
 * slots instead of floating `<Panel>`s:
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
 * `<GraphCanvasApp>` lays out `header` / `main` / `footer` as siblings, but the
 * `<Canvas>` (engine + its `CanvasContext`) lives inside `main`. The header
 * toolbar and footer therefore sit *outside* the `<Canvas>` subtree. The app
 * already lifts the `CanvasContext` / `GraphCanvasContext` for us (fed by its own
 * ready-bridge), so the footer status bar resolves the live engine for free. The
 * header's `ModellerToolbar` and the in-canvas drawing behaviours additionally
 * need the **same** `GraphToolProvider` (active tool + node shape) and the same
 * undo history — so this story passes the app a `wrap` that adds a
 * `GraphToolProvider` and a lifted `HistoryContext` *above* the whole app.
 *
 * The actual `GraphHistoryProvider` stays **inside** `<Canvas>` (an app child) so
 * it resolves a live engine + store; `<HistoryBridge>` lifts that history up into
 * the `wrap`'s `HistoryContext` so the header toolbar's Undo / Redo drive the same
 * instance the in-canvas behaviours journal into. `useDrawHistory` reads history
 * through a ref, so the drawing behaviours — which mount before the engine is
 * published — still journal correctly.
 */

import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Circle, Square, Diamond, Sun, Moon } from 'lucide-react';
import { BackgroundLayer, GraphLayer, DragPanBehaviour, WheelZoomBehaviour, DragNodeBehaviour, ClickSelectBehaviour, ClickInspectBehaviour, CreateNodeBehaviour, DrawEdgeBehaviour, EraseBehaviour, ParallelEdgeBehaviour, GraphHistoryProvider, GraphToolProvider, HistoryContext, useGraphCanvas, useGraphCanvasUpdate, useTool, useDrawHistory, useFitContent, useClearGraph } from '@invana/canvas-react';
import { CanvasMessageBar, GraphNodeContextMenu, GraphEdgeContextMenu, GraphBackgroundContextMenu, GraphCanvasApp, ModellerToolbar, InspectorPanel, GraphStatusBar, ToolbarItems } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas-react';
import type { GraphCanvasAppControlContext, GraphNodeMenuContext, GraphEdgeMenuContext, GraphBackgroundMenuContext, ToolbarItem } from '@invana/canvas-ui';
import type { MenuItem } from '@invana/ui';
import type {
  GraphData,
  GraphEdge,
  GraphHistory,
  NodeShapeOptions,
} from '@invana/graph';
import type * as graph from '@invana/graph';
import { ThemeProvider, useTheme } from '@invana/themes';

const meta: Meta = { title: 'usecases/apps/modeller/GraphModeller' };
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
// (node/edge stroke, background) come from the patches + `<ThemeSync>`.
const MODELLER_OPTIONS: CanvasConfig = {
  layers: {
    // Theme-driven background colours live only in M_LIGHT/M_DARK (pushed by
    // <ThemeSync>) — not here, or the base config would clobber the resolved
    // theme on mount (the <Canvas> applies config after the ThemeSync effect).
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

/**
 * Pushes the matching light/dark engine patch whenever the shared `<ThemeProvider>`
 * scheme flips (OS-follow in `system` mode, or the header toggle). Replaces the
 * old OS-only `useSystemTheme` — the engine now tracks the same theme the shell
 * chrome does. Lives inside `<Canvas>` (so it resolves the live engine) and is
 * needed because `bundle={false}` skips `GraphCanvasApp`'s own theme sync.
 */
function ThemeSync() {
  const { isDark } = useTheme();
  const update = useGraphCanvasUpdate();
  useEffect(() => {
    update(isDark ? M_DARK : M_LIGHT);
  }, [isDark, update]);
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
    <ModellerToolbar bare nodeKinds={SHAPE_LABELS} nodeKindIcons={SHAPE_ICONS} />
  );
}

/**
 * Header-right theme toggle — flips the shared `<ThemeProvider>` via the app's
 * control context. The shell classes follow `themeKind` automatically and the
 * in-canvas `<ThemeSync>` repaints the engine; this button only toggles.
 */
function HeaderThemeToggle({ ctx }: { ctx: GraphCanvasAppControlContext }) {
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'theme',
      icon: Sun,
      activeIcon: Moon,
      label: 'Switch to dark theme',
      activeLabel: 'Switch to light theme',
      active: ctx.themeKind === 'dark',
      onToggle: ctx.toggleTheme,
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
  // The undo history, lifted out of the in-<Canvas> <GraphHistoryProvider> by
  // <HistoryBridge>, so the header toolbar's Undo / Redo share the same instance
  // the in-canvas drawing behaviours journal into.
  const [history, setHistory] = useState<GraphHistory | null>(null);
  const handleHistory = useCallback((h: GraphHistory | null) => setHistory(h), []);

  // The whole modeller is `<GraphCanvasApp bundle={false}>` + the right `wrap` and
  // children: the app lifts CanvasContext / GraphCanvasContext (fed by its own
  // ready-bridge) for us, so this story only supplies the modeller-specific
  // pieces. `bundle={false}` means MODELLER_OPTIONS is used as-is (no batteries
  // bundle merged) and the graph is composed entirely from these children.
  return (
    // A real consumer mounts the app under its own <ThemeProvider>; the app reads
    // light/dark from it via useTheme() and throws without one. `storageKey={null}`
    // keeps the toggle from persisting into the next story (each story self-contained).
    <ThemeProvider storageKey={null}>
      <GraphCanvasApp
        data={SEED}
        bundle={false}
        config={MODELLER_OPTIONS}
        // Lift the active tool + undo history ABOVE the app so the header toolbar
        // (a sibling of <Canvas>, outside its own provider) shares them with the
        // in-canvas drawing behaviours. GraphToolProvider owns no engine (pure
        // state); the HistoryContext is fed by <HistoryBridge> from inside <Canvas>.
        // The footer hint rides the engine itself (Canvas.showMessage) — no provider.
        wrap={(app) => (
          <GraphToolProvider>
            <HistoryContext.Provider value={history}>{app}</HistoryContext.Provider>
          </GraphToolProvider>
        )}
        // Header / footer slots are rendered only once the engine is live, so they
        // need no `canvas ? … : null` gate. `title` fills the default header-left brand.
        header={{
          title: 'Graph Modeller',
          center: <HeaderToolbar />,
          right: (ctx) => <HeaderThemeToggle ctx={ctx} />,
        }}
        footer={{
          left: <GraphStatusBar />,
          // Shows the active tool's hint (pushed via Canvas.showMessage from
          // <DrawingTools>); updates as the tool changes.
          right: <CanvasMessageBar />,
        }}
      >
        {/* Minimal children register the classes by id; MODELLER_OPTIONS holds all
            settings. Node/edge stroke + background colours track the shared theme
            via <ThemeSync> (theme-agnostic engine). */}
        <BackgroundLayer id="background" />
        <GraphLayer id="graph" data={SEED} />
        {/* Light/dark follow — external colour patches through update(). */}
        <ThemeSync />

        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />

        {/* History over the graph store — inside <Canvas> so it resolves the live
            engine. <DrawingTools> reads it directly; <HistoryBridge> lifts the
            instance up to the header (via the lifted HistoryContext above). */}
        <GraphHistoryProvider layerId="graph">
          <DrawingTools />
          <HistoryBridge onReady={handleHistory} />
        </GraphHistoryProvider>
      </GraphCanvasApp>
    </ThemeProvider>
  );
}

export const GraphModellerStory: Story = {
  name: 'GraphModeller',
  render: () => <ModellerApp />,
};
