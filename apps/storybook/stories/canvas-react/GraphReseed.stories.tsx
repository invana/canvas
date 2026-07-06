import { Canvas, GraphLayer, BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour, D3ForceLayout } from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

/**
 * `canvas-react/Graph Reseed` — regression coverage for the destructive
 * `setData` re-seed path (the `<GraphLayer data>` reference swap), and a live
 * demo of the experimental-WebGPU → WebGL fallback.
 *
 * Re-seeding a canvas that has already rendered a frame can crash the PixiJS 8
 * **WebGPU** renderer (a null bind-group during pipeline setup). The engine is
 * WebGPU-first, so if that render-time crash fires it halts its loop and emits
 * `canvas:renderer:fallback` — `<Canvas>` catches it and degrades that canvas
 * to WebGL automatically (WebGL is unaffected by the bug).
 *
 * Use the buttons to reproduce the acceptance sequence on a *rendered* canvas:
 * seed A → clear (empty) → seed A → seed B. On a browser that hits the WebGPU
 * bug you'll see the console fallback warning then a clean WebGL re-init; on
 * others it just keeps rendering. Tick "Force WebGL" to pin WebGL from the start.
 */
const meta: Meta = { title: 'canvas-react/Graph Reseed' };
export default meta;
type Story = StoryObj;

// ─── Two datasets to swap between, plus an empty one ───────────────────────
const DATA_A: GraphData = {
  nodes: lesMiserables.nodes.map((n) => ({ id: n.id, type: `Group ${n.data.group}` })),
  edges: lesMiserables.edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    type: 'APPEARS_WITH',
  })),
};

// A structurally different graph (a ring) — the "swap one non-empty set for
// another" trigger, distinct from A's topology.
const RING = 14;
const DATA_B: GraphData = {
  nodes: Array.from({ length: RING }, (_, i) => ({ id: `b${i}`, type: 'Ring' })),
  edges: Array.from({ length: RING }, (_, i) => ({
    id: `be${i}`,
    source: `b${i}`,
    target: `b${(i + 1) % RING}`,
    type: 'NEXT',
  })),
};

const EMPTY: GraphData = { nodes: [], edges: [] };

// Config-first force layout: re-runs on every topology change (each re-seed),
// so nodes re-lay-out and the view re-fits after a swap.
const CONFIG: CanvasConfig = { activeLayout: 'force' };

const btn: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: 6,
  border: '1px solid var(--border, #cbd5e1)',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
  cursor: 'pointer',
};

export const GraphReseed: Story = {
  name: 'Graph Reseed',
  render: function Render() {
    const [data, setData] = useState<GraphData>(DATA_A);
    // Default is the engine's WebGPU-first backend; tick to pin WebGL instead.
    // Keyed onto <Canvas> so toggling re-inits the engine with the new preference.
    const [forceWebGL, setForceWebGL] = useState(false);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            padding: 12,
            borderBottom: '1px solid var(--border, #e2e8f0)',
            flexWrap: 'wrap',
          }}
        >
          <button style={btn} onClick={() => setData(DATA_A)}>
            Seed A (Les Mis)
          </button>
          <button style={btn} onClick={() => setData(EMPTY)}>
            Clear (empty)
          </button>
          <button style={btn} onClick={() => setData(DATA_B)}>
            Seed B (ring)
          </button>
          <span style={{ opacity: 0.6, fontSize: 12 }}>
            nodes: {data.nodes.length} · edges: {data.edges.length}
          </span>
          <label style={{ marginLeft: 'auto', fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
            <input
              type="checkbox"
              checked={forceWebGL}
              onChange={(e) => setForceWebGL(e.target.checked)}
            />
            Force WebGL
          </label>
        </div>

        <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
          <Canvas
            key={forceWebGL ? 'webgl' : 'default'}
            preference={forceWebGL ? 'webgl' : undefined}
            autoResize
            config={CONFIG}
            style={{ width: '100%', height: '100%' }}
          >
            <BackgroundLayer id="background" />
            <GraphLayer id="graph" data={data} />
            <DragPanBehaviour id="pan" />
            <WheelZoomBehaviour id="wheel" />
            <D3ForceLayout id="force" targetLayerId="graph" />
          </Canvas>
        </div>
      </div>
    );
  },
};
