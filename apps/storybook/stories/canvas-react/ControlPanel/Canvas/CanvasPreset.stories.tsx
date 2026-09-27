import {
  Canvas,
  ControlPanel,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  CanvasThemeSync,
  type GraphLayerProps
} from '@invana/canvas-react';
import { ControlPanels, CANVAS_CONTROL_ITEMS, THEME_CONTROL_ITEMS } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/Canvas/CanvasPreset` — **the plain-canvas preset, plus the theme toggle.**
 *
 * - `CANVAS_CONTROL_ITEMS` (bottom): zoom in / out · fit · reset · lock · grid.
 *   Engine commands only, so it works on any canvas. Grid toggles the
 *   `background` layer between dots and a solid fill.
 * - `THEME_CONTROL_ITEMS` (top-right): flips the host light / dark theme.
 *   `theme.toggle` is registered by `<CanvasThemeSync/>` (mounted here), which
 *   also pushes the host theme into the engine's `ThemeBehaviour`.
 *
 * Presets are plain `ControlItemSpec[]` from `@invana/canvas-ui`, so the panel
 * saves, exports and imports like any other part of the definition.
 * `<ControlPanels/>` draws every panel spec; a bare canvas mounts it once.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/Canvas/CanvasPreset' };
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

export const CanvasPreset: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="background" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="zoom" />
        <CanvasThemeSync />

        <ControlPanel id="canvas" position="bottom" items={CANVAS_CONTROL_ITEMS} />
        <ControlPanel id="theme" position="top-right" items={THEME_CONTROL_ITEMS} />

        <ControlPanels />
      </Canvas>
    </div>
  )
};
