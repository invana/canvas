import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/States/PerNodeOverride' };
export default meta;
type Story = StoryObj;

/**
 * Validates per-node `state` overlay catalogue (singular) on `NodeData`.
 *
 * Three tiles, all with `states: ['hover']` so the built-in hover config
 * tries to apply. Each tile overrides `hover` differently via its own
 * `state.hover` — proving the per-node patch wins over the layer's
 * canonical config.
 *
 * - left: no override → built-in hover (white stroke).
 * - middle: orange ring on hover.
 * - right: red ring + scaled stroke + fill on hover.
 */
export const PerNodeOverride: Story = {
  render: () => createContainer({ id: 'graph-states-per-node-override' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-per-node-override',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const nodes: NodeData[] = [
      {
        id: 'default',
        position: { x: -180, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: 'built-in hover',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        states: ['hover'],
      },
      {
        id: 'orange',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: 'override → orange',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        state: {
          hover: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
        },
        states: ['hover'],
      },
      {
        id: 'red',
        position: { x: 180, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: 'override → red',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        state: {
          hover: { bgStrokeColor: 0xef4444, bgStrokeWidth: 6, bgFill: 0xfde2e2 },
        },
        states: ['hover'],
      },
    ];

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
