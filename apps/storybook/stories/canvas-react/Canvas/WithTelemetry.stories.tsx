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
import { otelTelemetry } from '@invana/canvas-telemetry-otel';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/Canvas` — the **base** React root (`<Canvas>`, backed by
 * `@invana/canvas`'s `Canvas`). It provides only `CanvasContext`, so base
 * layer/behaviour wrappers work but there is **no `activeLayout` auto-run** —
 * nodes render at the `position` you give them. Compare with the sibling
 * `canvas-react/GraphCanvas` stories, which auto-run a force layout.
 *
 * **This variant — telemetry on, shipped to a server URL.** `telemetry` here is
 * built by `otelTelemetry({ endpoint })` from `@invana/canvas-telemetry-otel` — the
 * `endpoint` is your **telemetry server URL** (an OTLP/HTTP collector base, e.g.
 * HyperDX; the adapter appends `/v1/{traces,metrics,logs}`). This is how you point
 * the canvas at a real backend. Compare with the sibling `WithoutTelemetry` story
 * (prop omitted → the kernel's no-op path, zero telemetry cost).
 *
 * **How the URL is passed.** A URL never goes on `CanvasTelemetryConfig` directly —
 * you wrap it in a port. `otelTelemetry` does that for you: `endpoint` → OTLP
 * exporters for all three streams. (Metrics-only, dep-free alternative:
 * `telemetry={{ metrics: { meter: createHttpMeter('http://…/metrics') } }}`.)
 *
 * **To verify** (no collector needed to see it work): `console: true` mirrors spans
 * to the browser console — enable **“Verbose”** to see `span …`. The `<DevInfoLayer>`
 * overlay shows live FPS regardless. With a collector running at `TELEMETRY_URL`,
 * traces + metrics + logs land there.
 */
const meta: Meta = { title: 'canvas-react/Canvas/WithTelemetry' };
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

// ── Your telemetry server URL ────────────────────────────────────────────────
// The OTLP/HTTP **base** URL of your collector (OTel collector / HyperDX). The
// adapter appends `/v1/traces`, `/v1/metrics`, `/v1/logs`. Point this at your own
// server; the default local collector port is 4318.
// Build the telemetry config from the URL: `otelTelemetry` wraps it in real OTLP
// exporters for traces + metrics + logs. `console: true` also mirrors spans to the
// browser console so this story is observable without a running collector.
// (For a dep-free, metrics-only sink instead: `createHttpMeter(TELEMETRY_URL)`.)
const TELEMETRY: CanvasTelemetryConfig = otelTelemetry({
  endpoint: 'http://localhost:4318',
  serviceName: 'invana-canvas',
  traces: true,
  metrics: true,
  logging: 'info',
  console: true,
});

export const WithTelemetry: Story = {
  name: 'Canvas (base) + telemetry',
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize telemetry={TELEMETRY}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DevInfoLayer id="dev" corner="top-left" />
      </Canvas>
    </div>
  ),
};
