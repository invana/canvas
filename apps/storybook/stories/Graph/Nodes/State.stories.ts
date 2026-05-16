import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Nodes/State' };
export default meta;
type Story = StoryObj;

/**
 * Visual catalogue of the canonical node *states* in `@invana/graph`.
 *
 * `GraphLayer` ships with `DEFAULT_NODE_STATE_CONFIGS` auto-registered, so
 * this story does not register any state configs. Label styling is
 * hoisted into `nodeDefaults.label` (resolver — reads per-node `data` for
 * the text), and each tile's state is supplied directly via the
 * data-driven `state` field on `GraphNode` — no imperative
 * `setNodeState` calls.
 *
 * The nodes are a flat literal array (no map / loop) so the data shape is
 * visible at a glance in Storybook's "Show code" tab.
 */
export const State: Story = {
  render: () => createContainer({ id: 'graph-node-state' }),

  play: async ({ canvasElement }) => {

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-state')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
      readonly note: string;
    }

    // 3×3 grid. Cell pitch: 220 × 200. Origin at (0, 0).
    const nodes: GraphNode<TileData>[] = [
      {
        id: 'n-default',
        position: { x: -220, y: -200 },
        data: { state: 'default', note: 'resting appearance — no state active' },
      },
      {
        id: 'n-hover',
        position: { x: 0, y: -200 },
        data: { state: 'hover', note: 'pointer is over the node' },
        state: ['hover'],
      },
      {
        id: 'n-selected',
        position: { x: 220, y: -200 },
        data: { state: 'selected', note: 'click-selected (sticky)' },
        state: ['selected'],
      },
      {
        id: 'n-active',
        position: { x: -220, y: 0 },
        data: { state: 'active', note: 'directly-hovered focal node' },
        state: ['active'],
      },
      {
        id: 'n-highlighted',
        position: { x: 0, y: 0 },
        data: { state: 'highlighted', note: '1-hop neighbour of the focal' },
        state: ['highlighted'],
      },
      {
        id: 'n-focused',
        position: { x: 220, y: 0 },
        data: { state: 'focused', note: 'keyboard-focus ring' },
        state: ['focused'],
      },
      {
        id: 'n-dimmed',
        position: { x: -220, y: 200 },
        data: { state: 'dimmed', note: 'de-emphasised by another active set' },
        state: ['dimmed'],
      },
      {
        id: 'n-disabled',
        position: { x: 0, y: 200 },
        data: { state: 'disabled', note: 'not interactive' },
        state: ['disabled'],
      },
      {
        id: 'n-error',
        position: { x: 220, y: 200 },
        data: { state: 'error', note: 'invalid — red ring' },
        state: ['error'],
      },
    ];


    const graph = new GraphLayer({
      id: 'graph',
      options: {
        // Layer-wide defaults — every tile renders against these unless it
        // overrides a field in its own `data` or via an active state.
        // `label` is a resolver that pulls per-tile text from `data`.
        // Canonical state configs are auto-registered (no setNodeStateConfig
        // calls needed). Pass `useDefaultStateConfigs: false` to opt out.
        nodeDefaults: {
          shape: 'circle',
          size: 72,
          fill: 0x3b82f6,
          stroke: 0xffffff,
          strokeWidth: 1,
          label: (n) => {
            const tile = n.data as TileData;
            return {
              content: {
                kind: 'text',
                text: `${tile.state}\n${tile.note}`,
                fontSize: 12,
                fontWeight: 600,
                fill: 0xefefef,
                align: 'center',
                lineHeight: 16,
              },
              placement: 'bottom',
              offset: { y: 8 },
            };
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 60);
  },
};
