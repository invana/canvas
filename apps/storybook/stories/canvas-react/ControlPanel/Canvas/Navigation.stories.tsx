import {
  Canvas,
  ControlPanel,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type GraphLayerProps
} from '@invana/canvas-react';
import { ControlPanels, NAVIGATION_CONTROL_ITEMS } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/Canvas/Navigation` — **every way to move the camera, in one panel.**
 * `NAVIGATION_CONTROL_ITEMS` is the pan pad, zoom in / readout / out, and fit to
 * content. Stacked on the right edge.
 *
 * Presets are plain `ControlItemSpec[]` from `@invana/canvas-ui`, so the panel
 * saves, exports and imports like any other part of the definition.
 * `<ControlPanels/>` draws every panel spec; a bare canvas mounts it once.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/Canvas/Navigation' };
export default meta;
type Story = StoryObj;

// The base <Canvas> runs no layout, so every node carries its position.
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
  ]
};

const NODE: GraphLayerProps['node'] = { style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x60a5fa } };

export const Navigation: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="background" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="zoom" />

        <ControlPanel id="navigation" position="right" items={NAVIGATION_CONTROL_ITEMS} />

        <ControlPanels />
      </Canvas>
    </div>
  )
};
