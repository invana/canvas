import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  D3ForceLayout,
  type GraphLayerProps,
} from '@invana/canvas-react';
import type { CanvasConfig, CanvasTelemetryConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/GraphCanvas` — the **graph** React root (`<GraphCanvas>`, backed
 * by `@invana/graph`'s `GraphCanvas`, a strict `Canvas` superset). It provides
 * **both** `CanvasContext` *and* `GraphCanvasContext`, and **auto-runs
 * `config.activeLayout`** — so with no positions in the data, the `<D3ForceLayout>`
 * places the nodes for you (the base `<Canvas>` story, by contrast, needs explicit
 * positions). `GraphCanvasApp` is built on this same root.
 *
 * **Telemetry (two variants).** `WithTelemetry` passes `telemetry={{ traces,
 * metrics, logging }}`; `WithoutTelemetry` omits it (same scene, streams off —
 * the kernel's no-op path). Identical wiring to the base `Canvas` story — the
 * streams live in the shared kernel, so both roots behave the same. In the
 * `WithTelemetry` variant, with the console adapters:
 * - **Logging** (`console.info`, `[canvas]` prefix) shows by default.
 * - **Traces** + **Metrics** use `console.debug` → enable **“Verbose”** to see
 *   `span …` (mutation + per-gesture spans — and here also the **layout** gesture
 *   span as force settles) and `metric canvas.frame.…`.
 * - **On-screen metrics**: the `<DevInfoLayer>` overlay (live FPS + phases).
 *
 * For a real backend swap `true` for an injected port, e.g.
 * `otelTelemetry({ traces: true, metrics: true, logging: 'info' })` (OTLP → HyperDX).
 */
const meta: Meta = { title: 'canvas-react/GraphCanvas' };
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

// All three telemetry streams via the dep-free console adapters.
const TELEMETRY: CanvasTelemetryConfig = { traces: true, metrics: true, logging: 'info' };

// One scene, parameterised by the telemetry prop — the only thing that differs
// between the two variants. `undefined` = no telemetry (the kernel's no-op path).
function Scene({ telemetry }: { telemetry?: CanvasTelemetryConfig }) {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <GraphCanvas autoResize config={CONFIG} telemetry={telemetry}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        {/* GraphLayer must be declared before the layout that targets it. */}
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <D3ForceLayout id="force" targetLayerId="graph" />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DevInfoLayer id="dev" corner="top-left" />
      </GraphCanvas>
    </div>
  );
}

export const WithTelemetry: Story = {
  name: 'GraphCanvas + telemetry',
  render: () => <Scene telemetry={TELEMETRY} />,
};

export const WithoutTelemetry: Story = {
  name: 'GraphCanvas · no telemetry',
  render: () => <Scene />,
};
