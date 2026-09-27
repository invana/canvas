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
import { ControlPanels } from '@invana/canvas-ui';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/Canvas/Basic` — **control panels on the base `<Canvas>`.**
 * A control panel is floating chrome pinned over the canvas, declared as a child
 * exactly like a behaviour. `<ControlPanel>` is headless: it writes a pure-JSON
 * spec into `store.view.definition.controlPanels` and renders nothing.
 * `<ControlPanels/>` (from `@invana/canvas-ui`, the one UI import here) is the
 * projection that draws every spec. A bare canvas has to mount it once.
 * `GraphCanvasApp` mounts it for you.
 *
 * Items name what they do by string, so the panel serialises:
 * - `command` / `toggle` → the canvas's `commands` registry (`camera.zoomIn`,
 *   `camera.fit`, `view.lock`, …). Lock disables `pan`; wheel zoom stays live.
 * - `icon` → the UI kit's icon registry. `widget` → its widget registry
 *   (`zoom-readout` is a live `NN%`).
 * - `children` → a runtime slot. It is drawn, but it isn't persisted.
 *
 * Three placements are shown: a corner anchor (`bottom-right`), exact insets
 * (`{ top: 16, left: 16 }`), and an edge-centre anchor with no card surface
 * (`bottom`).
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/Canvas/Basic' };
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

export const Basic: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />

        {/* Preset anchor: view controls, stacked in a column. */}
        <ControlPanel
          id="view"
          position="bottom-right"
          orientation="vertical"
          items={[
            { type: 'command', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
            { type: 'widget', widget: 'zoom-readout' },
            { type: 'command', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
            { type: 'divider' },
            { type: 'command', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' },
            { type: 'toggle', command: 'view.lock', icon: 'lock-open', activeIcon: 'lock', label: 'Lock view', activeLabel: 'Unlock view' },
          ]}
        />

        {/* Exact insets, with React children (a runtime slot, not persisted). */}
        <ControlPanel id="brand" position={{ top: 16, left: 16 }}>
          <span className="px-2 text-sm font-semibold">Base canvas</span>
        </ControlPanel>

        {/* Edge-centre anchor, bare (no card surface). The only item is static text. */}
        <ControlPanel
          id="hint"
          position="bottom"
          surface={false}
          items={[{ type: 'text', text: 'Drag to pan · scroll to zoom · lock freezes panning' }]}
        />

        {/* The projection that draws every panel spec. Mount it once per canvas. */}
        <ControlPanels />
      </Canvas>
    </div>
  )
};
