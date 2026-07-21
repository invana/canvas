import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  DevInfoLayer,
  MiniMapLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  HoverActivateBehaviour,
  ClickSelectBehaviour,
  DragNodeBehaviour,
  D3ForceLayout,
  type GraphLayerProps,
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/GraphCanvas` — **the full graph showcase.** The graph root
 * auto-runs `config.activeLayout`, so this animated `<D3ForceLayout>` lays out a
 * larger, position-less graph, and the layout's **settings live in `config`** —
 * tune `charge` / `link.distance` / `collide.radius` and flip `animate` there.
 *
 * On top of the layout, the interaction behaviours:
 * - `HoverActivateBehaviour` (`degree={1}` lights up 1st-degree neighbours)
 * - `ClickSelectBehaviour` (click / shift-click multi-select)
 * - `DragNodeBehaviour` (drag a node — the sim re-settles around it)
 * - `MiniMapLayer` overview inset
 *
 * Each behaviour is registered explicitly with an explicit `targetLayerId`. See
 * `Basic` for the minimal version and `WithTelemetry` to stream to a collector.
 */
const meta: Meta = { title: 'canvas-react/GraphCanvas/Advanced' };
export default meta;
type Story = StoryObj;

// No positions — the force layout computes them. A denser graph (3 hubs + leaves
// + a connecting ring) so the layout, hover-activate and drag are worth trying.
const DATA: GraphData = {
  nodes: [
    { id: 'hub-1', type: 'Hub' },
    { id: 'hub-2', type: 'Hub' },
    { id: 'hub-3', type: 'Hub' },
    { id: 'a', type: 'Leaf' },
    { id: 'b', type: 'Leaf' },
    { id: 'c', type: 'Leaf' },
    { id: 'd', type: 'Leaf' },
    { id: 'e', type: 'Leaf' },
    { id: 'f', type: 'Leaf' },
    { id: 'g', type: 'Leaf' },
    { id: 'h', type: 'Leaf' },
    { id: 'i', type: 'Leaf' },
  ],
  edges: [
    { id: 'e-1a', source: 'hub-1', target: 'a', type: 'LINK' },
    { id: 'e-1b', source: 'hub-1', target: 'b', type: 'LINK' },
    { id: 'e-1c', source: 'hub-1', target: 'c', type: 'LINK' },
    { id: 'e-2d', source: 'hub-2', target: 'd', type: 'LINK' },
    { id: 'e-2e', source: 'hub-2', target: 'e', type: 'LINK' },
    { id: 'e-2f', source: 'hub-2', target: 'f', type: 'LINK' },
    { id: 'e-3g', source: 'hub-3', target: 'g', type: 'LINK' },
    { id: 'e-3h', source: 'hub-3', target: 'h', type: 'LINK' },
    { id: 'e-3i', source: 'hub-3', target: 'i', type: 'LINK' },
    { id: 'ring-1', source: 'hub-1', target: 'hub-2', type: 'NEXT' },
    { id: 'ring-2', source: 'hub-2', target: 'hub-3', type: 'NEXT' },
    { id: 'ring-3', source: 'hub-3', target: 'hub-1', type: 'NEXT' },
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

// The layout's settings live here — <GraphCanvas> auto-runs `activeLayout`, and
// `layouts.force` is the tuning surface (charge / link distance / collide / animate).
const CONFIG: CanvasConfig = {
  activeLayout: 'force',
  layouts: {
    force: {
      charge: { strength: -320 },
      link: { distance: 90 },
      collide: { radius: 24 },
      animate: true,
    },
  },
};

export const Advanced: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" backgroundColor="#f8fafc" color="#cbd5e1" />
        {/* GraphLayer must be declared before the layout that targets it. */}
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <D3ForceLayout id="force" targetLayerId="graph" />
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
        <DevInfoLayer id="dev" corner="top-left" />
      </GraphCanvas>
    </div>
  ),
};
