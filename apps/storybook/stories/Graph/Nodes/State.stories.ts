import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Nodes/State' };
export default meta;
type Story = StoryObj;

/**
 * Visual catalogue of the canonical node *states* in `@invana/graph`.
 *
 * `GraphLayer` ships with `DEFAULT_NODE_STATE_CONFIGS` auto-registered, so
 * this story does not register any state configs. Label content is hoisted
 * into `node.style.labelText` (resolver — reads per-tile `data` for the
 * text), and each tile's state is supplied directly via the data-driven
 * `states` field on `NodeData` — no imperative `setNodeState` calls.
 *
 * The nodes are a flat literal array (no map / loop) so the data shape is
 * visible at a glance in Storybook's "Show code" tab.
 *
 * v3 G6-aligned shape:
 *   - `style.shape` — discriminated NodeShapeOptions
 *   - `style.bgFill` / `style.bgStrokeColor` etc. — paint
 *   - `style.labelText` / `style.labelColor` etc. — label (flat-prefixed)
 *   - `states: [...]` — active state list (plural)
 *   - `data` — pure user payload (no longer mixed with render hints)
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
    const nodes: NodeData<TileData>[] = [
      {
        id: 'n-default',
        position: { x: -220, y: -200 },
        data: { state: 'default', note: 'resting appearance — no state active' },
      },
      {
        id: 'n-hover',
        position: { x: 0, y: -200 },
        data: { state: 'hover', note: 'pointer is over the node' },
        states: ['hover'],
      },
      {
        id: 'n-selected',
        position: { x: 220, y: -200 },
        data: { state: 'selected', note: 'click-selected (sticky)' },
        states: ['selected'],
      },
      {
        id: 'n-active',
        position: { x: -220, y: 0 },
        data: { state: 'active', note: 'directly-hovered focal node' },
        states: ['active'],
      },
      {
        id: 'n-highlighted',
        position: { x: 0, y: 0 },
        data: { state: 'highlighted', note: '1-hop neighbour of the focal' },
        states: ['highlighted'],
      },
      {
        id: 'n-focused',
        position: { x: 220, y: 0 },
        data: { state: 'focused', note: 'keyboard-focus ring' },
        states: ['focused'],
      },
      {
        id: 'n-dimmed',
        position: { x: -220, y: 200 },
        data: { state: 'dimmed', note: 'de-emphasised by another active set' },
        states: ['dimmed'],
      },
      {
        id: 'n-disabled',
        position: { x: 0, y: 200 },
        data: { state: 'disabled', note: 'not interactive' },
        states: ['disabled'],
      },
      {
        id: 'n-error',
        position: { x: 220, y: 200 },
        data: { state: 'error', note: 'invalid — red ring' },
        states: ['error'],
      },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        // Layer-wide v3 template — every tile renders against these unless it
        // overrides a field in its own `style` or via an active state.
        // `labelText` is a resolver that pulls per-tile content from `data`.
        // Canonical state configs are auto-registered (no setNodeStateConfig
        // calls needed). Pass `useDefaultStateConfigs: false` to opt out.
        node: {
          style: {
            shape: { kind: 'circle', radius: 36 },
            bgFill: 0x3b82f6,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 1,
            labelText: (n: GraphNode) => {
              const tile = n.data as TileData | undefined;
              return tile ? `${tile.state}\n${tile.note}` : '';
            },
            labelColor: 0xefefef,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelPlacement: 'bottom',
            labelOffsetY: 8,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 60);
  },
};
