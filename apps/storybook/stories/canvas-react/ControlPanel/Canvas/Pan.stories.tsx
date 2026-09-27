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
import { ControlPanels, PAN_CONTROL_ITEMS, PAN_PAD_CONTROL_ITEMS } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/Canvas/Pan` — **pan the camera from a panel.** Two presets over the
 * same `camera.pan` / `camera.reset` commands:
 *
 * - `PAN_CONTROL_ITEMS` (top): ← ↑ ↓ → one 80 px step each, then reset. Each
 *   arrow reveals what lies that way, so the content moves the other way.
 * - `PAN_PAD_CONTROL_ITEMS` (bottom-right): the same moves as one 3×3 pad
 *   widget, reset in the centre. Its `options.step` sets the step.
 *
 * Reset puts zoom back to 100% with the world origin (the hub) centred.
 *
 * Presets are plain `ControlItemSpec[]` from `@invana/canvas-ui`, so the panel
 * saves, exports and imports like any other part of the definition.
 * `<ControlPanels/>` draws every panel spec; a bare canvas mounts it once.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/Canvas/Pan' };
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

export const Pan: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="background" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="zoom" />

        <ControlPanel id="pan" position="top" items={PAN_CONTROL_ITEMS} />
        <ControlPanel id="pan-pad" position="bottom-right" items={PAN_PAD_CONTROL_ITEMS} />

        <ControlPanels />
      </Canvas>
    </div>
  )
};
