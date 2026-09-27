import {
  GraphCanvas,
  ControlPanel,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragNodeBehaviour,
  ClickSelectBehaviour,
  BrushSelectBehaviour,
  LassoSelectBehaviour,
  D3ForceLayout,
  ElkLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import { ControlPanels, EXPLORER_CONTROL_ITEMS, ZOOM_CONTROL_ITEMS } from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * `canvas-react/ControlPanel/GraphCanvas/Explorer` — **the read-only explorer
 * preset.** `EXPLORER_CONTROL_ITEMS` (top) is layout picker · run · stop ·
 * select mode · edge routing · fit · lock. Nothing in it edits the graph, so
 * there's no undo or delete. `ZOOM_CONTROL_ITEMS` sits bottom-right.
 *
 * - **Layout** lists the registered layouts (`force`, `layered`). Picking one
 *   records it as `activeLayout` and runs it.
 * - **Select** switches click / brush / lasso by enabling the matching
 *   behaviour (`brush-select` / `lasso-select`; click needs none).
 * - **Edges** re-routes the `graph` layer's edges.
 *
 * All of these are `GraphCanvas` commands, so the panel needs no providers.
 */
const meta: Meta = { title: 'canvas-react/ControlPanel/GraphCanvas/Explorer' };
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
  }
};

export const Explorer: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100vh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="background" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} />
        <D3ForceLayout id="force" targetLayerId="graph" />
        {/* A second registered layout, so the layout picker has a choice. */}
        <ElkLayout id="layered" targetLayerId="graph" />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="zoom" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        <ClickSelectBehaviour targetLayerId="graph" />
        {/* Off until the Select picker turns one on. */}
        <BrushSelectBehaviour targetLayerId="graph" enabled={false} />
        <LassoSelectBehaviour targetLayerId="graph" enabled={false} />

        <ControlPanel id="explorer" position="top" items={EXPLORER_CONTROL_ITEMS} />
        <ControlPanel id="zoom" position="bottom-right" items={ZOOM_CONTROL_ITEMS} />

        <ControlPanels />
      </GraphCanvas>
    </div>
  )
};
