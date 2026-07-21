/**
 * Shared streaming-demo harness for the two layout stories
 * (`CyclicExamples`, `AcyclicExamples`). Both grow a graph in place — a timer
 * pushes a small chunk of new nodes + edges into the store every few seconds
 * via `layer.store.addData({ nodes, edges })` (the non-destructive append path:
 * it does NOT clear the store) — and both wear the exact same chrome, hosted on
 * `<GraphCanvasApp bundle={false}>`: the combined
 * streaming toolbar (stream controls, layout switcher, select-mode picker,
 * edge-type picker, undo/redo, cut/copy/paste, zoom/fit/lock, grid toggle) fills
 * the app **header**, the live node/edge/chunk stats sit in the **footer**, and
 * the engine (layers + behaviours + layouts + the live-append feed) are the
 * app's `<Canvas>` children. The ONLY things that differ between the two stories
 * are:
 *
 *   1. the **seed** — a cyclic ring vs. a single-rooted tree — and
 *   2. the **layout menu** — which `Layout` instances the switcher offers.
 *
 * That's why this lives in a plain (non-`.stories`) module the two story files
 * parameterise: pass `makeSeed` + `extraLayouts` and you get the whole demo.
 *
 *   - `store.addData(...)` flushes once and emits `data:changed`
 *     (`addedNodes > 0`), which the active-layout wiring projects into an
 *     automatic `runLayout(activeLayout)`. For **force** that re-run is
 *     incremental (seeded from each node's current position); one-shot layouts
 *     (ELK / hierarchy / sankey / geometric) do a full re-layout each chunk.
 *   - The append goes straight to the store (not through `<GraphLayer data>`,
 *     which calls the destructive `setData`), so the streaming lives in a small
 *     `<StreamingFeed>` child that reads the engine from `useCanvas()`.
 *   - The layout switcher drives `config.activeLayout` via `canvas.update(...)`,
 *     so whichever layout you pick is the one the stream re-runs on every
 *     append (the picked layout genuinely takes over, rather than being snapped
 *     back by a fixed active force layout).
 *
 * Every streamed edge carries `data.value = 1` so the sankey layout (which
 * throws on weightless links) is happy; the other layouts ignore it.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { BackgroundLayer, BrushSelectBehaviour, ClickSelectBehaviour, D3ForceLayout, DevInfoLayer, DragNodeBehaviour, DragPanBehaviour, GraphClipboardProvider, GraphHistoryProvider, GraphLayer, LabelCollisionBehaviour, TextResolutionLODBehaviour, LassoSelectBehaviour, WheelZoomBehaviour, useCanvas, useFitContent, useGraphCanvasUpdate, useSelectMode, type CanvasConfig } from '@invana/canvas-react';
import { EditToolbar, GraphCanvasApp, GridToolbar, HistoryToolbar, ToolbarItems, ViewToolbar, type GraphCanvasAppControlContext, type ToolbarItem } from '@invana/canvas-ui';
import type { Layout } from '@invana/canvas';
import { Separator } from '@invana/ui';
import { ThemeProvider, useTheme } from '@invana/themes';

import type { GraphData, GraphLayer as GraphLayerEngine, GraphNode } from '@invana/graph';
import {
  Gauge,
  Lasso,
  Moon,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
  SquareDashedMousePointer,
  Sun,
} from 'lucide-react';

/** Node-group colour ramp, shared by both stories' seed generators. */
export const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

/** Id of the single `<GraphLayer>` every layout targets. */
export const LAYER_ID = 'graph';

const INTERVAL_MS = 2000;
const CHUNK_SIZE = 50;

/** Stream this many chunks, then auto-stop (Reset starts a fresh run). */
const MAX_CHUNKS = 10;

/** Base node radius — the circle every node renders as unless a geometry-rewriting
 *  layout (pack / sunburst) overrides it. Shared by the layer config and the
 *  on-switch geometry reset so they stay in lockstep. */
const NODE_RADIUS = 6;

/**
 * Shared glide so every imperatively-registered one-shot layout tweens nodes
 * from their current spots to the new arrangement instead of teleporting — on
 * both the layout switch and each streamed re-layout. (Layouts that replace
 * node *geometry* rather than move nodes — pack / sunburst / sankey — veto the
 * tween internally and snap.)
 */
export const GLIDE = { transition: true, transitionEase: 'easeInOutCubic' } as const;

/**
 * One switchable layout: its registered `id`, the switcher label, and a factory
 * that builds the instance. The switcher option map and the `<RegisterLayouts>`
 * effect both derive from the list a story passes in, so adding a layout is a
 * single line in that story.
 */
export interface LayoutEntry {
  id: string;
  label: string;
  make: () => Layout;
}

// Module-level, stable identity. All serialisable settings live here; the
// `bgFill` resolver rides on the <GraphLayer> child below. `activeLayout: 'force'`
// auto-runs on mount and re-runs incrementally on every store append — the
// layout switcher repoints it (see <LayoutSelect>).
const CANVAS_OPTIONS: CanvasConfig = {
  layers: {
    // Theme-driven colours (background, label colour, label pill, edge stroke)
    // live only in S_LIGHT / S_DARK (pushed by <ThemeSync>) — not here, or this
    // base would clobber the resolved theme on mount (<Canvas> applies config
    // after the ThemeSync effect). Theme-independent geometry/sizing stays here.
    background: { type: 'pattern', patternType: 'dots' },
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: NODE_RADIUS },
          // Static node-label styling (serialisable, so it rides in the
          // config like `shape`). The per-node text itself comes from the
          // `labelText` resolver on the <GraphLayer> child — a function can't
          // live in JSON config, so it sits alongside `bgFill` there.
          labelFontSize: 10,
          labelPlacement: 'bottom',
          labelOffsetY: 3,
          // A faint pill behind each label so text reads over edges /
          // neighbouring nodes instead of getting lost in the cluster (its
          // theme-driven fill is in S_LIGHT / S_DARK). Paired with
          // <LabelCollisionBehaviour> (hides overlapping labels) below.
          labelBackgroundAlpha: 0.65,
          labelBackgroundPadding: 2,
          labelBackgroundCornerRadius: 3,
        },
      },
      edge: { style: { strokeWidth: 0.6 } },
    },
  },
  behaviours: {
    pan: { enabled: true },
    zoom: { enabled: true },
    'drag-node': { enabled: true },
    // click-select stays on; brush/lasso are armed by the select-mode picker.
    'click-select': { enabled: true },
    'brush-select': { enabled: false },
    'lasso-select': { enabled: false },
  },
  layouts: {
    // `animate: false` runs the force sim to convergence synchronously and
    // commits the settled positions in one paint — no per-tick re-route /
    // repaint storm, so a steady high frame rate on large streamed graphs.
    // `collide` keeps the NODE_RADIUS circles from overlapping; charge + link
    // distance give the cluster room to spread into a clean arrangement. Tuned
    // looser than the defaults so the streamed-in 500-node graph breathes —
    // stronger repulsion + longer links + a wider collision radius (room for the
    // labels below each node) keep nodes from crowding into an unreadable mat.
    force: {
      animate: false,
      link: { distance: 70 },
      charge: { strength: -300 },
      collide: { radius: NODE_RADIUS + 16 },
      center: { x: 0, y: 0 },
    },
  },
  activeLayout: 'force',
};

// Theme-driven colour patches, pushed by <ThemeSync> when the shared
// <ThemeProvider> scheme flips (OS-follow in `system` mode, or the header
// toggle). Only the theme-dependent channels live here — the per-group node
// `bgFill` palette and all geometry/sizing stay theme-independent in
// CANVAS_OPTIONS / the <GraphLayer> child.
const S_LIGHT: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#f8fafc', color: '#cbd5e1' },
    graph: {
      node: { style: { labelColor: 0x334155, labelBackgroundFill: 0xf8fafc } },
      edge: { style: { strokeColor: 0x94a3b8 } },
    },
  },
};
const S_DARK: CanvasConfig = {
  layers: {
    background: { backgroundColor: '#0f172a', color: '#1e293b' },
    graph: {
      node: { style: { labelColor: 0xe2e8f0, labelBackgroundFill: 0x0f172a } },
      edge: { style: { strokeColor: 0xcbd5e1 } },
    },
  },
};

/**
 * Pushes the matching light/dark engine patch whenever the shared
 * `<ThemeProvider>` scheme flips. Lives inside `<Canvas>` (so it resolves the
 * live engine) and is needed because `bundle={false}` skips `GraphCanvasApp`'s
 * own theme sync — the engine colours track the same theme the shell chrome does.
 */
function ThemeSync() {
  const { isDark } = useTheme();
  const update = useGraphCanvasUpdate();
  useEffect(() => {
    update(isDark ? S_DARK : S_LIGHT);
  }, [isDark, update]);
  return null;
}

/**
 * Header-right theme toggle — flips the shared `<ThemeProvider>` via the app's
 * control context. The shell classes follow `themeKind` automatically and the
 * in-canvas `<ThemeSync>` repaints the engine; this button only toggles.
 */
function ThemeToggle({ ctx }: { ctx: GraphCanvasAppControlContext }) {
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

// Select-mode key → registered behaviour id. `useSelectMode` enables exactly one
// and disables the rest. `click` maps to '' (no drag-select behaviour) — click
// select is always on and doesn't collide with the Shift+drag brush/lasso pair.
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

// Edge path-type switcher options (keys = `EdgePathType` ids the renderer
// understands). Drives `layers.graph.edge.style.shape.pathType` via
// `canvas.update(...)`, re-routing every edge live. The radial-only
// (`bump-radial` / `step-radial`) and self-loop (`loop-*`) variants are omitted
// — they don't suit a general streaming graph.
const EDGE_TYPE_OPTIONS: Record<string, string> = {
  straight: 'Straight',
  bezier: 'Bezier',
  quadratic: 'Quadratic',
  smooth: 'Smooth',
  rounded: 'Rounded',
  orth: 'Orthogonal',
  manhattan: 'Manhattan',
  'bump-horizontal': 'Bump',
};

interface Stats {
  nodes: number;
  edges: number;
  chunks: number;
}

/**
 * Appends `CHUNK_SIZE` new nodes (each wired to a random existing node) every
 * `INTERVAL_MS` while `running`, up to `MAX_CHUNKS` chunks — then calls
 * `onComplete` (which stops the run) so the stream is bounded rather than
 * unending. Reads the engine from context and writes straight to the layer's
 * store — the non-destructive append path. Because each new node is freshly
 * minted and gets exactly one incoming edge, the stream never introduces a cycle
 * on its own: the graph stays cyclic or acyclic purely according to its seed.
 *
 * The chunk counter is a ref, so it survives pause / resume — the 10-chunk cap is
 * a total across the run, not per resume. Reset remounts the <Canvas> (fresh
 * `instanceKey`), which resets this counter for a clean new run.
 */
function StreamingFeed({
  running,
  onStats,
  onComplete,
}: {
  running: boolean;
  onStats: (s: Stats) => void;
  onComplete: () => void;
}) {
  const canvas = useCanvas();
  const seqRef = useRef(0);
  const chunkRef = useRef(0);

  useEffect(() => {
    // Don't (re)arm the timer when paused or already at the cap — so a Resume
    // after the run has completed is a no-op until Reset.
    if (!running || chunkRef.current >= MAX_CHUNKS) return;
    const tick = () => {
      const layer = canvas.layers.get<GraphLayerEngine>(LAYER_ID);
      if (!layer) return;

      // Pool of ids new nodes can attach to: everything already in the store,
      // plus the nodes minted earlier in this same chunk (so a chunk forms a
      // little connected branch rather than CHUNK_SIZE disjoint specks).
      const pool = Array.from(layer.store.nodes(), (n: GraphNode) => n.id);
      const nodes: GraphData['nodes'] = [];
      const edges: GraphData['edges'] = [];

      for (let k = 0; k < CHUNK_SIZE; k++) {
        const n = seqRef.current++;
        const id = `live${n}`;
        nodes.push({ id, data: { group: n % PALETTE.length } });
        if (pool.length > 0) {
          const parent = pool[Math.floor(Math.random() * pool.length)]!;
          // `data.value` is required by the sankey layout (it throws on a
          // weightless link); every other layout ignores it.
          edges.push({ id: `liveE${n}`, source: parent, target: id, data: { value: 1 } });
        }
        pool.push(id);
      }

      // Non-destructive append → single flush → `data:changed (addedNodes>0)`
      // → the active layout re-runs, seeded from current positions.
      layer.store.addData({ nodes, edges });

      chunkRef.current += 1;
      onStats({
        nodes: layer.store.nodeCount(),
        edges: layer.store.edgeCount(),
        chunks: chunkRef.current,
      });

      // Hit the cap → stop the timer now and tell the parent to end the run
      // (which flips the Play/Pause toggle back to paused).
      if (chunkRef.current >= MAX_CHUNKS) {
        clearInterval(handle);
        onComplete();
      }
    };

    const handle = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(handle);
  }, [canvas, running, onStats, onComplete]);

  return null;
}

/**
 * Registers every switchable layout (see {@link LayoutEntry}) by id so the
 * switcher can make any of them the active layout. These layouts have no React
 * wrapper yet, so we register imperatively from context (mirrors what the
 * `<D3ForceLayout>` wrapper does for force). The glide (owned by the shared
 * `OneShotPositionLayout` base) is cancelled + restarted if a chunk lands
 * mid-tween.
 */
function RegisterLayouts({ extraLayouts }: { extraLayouts: readonly LayoutEntry[] }) {
  const canvas = useCanvas();
  useEffect(() => {
    for (const entry of extraLayouts) canvas.layouts.add(entry.make());
    return () => {
      for (const entry of extraLayouts) canvas.layouts.remove(entry.id);
    };
  }, [canvas, extraLayouts]);
  return null;
}

/** Pause/resume + reset, as toolbar items folded into the combined bar. */
function StreamControls({
  running,
  onToggle,
  onReset,
}: {
  running: boolean;
  onToggle: () => void;
  onReset: () => void;
}) {
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'stream',
      icon: Play,
      activeIcon: Pause,
      label: 'Resume stream',
      activeLabel: 'Pause stream',
      active: running,
      onToggle,
    },
    { type: 'button', key: 'reset', icon: RotateCcw, label: 'Reset stream', onClick: onReset },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/** Live node / edge counts + streaming progress as a read-only toolbar item. */
function GraphStats({ stats }: { stats: Stats }) {
  const items: ToolbarItem[] = [
    {
      type: 'custom',
      key: 'stats',
      render: () => (
        <span style={statsTextStyle}>
          {stats.nodes} nodes · {stats.edges} edges · streaming {stats.chunks}/{MAX_CHUNKS} chunks
        </span>
      ),
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/**
 * Layout switcher — repoints `config.activeLayout` via `canvas.update(...)`, so
 * the picked layout becomes the one the stream re-runs on every append (the
 * incoming layout persists instead of being snapped back by the active force
 * layout). On switch it also **fits the content** once the incoming layout has
 * settled, so a layout that lands the graph in a different place / extent (ELK
 * vs. radial-tree vs. sankey, …) is framed instead of left off-screen.
 */
function LayoutSelect({ options }: { options: Record<string, string> }) {
  const canvas = useCanvas();
  const update = useGraphCanvasUpdate();
  const { fitContent } = useFitContent(LAYER_ID);
  const [active, setActive] = useState('force');
  const items: ToolbarItem[] = [
    {
      type: 'select',
      key: 'layout',
      label: 'Layout',
      value: active,
      options,
      onChange: (key) => {
        if (key === active) return;
        // Stop the outgoing layout before switching. d3-force keeps a *live*
        // simulation that re-heats on every position write (it listens to the
        // store's `node:update`) — even after it settles. If it isn't stopped it
        // keeps tugging nodes and overrides whatever the incoming layout (e.g.
        // ELK) just placed, so the streamed-in nodes never settle into the
        // incoming arrangement. `stop()` kills the sim and detaches that
        // listener; positions stay in the store for the next layout to seed from.
        (canvas.layouts.get(active) as { stop?: () => void } | undefined)?.stop?.();

        // Reset per-node geometry baked in by a previous geometry-rewriting
        // layout. `pack` / `sunburst` write each node's `style.shape` (a sized
        // disc / an arc sector) straight into the store; a position-only
        // incoming layout (ELK / force / hierarchy-tree / geometric) never
        // clears it, so without this the morphed shapes — or, worst case,
        // near-zero rects — persist and the nodes look wrong or vanish. Stamp
        // every node back to the base circle before the incoming layout runs.
        const layer = canvas.layers.get<GraphLayerEngine>(LAYER_ID);
        if (layer) {
          const { store } = layer;
          store.batch(() => {
            for (const n of store.nodes()) {
              const style =
                n.style && typeof n.style === 'object' ? (n.style as Record<string, unknown>) : {};
              store.updateNode(n.id, {
                style: { ...style, shape: { kind: 'circle', radius: NODE_RADIUS } },
              });
            }
          });
        }

        // Fit once the *incoming* layout settles. Attached before `update(...)`
        // so a synchronous one-shot run (which emits `end` a microtask later) is
        // still caught. We wait for a `completed` end and **ignore** any
        // `stopped` ones: a fresh run cancels whatever was mid-flight first
        // (`Layout.apply()` calls `stop()`, emitting `end{stopped}` before
        // `start`), and the fast synchronous layouts (hierarchy / geometric) can
        // surface that stop before their real settle. Detaching on the first
        // `end` regardless — as we used to — swallowed the fit for exactly those
        // layouts while the slow async ELK run always reached `completed` first
        // (hence "only ELK fits"). Detach after the fit so the per-chunk
        // re-layouts that follow don't keep reframing.
        const incoming = canvas.layouts.get(key);
        let off: (() => void) | undefined;
        off = incoming?.events.on('end', ({ reason }) => {
          if (reason !== 'completed') return;
          off?.();
          fitContent();
        });

        setActive(key);
        update({ activeLayout: key });
      },
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/** Mutually-exclusive click / brush / lasso selection-mode picker. */
function SelectModeControl() {
  const { mode, modeOptions, setMode } = useSelectMode(SELECT_MODE_IDS, {
    initial: 'click',
    labels: SELECT_LABEL,
  });
  const items: ToolbarItem[] = [
    {
      type: 'select',
      key: 'select-mode',
      label: 'Select',
      value: mode,
      options: modeOptions,
      icons: SELECT_ICONS,
      onChange: setMode,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/**
 * Edge path-type switcher — sets `layers.{LAYER_ID}.edge.style.shape.pathType`
 * via `canvas.update(...)`, which deep-merges into the edge template and
 * re-routes every edge live (the existing `strokeColor` / `strokeWidth` are
 * preserved). Persists across layout switches and the streamed appends.
 */
function EdgeTypeSelect() {
  const update = useGraphCanvasUpdate();
  const [type, setType] = useState('straight');
  const items: ToolbarItem[] = [
    {
      type: 'select',
      key: 'edge-type',
      label: 'Edge',
      value: type,
      options: EDGE_TYPE_OPTIONS,
      onChange: (key) => {
        if (key === type) return;
        setType(key);
        update({ layers: { [LAYER_ID]: { edge: { style: { shape: { pathType: key } } } } } });
      },
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/**
 * Dev-overlay (FPS / pointer / zoom) toggle — a single design-kit toolbar button,
 * replacing the one `<StoryCanvasShell>` used to bake into its header. Toggling it
 * mounts / unmounts the `<DevInfoLayer>` child below (mount/unmount, not the
 * engine's `enabled` flag, is what shows / hides it).
 */
function DevOverlayToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  const items: ToolbarItem[] = [
    {
      type: 'toggle',
      key: 'dev-info',
      icon: Gauge,
      label: 'Dev overlay: off',
      activeLabel: 'Dev overlay: on',
      active: on,
      onToggle,
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/**
 * The whole streaming demo, parameterised by the two story files.
 *
 * @param makeSeed - builds the starting graph (a ring for the cyclic story, a
 *   single-rooted tree for the acyclic one). Re-invoked on every reset so a
 *   fresh graph (and a fresh sim) is created.
 * @param extraLayouts - the non-force layouts the switcher offers. `force` is
 *   always present (registered by `<D3ForceLayout id="force">`); these are
 *   appended after it.
 */
export function StreamingDemo({
  makeSeed,
  extraLayouts,
}: {
  makeSeed: () => GraphData;
  extraLayouts: readonly LayoutEntry[];
}) {
  const [running, setRunning] = useState(true);
  const [runId, setRunId] = useState(0);
  const [stats, setStats] = useState<Stats>({ nodes: 0, edges: 0, chunks: 0 });
  // Dev overlay starts on (the demo's per-tick cost is handy to watch as the
  // stream grows the graph). Replaces the shell's old `devInfoInitiallyOn`.
  const [devOn, setDevOn] = useState(true);
  const toggleDev = useCallback(() => setDevOn((v) => !v), []);

  // Layout switcher options (keys = registered layout ids). 'force' is the
  // built-in baseline; the rest come from the story's `extraLayouts`.
  const layoutOptions = useMemo<Record<string, string>>(
    () => ({ force: 'Force (d3)', ...Object.fromEntries(extraLayouts.map((l) => [l.id, l.label])) }),
    [extraLayouts],
  );

  // Stable seed — applied once via <GraphLayer data>; the stream takes over from
  // there. Re-keyed on reset so a fresh graph (and fresh sim) is created.
  const seed = useMemo(() => makeSeed(), [makeSeed, runId]);

  // Stable callbacks so the feed's interval effect doesn't churn each render.
  const onStats = useCallback((s: Stats) => setStats(s), []);
  const onComplete = useCallback(() => setRunning(false), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRunning(false);
    setStats({ nodes: 0, edges: 0, chunks: 0 });
    setRunId((r) => r + 1); // remounts the Canvas subtree → fresh store + seqRef
  }, []);

  // The combined streaming toolbar that fills the app header. It lives outside
  // <Canvas> (a sibling of it, in the header rail) so it resolves the live engine
  // through GraphCanvasApp's lifted CanvasContext; the history + clipboard
  // providers wrap it here (rather than in-canvas) so the Undo/Redo + cut/copy/
  // paste sections find the store. The header slot itself only renders once the
  // engine is live, so the providers always mount against a live canvas — no
  // explicit gate needed.
  const headerToolbar = (
    <GraphHistoryProvider layerId={LAYER_ID}>
      <GraphClipboardProvider layerId={LAYER_ID}>
        <div style={rowStyle}>
          <StreamControls running={running} onToggle={toggle} onReset={reset} />
          <Separator orientation="vertical" style={sepStyle} />
          <LayoutSelect options={layoutOptions} />
          <Separator orientation="vertical" style={sepStyle} />
          <EdgeTypeSelect />
          <Separator orientation="vertical" style={sepStyle} />
          <SelectModeControl />
          <Separator orientation="vertical" style={sepStyle} />
          <HistoryToolbar bare />
          <Separator orientation="vertical" style={sepStyle} />
          <EditToolbar bare />
          <Separator orientation="vertical" style={sepStyle} />
          {/* ViewToolbar defaults to vertical — force horizontal for the row. */}
          <ViewToolbar bare orientation="horizontal" />
          <Separator orientation="vertical" style={sepStyle} />
          <GridToolbar bare />
        </div>
      </GraphClipboardProvider>
    </GraphHistoryProvider>
  );

  return (
    // `<GraphCanvasApp bundle={false}>` hosts the streaming demo: the combined
    // toolbar in the header, the live node/edge/chunk counts in the footer, and the
    // engine (layers + behaviours + layouts + the live-append feed) as <Canvas>
    // children. `bundle={false}` turns the batteries bundle off so CANVAS_OPTIONS
    // and these children own the whole graph. `instanceKey={runId}` re-keys the
    // <Canvas> on reset so the engine, store and the feed's sequence counter all
    // start clean. `data={seed}` satisfies the app's required prop but is unused
    // here — the streaming <GraphLayer> below carries the seed (+ its resolvers).
    //
    // A real consumer mounts the app under its own <ThemeProvider>; the app reads
    // light/dark from it and throws without one. `storageKey={null}` stops a
    // theme choice persisting into the next story. The engine colours are fixed
    // dark in CANVAS_OPTIONS (this demo has no engine theme toggle).
    <ThemeProvider storageKey={null}>
      <GraphCanvasApp
        data={seed}
        bundle={false}
        config={CANVAS_OPTIONS}
        instanceKey={runId}
        // Header slots render only once the engine is live, so no `canvas` gate.
        // Header-right: dev overlay (FPS / pointer / zoom) toggle — handy for
        // watching the per-tick cost as the stream grows the graph — plus the
        // light/dark theme toggle (driven by the app's control context).
        header={{
          center: headerToolbar,
          right: (ctx) => (
            <>
              <DevOverlayToggle on={devOn} onToggle={toggleDev} />
              <ThemeToggle ctx={ctx} />
            </>
          ),
        }}
        footer={{ left: <GraphStats stats={stats} /> }}
      >
        {/* Engine layers (layer before the layouts/behaviours that depend on it). */}
        <BackgroundLayer id="background" />
        <GraphLayer
          id={LAYER_ID}
          data={seed}
          node={{
            style: {
              bgFill: (n: GraphNode) =>
                PALETTE[(n.data as { group: number }).group % PALETTE.length]!,
              // Per-node label text — the node id (`seed0`, `live42`, …). Static
              // label styling (colour / size / placement) lives in CANVAS_OPTIONS.
              labelText: (n: GraphNode) => n.id,
            },
          }}
        />

        {/* Behaviours — enabled state comes from CANVAS_OPTIONS. */}
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="zoom" />
        <DragNodeBehaviour id="drag-node" targetLayerId={LAYER_ID} />
        <ClickSelectBehaviour id="click-select" targetLayerId={LAYER_ID} multiple />
        <BrushSelectBehaviour id="brush-select" targetLayerId={LAYER_ID} />
        <LassoSelectBehaviour id="lasso-select" targetLayerId={LAYER_ID} />

        {/* Label legibility on the dense streamed graph: hide labels that would
            overlap (keep the highest-degree nodes' labels), and re-rasterise the
            survivors at higher resolution when zoomed in so they stay crisp. */}
        <LabelCollisionBehaviour id="label-collision" targetLayerId={LAYER_ID} prioritise="node-degree" />
        <TextResolutionLODBehaviour id="label-resolution" targetLayerId={LAYER_ID} />

        {/* Layouts — force via the wrapper, the rest registered imperatively. */}
        <D3ForceLayout id="force" targetLayerId={LAYER_ID} />
        <RegisterLayouts extraLayouts={extraLayouts} />

        {/* Light/dark follow — pushes the matching engine colour patch. */}
        <ThemeSync />

        {/* The live-append driver — streams MAX_CHUNKS chunks, then auto-stops. */}
        <StreamingFeed running={running} onStats={onStats} onComplete={onComplete} />

        {/* Dev overlay — mounted only while the header toggle is on (top-left;
            no minimap in this demo to clash with). */}
        {devOn ? <DevInfoLayer id="dev-info" corner="top-left" /> : null}
      </GraphCanvasApp>
    </ThemeProvider>
  );
}

const sepStyle: CSSProperties = { alignSelf: 'center', height: 16 };
const rowStyle: CSSProperties = { display: 'flex', alignItems: 'center', gap: 12 };
const statsTextStyle: CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  whiteSpace: 'nowrap',
  padding: '0 4px',
  fontVariantNumeric: 'tabular-nums',
};
