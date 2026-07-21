import {
  Canvas,
  GraphLayer,
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps,
} from '@invana/canvas-react';
import type { CanvasTelemetryConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/Canvas` — the **base** React root (`<Canvas>`, backed by
 * `@invana/canvas`'s `Canvas`). It provides only `CanvasContext`, so base
 * layer/behaviour wrappers work but there is **no `activeLayout` auto-run** —
 * nodes render at the `position` you give them. Compare with the sibling
 * `canvas-react/GraphCanvas` story, which auto-runs a force layout.
 *
 * **Telemetry (two variants).** `WithTelemetry` passes `telemetry={{ traces,
 * metrics, logging }}`; `WithoutTelemetry` omits the prop entirely — same scene,
 * so you can compare the console/overhead with the streams on vs. off (off = the
 * kernel's no-op path, zero telemetry cost). The `telemetry` config wires all
 * three kernel streams through `new Canvas({ telemetry })`, here with the dep-free
 * **console** adapters (no backend needed). To verify the `WithTelemetry` variant:
 * - **Logging** (`console.info`) shows in the console **by default** — mount /
 *   lifecycle lines prefixed `[canvas]`.
 * - **Traces** + **Metrics** use `console.debug` — enable **“Verbose”** in the
 *   devtools console to see `span …` (view-mutation + per-gesture spans; pan /
 *   zoom to trigger) and `metric canvas.frame.…={…}` (the per-frame speed trace;
 *   high volume — enable briefly).
 * - **Metrics on-screen**: the `<DevInfoLayer>` overlay shows live FPS + the CPU
 *   phase breakdown (`camera` / `dataFlush` / `layers`) — the same numbers the
 *   metrics stream records, without the console noise.
 *
 * Swap `true` for an injected port to ship to a real backend, e.g.
 * `otelTelemetry({ metrics: true })` (OTLP → HyperDX) or
 * `{ metrics: { meter: createHttpMeter('http://localhost:4319/metrics') } }`.
 */
const meta: Meta = { title: 'canvas-react/Canvas' };
export default meta;
type Story = StoryObj;

// ── How you pass the data: plain `{ nodes, edges }` JSON ─────────────────────
// This is exactly what you'd `import from './graph.json'` or `fetch()`. The base
// <Canvas> runs no layout, so each node carries an explicit `position` and the
// canvas renders it there. (In the GraphCanvas story the positions are omitted
// and the force layout computes them.)
const DATA: GraphData = {
  nodes: [
    { id: 'hub', type: 'Hub', position: { x: 0, y: 0 } },
    { id: 'a', type: 'Leaf', position: { x: -150, y: -100 } },
    { id: 'b', type: 'Leaf', position: { x: 150, y: -100 } },
    { id: 'c', type: 'Leaf', position: { x: -150, y: 100 } },
    { id: 'd', type: 'Leaf', position: { x: 150, y: 100 } },
  ],
  edges: [
    { id: 'e-a', source: 'hub', target: 'a', type: 'LINK' },
    { id: 'e-b', source: 'hub', target: 'b', type: 'LINK' },
    { id: 'e-c', source: 'hub', target: 'c', type: 'LINK' },
    { id: 'e-d', source: 'hub', target: 'd', type: 'LINK' },
  ],
};

// Shared node / edge styling (the layer template — applied to every item).
const NODE: GraphLayerProps['node'] = {
  style: {
    shape: { kind: 'circle', radius: 16 },
    bgFill: 0x60a5fa,
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

// All three telemetry streams via the dep-free console adapters.
const TELEMETRY: CanvasTelemetryConfig = { traces: true, metrics: true, logging: 'info' };

// One scene, parameterised by the telemetry prop — the only thing that differs
// between the two variants. `undefined` = no telemetry (the kernel's no-op path).
function Scene({ telemetry }: { telemetry?: CanvasTelemetryConfig }) {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize telemetry={telemetry}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DevInfoLayer id="dev" corner="top-left" />
      </Canvas>
    </div>
  );
}

export const WithTelemetry: Story = {
  name: 'Canvas (base) + telemetry',
  render: () => <Scene telemetry={TELEMETRY} />,
};

export const WithoutTelemetry: Story = {
  name: 'Canvas (base) · no telemetry',
  render: () => <Scene />,
};
