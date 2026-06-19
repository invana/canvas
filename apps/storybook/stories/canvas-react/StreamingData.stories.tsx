/**
 * Streaming / live-append test — config-first `<Canvas config={…}>` setup that
 * **grows** the graph in place: a timer pushes a small chunk of new nodes +
 * edges into the store every few seconds via `layer.store.addData({ nodes,
 * edges })` (the non-destructive append path — it does NOT clear the store).
 *
 *   - `store.addData(...)` flushes once and emits `data:changed`
 *     (`addedNodes > 0`), which `GraphCanvas`'s active-layout wiring projects
 *     into an automatic `runLayout(activeLayout)`.
 *   - For **force** that re-run is incremental (seeded from each node's current
 *     position): placed nodes stay put, the sim only finds room for the new
 *     ones. For **ELK** it's a full one-shot re-layout each chunk.
 *
 * The append goes straight to the store (not through `<GraphLayer data>`, which
 * calls the destructive `setData`), so the streaming lives in a small
 * `<StreamingFeed>` child that reads the engine from `useCanvas()`.
 *
 * The whole chrome is **one combined toolbar** pinned top-centre (the old
 * separate header is gone): the stream controls (pause/resume, reset) and a live
 * stats readout sit alongside the standard engine toolbars — a layout switcher,
 * select-mode picker, undo/redo, cut/copy/paste, zoom/fit/lock and a grid
 * toggle. The layout switcher drives `config.activeLayout` via
 * `canvas.update(...)`, so whichever layout you pick is the one the stream
 * re-runs on every append (ELK genuinely takes over, rather than being snapped
 * back by a fixed active force layout).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  BrushSelectBehaviour,
  Canvas,
  ClickSelectBehaviour,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  EditToolbar,
  GraphClipboardProvider,
  GraphHistoryProvider,
  GraphLayer,
  GridToolbar,
  HistoryToolbar,
  LassoSelectBehaviour,
  Panel,
  ToolbarItems,
  ViewToolbar,
  WheelZoomBehaviour,
  useCanvas,
  useGraphCanvasUpdate,
  useSelectMode,
  type CanvasConfig,
  type ToolbarItem,
} from '@invana/canvas-react';
import { Separator } from '@invana/ui';
import type { GraphData, GraphLayer as GraphLayerEngine, GraphNode } from '@invana/graph';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import {
  ClipboardPaste,
  Copy,
  Eraser,
  Grid3x3,
  Lasso,
  Lock,
  LockOpen,
  Maximize,
  MousePointer2,
  Pause,
  Play,
  Redo2,
  RefreshCw,
  RotateCcw,
  Scissors,
  SquareDashedMousePointer,
  Undo2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';

const meta: Meta = { title: 'canvas-react/StreamingData' };
export default meta;
type Story = StoryObj;

const PALETTE = [
  0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
  0x14b8a6, 0xa3e635,
] as const;

const LAYER_ID = 'graph';
const INTERVAL_MS = 2000;
const CHUNK_SIZE = 10;

/** Small starting graph — a ring the stream then grows outward from. */
function seedRing(n: number): GraphData {
  const nodes = Array.from({ length: n }, (_, i) => ({
    id: `seed${i}`,
    data: { group: i % PALETTE.length },
  }));
  const edges = Array.from({ length: n }, (_, i) => ({
    id: `seedE${i}`,
    source: `seed${i}`,
    target: `seed${(i + 1) % n}`,
  }));
  return { nodes, edges };
}

// Module-level, stable identity. All serialisable settings live here; the
// `bgFill` resolver rides on the <GraphLayer> child below. `activeLayout: 'force'`
// auto-runs on mount and re-runs incrementally on every store append — the
// layout switcher repoints it (see <LayoutSelect>).
const CANVAS_OPTIONS: CanvasConfig = {
  layers: {
    background: { type: 'pattern', patternType: 'dots', backgroundColor: '#0f172a', color: '#1e293b' },
    graph: {
      node: { style: { shape: { kind: 'circle', radius: 6 } } },
      edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 0.6 } },
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
    force: { link: {}, charge: {}, center: { x: 0, y: 0 } },
  },
  activeLayout: 'force',
};

// Layout switcher options (keys = registered layout ids). 'force' is registered
// by <D3ForceLayout id="force">; the ELK ids by <RegisterElkLayouts>.
const LAYOUT_OPTIONS: Record<string, string> = {
  force: 'Force (d3)',
  'elk-layered': 'Layered (ELK)',
  'elk-stress': 'Stress (ELK)',
};

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

interface Stats {
  nodes: number;
  edges: number;
  chunks: number;
}

/**
 * Appends `CHUNK_SIZE` new nodes (each wired to a random existing node) every
 * `INTERVAL_MS` while `running`. Reads the engine from context and writes
 * straight to the layer's store — the non-destructive append path.
 */
function StreamingFeed({
  running,
  onStats,
}: {
  running: boolean;
  onStats: (s: Stats) => void;
}) {
  const canvas = useCanvas();
  const seqRef = useRef(0);
  const chunkRef = useRef(0);

  useEffect(() => {
    if (!running) return;
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
          edges.push({ id: `liveE${n}`, source: parent, target: id });
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
    };

    const handle = setInterval(tick, INTERVAL_MS);
    return () => clearInterval(handle);
  }, [canvas, running, onStats]);

  return null;
}

/**
 * Registers the ELK layouts by id so the switcher can make either the active
 * layout. ELK has no `<ElkLayout>` React wrapper yet, so we register imperatively
 * from context (mirrors what the `<D3ForceLayout>` wrapper does for force).
 */
function RegisterElkLayouts() {
  const canvas = useCanvas();
  useEffect(() => {
    // `transition` glides nodes from their current spots to the ELK result
    // instead of teleporting — on both the layout switch and each streamed
    // re-layout. (Owned by the shared OneShotPositionLayout base; cancelled +
    // restarted if a chunk lands mid-glide.)
    const layered = new ElkLayout({
      id: 'elk-layered',
      targetLayerId: LAYER_ID,
      algorithm: 'layered',
      direction: 'RIGHT',
      transition: true,
      transitionEase: 'easeInOutCubic',
    });
    const stress = new ElkLayout({
      id: 'elk-stress',
      targetLayerId: LAYER_ID,
      algorithm: 'stress',
      transition: true,
      transitionEase: 'easeInOutCubic',
    });
    canvas.layouts.add(layered);
    canvas.layouts.add(stress);
    return () => {
      canvas.layouts.remove('elk-layered');
      canvas.layouts.remove('elk-stress');
    };
  }, [canvas]);
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

/** Live node / edge / chunk counts as a read-only toolbar item. */
function GraphStats({ stats }: { stats: Stats }) {
  const items: ToolbarItem[] = [
    {
      type: 'custom',
      key: 'stats',
      render: () => (
        <span style={statsTextStyle}>
          {stats.nodes} nodes · {stats.edges} edges · {stats.chunks} chunks
        </span>
      ),
    },
  ];
  return <ToolbarItems items={items} orientation="horizontal" />;
}

/**
 * Layout switcher — repoints `config.activeLayout` via `canvas.update(...)`, so
 * the picked layout becomes the one the stream re-runs on every append (ELK
 * persists instead of being snapped back by a fixed active force layout).
 */
function LayoutSelect() {
  const canvas = useCanvas();
  const update = useGraphCanvasUpdate();
  const [active, setActive] = useState('force');
  const items: ToolbarItem[] = [
    {
      type: 'select',
      key: 'layout',
      label: 'Layout',
      value: active,
      options: LAYOUT_OPTIONS,
      onChange: (key) => {
        if (key === active) return;
        // Stop the outgoing layout before switching. d3-force keeps a *live*
        // simulation that re-heats on every position write (it listens to the
        // store's `node:update`) — even after it settles. If it isn't stopped it
        // keeps tugging nodes and overrides whatever the incoming layout (e.g.
        // ELK) just placed, so the streamed-in nodes never settle into the ELK
        // arrangement. `stop()` kills the sim and detaches that listener;
        // positions stay in the store for the next layout to seed from.
        (canvas.layouts.get(active) as { stop?: () => void } | undefined)?.stop?.();
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

function Demo() {
  const [running, setRunning] = useState(true);
  const [runId, setRunId] = useState(0);
  const [stats, setStats] = useState<Stats>({ nodes: 0, edges: 0, chunks: 0 });

  // Stable seed — applied once via <GraphLayer data>; the stream takes over from
  // there. Re-keyed on reset so a fresh ring (and fresh sim) is created.
  const seed = useMemo(() => seedRing(6), [runId]);

  // Stable callbacks so the feed's interval effect doesn't churn each render.
  const onStats = useCallback((s: Stats) => setStats(s), []);
  const toggle = useCallback(() => setRunning((r) => !r), []);
  const reset = useCallback(() => {
    setRunning(false);
    setStats({ nodes: 0, edges: 0, chunks: 0 });
    setRunId((r) => r + 1); // remounts the Canvas subtree → fresh store + seqRef
  }, []);

  return (
    <div style={hostStyle}>
      {/* Re-key the whole subtree on reset so the engine, store and the feed's
          sequence counter all start clean. */}
      <Canvas key={runId} autoResize config={CANVAS_OPTIONS}>
        {/* Engine layers (layer before the layouts/behaviours that depend on it). */}
        <BackgroundLayer id="background" />
        <GraphLayer
          id={LAYER_ID}
          data={seed}
          node={{
            style: {
              bgFill: (n: GraphNode) =>
                PALETTE[(n.data as { group: number }).group % PALETTE.length]!,
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

        {/* Layouts — force via the wrapper, ELK registered imperatively. */}
        <D3ForceLayout id="force" targetLayerId={LAYER_ID} />
        <RegisterElkLayouts />

        {/* The live-append driver. */}
        <StreamingFeed running={running} onStats={onStats} />

        {/* History + clipboard providers + the one combined toolbar. */}
        <GraphHistoryProvider layerId={LAYER_ID}>
          <GraphClipboardProvider layerId={LAYER_ID}>
            <Panel position="top-center" orientation="horizontal" gap={12}>
              <StreamControls running={running} onToggle={toggle} onReset={reset} />
              <Separator orientation="vertical" style={sepStyle} />
              <GraphStats stats={stats} />
              <Separator orientation="vertical" style={sepStyle} />
              <LayoutSelect />
              <Separator orientation="vertical" style={sepStyle} />
              <SelectModeControl />
              <Separator orientation="vertical" style={sepStyle} />
              <HistoryToolbar bare icons={{ undo: Undo2, redo: Redo2, redraw: RefreshCw }} />
              <Separator orientation="vertical" style={sepStyle} />
              <EditToolbar
                bare
                icons={{ cut: Scissors, copy: Copy, paste: ClipboardPaste, clear: Eraser }}
              />
              <Separator orientation="vertical" style={sepStyle} />
              {/* ViewToolbar defaults to vertical — force horizontal for the row. */}
              <ViewToolbar
                bare
                orientation="horizontal"
                icons={{ zoomIn: ZoomIn, zoomOut: ZoomOut, fit: Maximize, locked: Lock, unlocked: LockOpen }}
              />
              <Separator orientation="vertical" style={sepStyle} />
              <GridToolbar bare icons={{ grid: Grid3x3 }} />
            </Panel>
          </GraphClipboardProvider>
        </GraphHistoryProvider>
      </Canvas>
    </div>
  );
}

const hostStyle: CSSProperties = { height: '100vh' };
const sepStyle: CSSProperties = { alignSelf: 'center', height: 16 };
const statsTextStyle: CSSProperties = {
  fontSize: 12,
  color: '#64748b',
  whiteSpace: 'nowrap',
  padding: '0 4px',
  fontVariantNumeric: 'tabular-nums',
};

export const StreamingData: Story = {
  render: () => <Demo />,
};
