import {
  Canvas,
  ControlPanel,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  KeyboardCameraInputBehaviour,
  type GraphLayerProps
} from '@invana/canvas-react';
import { ControlPanels, INPUT_CONTROL_ITEMS, ZOOM_CONTROL_ITEMS } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/Canvas/Input` — **turn camera gestures on and off.** `INPUT_CONTROL_ITEMS`
 * binds one `behaviour.toggle` per gesture, by behaviour id: drag-pan (`pan`),
 * wheel zoom (`zoom`) and keyboard camera (`keyboard-camera`, arrow keys /
 * `+` `-`). A toggle is lit while its behaviour is enabled. A behaviour that
 * isn't registered renders disabled.
 *
 * The zoom panel (bottom-right) keeps working while wheel zoom is off: commands
 * move the camera directly, not through the gesture behaviours.
 *
 * Presets are plain `ControlItemSpec[]` from `@invana/canvas-ui`, so the panel
 * saves, exports and imports like any other part of the definition.
 * `<ControlPanels/>` draws every panel spec; a bare canvas mounts it once.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/Canvas/Input' };
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

export const Input: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="background" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="zoom" />
        <KeyboardCameraInputBehaviour id="keyboard-camera" />

        <ControlPanel id="input" position="left" items={INPUT_CONTROL_ITEMS} />
        <ControlPanel id="zoom" position="bottom-right" items={ZOOM_CONTROL_ITEMS} />

        <ControlPanels />
      </Canvas>
    </div>
  )
};
