import {
  Canvas,
  GraphLayer,
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps,
} from '@invana/canvas-react';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/Canvas` with **telemetry off** — the `telemetry` prop is omitted
 * entirely, so `new Canvas()` takes the kernel's no-op path and attaches **zero**
 * streams (no console output, no telemetry cost). Same scene as the sibling
 * `WithTelemetry` story; the only difference is the missing prop — enabling
 * telemetry is purely opt-in (there is no env/dev auto-toggle).
 *
 * The `<DevInfoLayer>` overlay still shows live FPS — it reads the engine's own
 * frame timing, independent of the telemetry config.
 */
const meta: Meta = { title: 'canvas-react/Canvas/WithoutTelemetry' };
export default meta;
type Story = StoryObj;

// Plain `{ nodes, edges }` JSON with explicit positions — the base <Canvas> runs
// no layout, so it renders each node where you place it.
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

export const WithoutTelemetry: Story = {
  name: 'Canvas (base) · no telemetry',
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      {/* No `telemetry` prop → no streams attached (the kernel's no-op path). */}
      <Canvas autoResize>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DevInfoLayer id="dev" corner="top-left" />
      </Canvas>
    </div>
  ),
};
