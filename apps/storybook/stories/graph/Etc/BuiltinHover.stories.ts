import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Etc/BuiltinHover' };
export default meta;
type Story = StoryObj;

/**
 * Validates the v3 G6-aligned `NodeData` shape against the built-in `hovered`
 * state config that `GraphLayer` auto-registers
 * (`DEFAULT_NODE_STATE_CONFIGS.hovered` — strokeWidth: 3, stroke: 0xffffff).
 *
 * Two tiles — left is at rest, right is rendered with `states: ['hovered']`
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
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

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
          labelText: 'states: [hovered]',
          labelColor: 0x1f2937,
          labelPlacement: 'bottom',
          labelFontSize: 12,
          labelFontWeight: 600,
          labelOffsetY: 8,
        },
        // Activated via data-driven states (plural). The built-in `hovered`
        // config (strokeWidth: 3, stroke: 0xffffff) applies on top of `style`.
        states: ['hovered'],
      },
    ];

    // Data is content — it rides on the layer via `initData`.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
