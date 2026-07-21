import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  D3ForceLayout,
  type GraphLayerProps,
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/GraphCanvas` — **the graph root, minimal.** `<GraphCanvas>`
 * (backed by `@invana/graph`'s `GraphCanvas`, a strict `Canvas` superset)
 * provides **both** `CanvasContext` *and* `GraphCanvasContext`, and **auto-runs
 * `config.activeLayout`** — so the data carries **no positions** and the
 * `<D3ForceLayout>` places every node for you (the base `<Canvas>` stories, by
 * contrast, need explicit positions).
 *
 * This is the smallest useful graph scene: a force layout over a dotted
 * background with pan + zoom. No `telemetry` prop → the kernel's no-op path.
 * See `WithTelemetry` to stream to a collector and
 * `Advanced` for hover / select / drag-node / minimap + tuned layout on top.
 */
const meta: Meta = { title: 'canvas-react/GraphCanvas/Basic' };
export default meta;
type Story = StoryObj;

// ── How you pass the data: plain `{ nodes, edges }` JSON, NO positions ───────
// <GraphCanvas> auto-runs `config.activeLayout` (below), so the force layout
// computes every node's position — you just describe the topology.
const DATA: GraphData = {
  nodes: [
    { id: 'hub', type: 'Hub' },
    { id: 'a', type: 'Leaf' },
    { id: 'b', type: 'Leaf' },
    { id: 'c', type: 'Leaf' },
    { id: 'd', type: 'Leaf' },
    { id: 'e', type: 'Leaf' },
  ],
  edges: [
    { id: 'e-a', source: 'hub', target: 'a', type: 'LINK' },
    { id: 'e-b', source: 'hub', target: 'b', type: 'LINK' },
    { id: 'e-c', source: 'hub', target: 'c', type: 'LINK' },
    { id: 'e-d', source: 'hub', target: 'd', type: 'LINK' },
    { id: 'e-e', source: 'hub', target: 'e', type: 'LINK' },
    { id: 'ring-1', source: 'a', target: 'b', type: 'NEXT' },
    { id: 'ring-2', source: 'b', target: 'c', type: 'NEXT' },
    { id: 'ring-3', source: 'c', target: 'd', type: 'NEXT' },
    { id: 'ring-4', source: 'd', target: 'e', type: 'NEXT' },
    { id: 'ring-5', source: 'e', target: 'a', type: 'NEXT' },
  ],
};

const NODE: GraphLayerProps['node'] = {
  style: {
    shape: { kind: 'circle', radius: 16 },
    bgFill: 0x34d399,
    bgStrokeColor: 0xffffff,
    bgStrokeWidth: 2,
    labelText: (n) => n.id,
    labelColor: 0x1e293b,
    labelFontSize: 11,
    labelPlacement: 'bottom',
    labelOffsetY: 6,
  },
};
const EDGE: GraphLayerProps['edge'] = { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5 } };

// `activeLayout` is the field <GraphCanvas> auto-runs (a base <Canvas> ignores it).
// The id 'force' matches the <D3ForceLayout id="force"> registered below.
const CONFIG: CanvasConfig = {
  activeLayout: 'force',
  layouts: {
    force: {
      charge: { strength: -220 },
      link: { distance: 80 },
      collide: { radius: 22 },
      animate: false,
    },
  },
};

export const Basic: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      {/* No `telemetry` prop → no streams attached (the kernel's no-op path). */}
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        {/* GraphLayer must be declared before the layout that targets it. */}
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <D3ForceLayout id="force" targetLayerId="graph" />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
      </GraphCanvas>
    </div>
  ),
};
