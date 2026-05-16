import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/States/BuiltinHover' };
export default meta;
type Story = StoryObj;

/**
 * Validates the v3 G6-aligned `NodeData` shape against the built-in `hover`
 * state config that `GraphLayer` auto-registers
 * (`DEFAULT_NODE_STATE_CONFIGS.hover` — strokeWidth: 3, stroke: 0xffffff).
 *
 * Two tiles — left is at rest, right is rendered with `states: ['hover']`
 * from the data feed, so the built-in hover overlay applies on top of the
 * `style` fields.
 *
 * Per-node fields used here:
 * - `style.shape: { kind: 'circle', radius }` — structural variant inside style
 * - `style.bgFill`, `style.bgStrokeColor`, `style.bgStrokeWidth` — paint
 * - `style.labelText`, `style.labelColor`, `style.labelPlacement` — label
 */
export const BuiltinHover: Story = {
  render: () => createContainer({ id: 'graph-states-builtin-hover' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-builtin-hover',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const nodes: NodeData[] = [
      {
        id: 'rest',
        position: { x: -90, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: 'resting',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelFontWeight: 600,
          labelOffsetY: 8,
        },
      },
      {
        id: 'hovered',
        position: { x: 90, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 36 },
          bgFill: 0x3b82f6,
          bgStrokeColor: 0x1d4ed8,
          bgStrokeWidth: 1,
          labelText: 'states: [hover]',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelFontWeight: 600,
          labelOffsetY: 8,
        },
        // Activated via data-driven states (plural). The built-in `hover`
        // config (strokeWidth: 3, stroke: 0xffffff) applies on top of `style`.
        states: ['hover'],
      },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {},
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
