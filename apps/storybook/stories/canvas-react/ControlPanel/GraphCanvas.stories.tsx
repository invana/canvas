import {
  GraphCanvas,
  ControlPanel,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  D3ForceLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import { ControlPanels } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/GraphCanvas` — **control panels on `<GraphCanvas>`,
 * declared two ways.**
 *
 * - **As config.** `config.controlPanels` is plain JSON (the layout panel on
 *   the left). That is what a saved visualisation carries, and what the Studio
 *   will edit. A spec replaces the whole panel, and `null` removes it.
 * - **As a child.** `<ControlPanel>` (the view panel, bottom-right) writes the
 *   same kind of spec on mount and removes it on unmount.
 *
 * Both land in `store.view.definition.controlPanels`, and `<ControlPanels/>`
 * draws both the same way. The layout panel drives the `layout.run` /
 * `layout.stop` commands. Stop is enabled only while the force simulation is
 * running, and so is its button. `view.lock` targets `pan` + `drag-node` by
 * default, so locking freezes both panning and node drag.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/GraphCanvas' };
export default meta;
type Story = StoryObj;

// No positions: <GraphCanvas> auto-runs `config.activeLayout`.
const DATA: GraphData = {
  nodes: [
    { id: 'hub', type: 'Hub' },
    { id: 'a', type: 'Leaf' },
    { id: 'b', type: 'Leaf' },
    { id: 'c', type: 'Leaf' },
    { id: 'd', type: 'Leaf' },
    { id: 'e', type: 'Leaf' },
    { id: 'f', type: 'Leaf' },
    { id: 'g', type: 'Leaf' },
  ],
  edges: [
    { id: 'e-a', source: 'hub', target: 'a', type: 'LINK' },
    { id: 'e-b', source: 'hub', target: 'b', type: 'LINK' },
    { id: 'e-c', source: 'hub', target: 'c', type: 'LINK' },
    { id: 'e-d', source: 'hub', target: 'd', type: 'LINK' },
    { id: 'e-e', source: 'hub', target: 'e', type: 'LINK' },
    { id: 'f-a', source: 'a', target: 'f', type: 'LINK' },
    { id: 'g-c', source: 'c', target: 'g', type: 'LINK' },
    { id: 'ring-1', source: 'a', target: 'b', type: 'NEXT' },
    { id: 'ring-2', source: 'b', target: 'c', type: 'NEXT' },
    { id: 'ring-3', source: 'd', target: 'e', type: 'NEXT' },
  ]
};

const NODE: GraphLayerProps['node'] = { style: { shape: { kind: 'circle', radius: 16 }, bgFill: 0x34d399 } };

const CONFIG: CanvasConfig = {
  activeLayout: 'force',
  layouts: {
    force: {
      charge: { strength: -220 },
      link: { distance: 80 },
      collide: { radius: 22 },
      animate: true
    }
  },
  // A panel declared as data. It round-trips through export / import unchanged.
  controlPanels: {
    layout: {
      kind: 'control-panel',
      position: 'left',
      items: [
        { type: 'command', command: 'layout.run', icon: 'play', label: 'Re-run layout' },
        { type: 'command', command: 'layout.stop', icon: 'stop', label: 'Stop layout' },
      ]
    }
  }
};

export const Basic: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <D3ForceLayout id="force" targetLayerId="graph" />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />

        {/* A panel declared as a child. */}
        <ControlPanel
          id="view"
          position="bottom-right"
          offset={{ x: 16, y: 16 }}
          items={[
            { type: 'command', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
            { type: 'widget', widget: 'zoom-readout' },
            { type: 'command', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
            { type: 'divider' },
            { type: 'command', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' },
            { type: 'toggle', command: 'view.lock', icon: 'lock-open', activeIcon: 'lock', label: 'Lock view', activeLabel: 'Unlock view' },
          ]}
        />

        <ControlPanels />
      </GraphCanvas>
    </div>
  )
};
