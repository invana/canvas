import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  D3ForceLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig, CanvasTelemetryConfig } from '@invana/canvas';
import { otelTelemetry } from '@invana/canvas-telemetry-otel';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/GraphCanvas` — the **graph** React root (`<GraphCanvas>`, backed
 * by `@invana/graph`'s `GraphCanvas`, a strict `Canvas` superset). It provides
 * **both** `CanvasContext` *and* `GraphCanvasContext`, and **auto-runs
 * `config.activeLayout`** — so with no positions in the data, the `<D3ForceLayout>`
 * places the nodes for you (the base `<Canvas>` stories, by contrast, need explicit
 * positions). `GraphCanvasApp` is built on this same root.
 *
 * **This variant — telemetry on, shipped to a server URL.** `telemetry` is built by
 * `otelTelemetry({ endpoint })` from `@invana/canvas-telemetry-otel` — the `endpoint`
 * is your **telemetry server URL** (an OTLP/HTTP collector base, e.g. HyperDX; the
 * adapter appends `/v1/{traces,metrics,logs}`). Compare with the sibling
 * `Basic` story (prop omitted → the kernel's no-op path).
 *
 * **How the URL is passed.** A URL never goes on `CanvasTelemetryConfig` directly —
 * you wrap it in a port; `otelTelemetry` turns `endpoint` into OTLP exporters for
 * all three streams. (Metrics-only, dep-free alternative:
 * `telemetry={{ metrics: { meter: createHttpMeter('http://…/metrics') } }}`.)
 *
 * **To verify** (no collector needed): `console: true` mirrors spans to the console
 * — enable **“Verbose”** to see `span …` (including the **layout** gesture span as
 * force settles). With a collector at `TELEMETRY_URL`, traces + metrics + logs
 * land there.
 */
const meta: Meta = { title: 'canvas-react/GraphCanvas/WithTelemetry' };
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
  ]
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
    labelOffsetY: 6
  }
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
      animate: false
    }
  }
};

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
  console: true
});

export const WithTelemetry: Story = {
  name: 'WithTelemetry',
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <GraphCanvas autoResize config={CONFIG} telemetry={TELEMETRY}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        {/* GraphLayer must be declared before the layout that targets it. */}
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <D3ForceLayout id="force" targetLayerId="graph" />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
      </GraphCanvas>
    </div>
  )
};
