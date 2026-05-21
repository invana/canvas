import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type EdgeData, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Etc/EdgeTransitions' };
export default meta;
type Story = StoryObj;

/**
 * Mirror of the node state stories on edges. Validates the v3 G6-aligned
 * `EdgeData` shape drives the connector renderer correctly, and that
 * per-edge `state` overlay catalogue applies on top of the layer's
 * canonical edge state configs.
 *
 * Three rows demonstrate:
 * - row 1: resting + built-in `hovered` (light + black stroke, width 3)
 * - row 2: per-edge `state.hovered` override → orange ring on hover
 * - row 3: per-edge `state.selected` with dashed pattern
 */
export const EdgeTransitions: Story = {
  render: () => createContainer({ id: 'graph-states-edge-transitions' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-states-edge-transitions',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const nodes: NodeData[] = [
      { id: 'a1', position: { x: -160, y: -120 }, style: { shape: { kind: 'circle', radius: 14 } } },
      { id: 'b1', position: { x:  160, y: -120 }, style: { shape: { kind: 'circle', radius: 14 } } },
      { id: 'a2', position: { x: -160, y:    0 }, style: { shape: { kind: 'circle', radius: 14 } } },
      { id: 'b2', position: { x:  160, y:    0 }, style: { shape: { kind: 'circle', radius: 14 } } },
      { id: 'a3', position: { x: -160, y:  120 }, style: { shape: { kind: 'circle', radius: 14 } } },
      { id: 'b3', position: { x:  160, y:  120 }, style: { shape: { kind: 'circle', radius: 14 } } },
    ];

    const edges: EdgeData[] = [
      {
        id: 'e1',
        source: 'a1', target: 'b1',
        style: {
          shape: { pathType: 'straight' },
          strokeColor: 0x6b7280,
          strokeWidth: 2,
          arrowTargetShape: 'triangle',
          labelText: 'resting + built-in hover',
          labelColor: 0x1f2937,
          labelFontSize: 12,
          labelOffsetY: -10,
        },
        states: ['hovered'],
      },
      {
        id: 'e2',
        source: 'a2', target: 'b2',
        style: {
          shape: { pathType: 'straight' },
          strokeColor: 0x6b7280,
          strokeWidth: 2,
          arrowTargetShape: 'triangle',
          labelText: 'override hover → orange',
          labelColor: 0x1f2937,
          labelFontSize: 12,
          labelOffsetY: -10,
        },
        state: {
          hovered: { strokeColor: 0xffaa00, strokeWidth: 5 },
        },
        states: ['hovered'],
      },
      {
        id: 'e3',
        source: 'a3', target: 'b3',
        style: {
          shape: { pathType: 'straight' },
          strokeColor: 0x6b7280,
          strokeWidth: 2,
          arrowTargetShape: 'triangle',
          labelText: 'selected → dashed yellow',
          labelColor: 0x1f2937,
          labelFontSize: 12,
          labelOffsetY: -10,
        },
        state: {
          selected: {
            strokeColor: 0xfacc15,
            strokeWidth: 4,
            strokeDashArray: [6, 4],
          },
        },
        states: ['selected'],
      },
    ];

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
