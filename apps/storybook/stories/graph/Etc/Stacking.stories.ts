import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Etc/Stacking' };
export default meta;
type Story = StoryObj;

/**
 * Validates that multiple active states stack additively in `states[]`
 * order — later wins per field. Three rows show:
 *
 * 1. just `selected` — yellow ring (built-in `DEFAULT_NODE_STATE_CONFIGS.selected`)
 * 2. `selected` then `dimmed` — yellow ring + alpha 0.25
 * 3. `selected`, `dimmed`, then per-node `pulse` overlay — yellow ring,
 *    dimmed alpha, plus a thicker stroke from the custom state.
 *
 * Stacking order is left-to-right in the `states[]` array — last wins per
 * field.
 *
 * All node style lives in the data arrays and rides on `options.initData`;
 * the layer template is empty so there's no `layers.graph` config entry.
 */
export const Stacking: Story = {
  render: () => createContainer({ id: 'graph-states-stacking' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-stacking',
    )!;

    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'sel',
        position: { x: -200, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: '[selected]',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        states: ['selected'],
      },
      { type: 'node',
        id: 'sel-dim',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: '[selected, dimmed]',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        states: ['selected', 'dimmed'],
      },
      { type: 'node',
        id: 'sel-dim-pulse',
        position: { x: 200, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: '[selected, dimmed, pulse]',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelOffsetY: 8,
        },
        state: {
          pulse: { bgStrokeWidth: 8, bgStrokeColor: 0xfacc15 },
        },
        states: ['selected', 'dimmed', 'pulse'],
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
