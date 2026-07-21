import {
  Canvas,
  GraphLayer,
  BackgroundLayer,
  MiniMapLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  HoverActivateBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  type GraphLayerProps,
} from '@invana/canvas-react';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/Canvas` — **interactive base canvas.** Same no-layout root as
 * `Basic` (nodes render at their explicit `position`), now showing off the
 * **interaction behaviours** on top of pan + zoom:
 *
 * - `HoverActivateBehaviour` — hover a node to activate it (and its edges).
 * - `ClickSelectBehaviour` — click to select (shift/ctrl for multi-select).
 * - `DragNodeBehaviour` — drag a node to reposition it live.
 * - `MiniMapLayer` — an overview inset mirroring the `graph` layer.
 *
 * Every behaviour is registered **explicitly** and targets the `graph` layer by
 * an explicit `targetLayerId` (never inferred). No `telemetry` prop → the
 * kernel's no-op path.
 */
const meta: Meta = { title: 'canvas-react/Canvas/Advanced' };
export default meta;
type Story = StoryObj;

// Explicit positions — the base <Canvas> runs no layout. A slightly larger scene
// (two hubs + leaves) so hover-activate, multi-select and drag are worth trying.
const DATA: GraphData = {
  nodes: [
    { id: 'hub-1', type: 'Hub', position: { x: -180, y: 0 } },
    { id: 'hub-2', type: 'Hub', position: { x: 180, y: 0 } },
    { id: 'a', type: 'Leaf', position: { x: -320, y: -120 } },
    { id: 'b', type: 'Leaf', position: { x: -320, y: 120 } },
    { id: 'c', type: 'Leaf', position: { x: -60, y: -160 } },
    { id: 'd', type: 'Leaf', position: { x: -60, y: 160 } },
    { id: 'e', type: 'Leaf', position: { x: 60, y: -160 } },
    { id: 'f', type: 'Leaf', position: { x: 60, y: 160 } },
    { id: 'g', type: 'Leaf', position: { x: 320, y: -120 } },
    { id: 'h', type: 'Leaf', position: { x: 320, y: 120 } },
  ],
  edges: [
    { id: 'e-1a', source: 'hub-1', target: 'a', type: 'LINK' },
    { id: 'e-1b', source: 'hub-1', target: 'b', type: 'LINK' },
    { id: 'e-1c', source: 'hub-1', target: 'c', type: 'LINK' },
    { id: 'e-1d', source: 'hub-1', target: 'd', type: 'LINK' },
    { id: 'e-2e', source: 'hub-2', target: 'e', type: 'LINK' },
    { id: 'e-2f', source: 'hub-2', target: 'f', type: 'LINK' },
    { id: 'e-2g', source: 'hub-2', target: 'g', type: 'LINK' },
    { id: 'e-2h', source: 'hub-2', target: 'h', type: 'LINK' },
    { id: 'e-bridge', source: 'hub-1', target: 'hub-2', type: 'NEXT' },
  ],
};

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

export const Advanced: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        {/* Camera */}
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        {/* Node interaction — each targets the `graph` layer explicitly. */}
        <HoverActivateBehaviour id="hover" targetLayerId="graph" degree={1} />
        <ClickSelectBehaviour id="select" targetLayerId="graph" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        {/* Overview inset mirroring the `graph` layer. `backgroundLayerId` makes
            the minimap paint its backdrop with the `bg` layer's resolved colour,
            so it matches the light canvas instead of the dark default. */}
        <MiniMapLayer
          id="minimap"
          graphLayerId="graph"
          backgroundLayerId="bg"
          borderColor={0xcbd5e1}
        />
      </Canvas>
    </div>
  ),
};
