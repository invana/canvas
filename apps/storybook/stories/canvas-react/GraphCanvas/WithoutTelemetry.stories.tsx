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
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/GraphCanvas` with **telemetry off** — the `telemetry` prop is
 * omitted entirely, so the shared kernel attaches **zero** streams (no console
 * output, no telemetry cost). Same scene as the sibling `WithTelemetry` story; the
 * only difference is the missing prop — enabling telemetry is purely opt-in (there
 * is no env/dev auto-toggle).
 *
 * The `<GraphCanvas>` still auto-runs `config.activeLayout` (the force layout) and
 * the `<DevInfoLayer>` overlay still shows live FPS — both are independent of the
 * telemetry config.
 */
const meta: Meta = { title: 'canvas-react/GraphCanvas/WithoutTelemetry' };
export default meta;
type Story = StoryObj;

// Plain `{ nodes, edges }` JSON, NO positions — <GraphCanvas> auto-runs the force
// layout (config below) to compute every node's position from the topology alone.
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

// `activeLayout` is the field <GraphCanvas> auto-runs. The id 'force' matches the
// <D3ForceLayout id="force"> registered below.
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

export const WithoutTelemetry: Story = {
  name: 'GraphCanvas · no telemetry',
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
        <DevInfoLayer id="dev" corner="top-left" />
      </GraphCanvas>
    </div>
  ),
};
