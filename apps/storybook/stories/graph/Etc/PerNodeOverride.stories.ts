import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Etc/PerNodeOverride' };
export default meta;
type Story = StoryObj;

/**
 * Validates per-node `state` overlay catalogue (singular) on `NodeData`.
 *
 * Three tiles, all with `states: ['hovered']` so the built-in hovered config
 * tries to apply. Each tile overrides `hovered` differently via its own
 * `state.hovered` — proving the per-node patch wins over the layer's
 * canonical config.
 *
 * - left: no override → built-in hover (white stroke).
 * - middle: orange ring on hover.
 * - right: red ring + scaled stroke + fill on hover.
 *
 * All node style lives in the data arrays and rides on `options.initData`;
 * the layer template is empty so there's no `layers.graph` config entry.
 */
export const PerNodeOverride: Story = {
  render: () => createContainer({ id: 'graph-states-per-node-override' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-per-node-override',
    )!;

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
        states: ['hovered'],
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
          hovered: { bgStrokeColor: 0xffaa00, bgStrokeWidth: 4 },
        },
        states: ['hovered'],
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
          hovered: { bgStrokeColor: 0xef4444, bgStrokeWidth: 6, bgFill: 0xfde2e2 },
        },
        states: ['hovered'],
      },
    ];

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: [] } },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
