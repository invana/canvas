import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Groups/FixedSizeGroup' };
export default meta;
type Story = StoryObj;

/**
 * `autoFit: false` — the group's declared `width` / `height` is taken
 * literally. Children may sprawl outside the frame; the frame is purely
 * a decorative background that doesn't track them.
 *
 * Try dragging `node3` outside the rect — the frame stays put. Pair this
 * mode with `GroupResizeBehaviour` (see `Graph/Behaviours/GroupResize`)
 * to give the developer manual sizing handles instead.
 */
export const FixedSizeGroup: Story = {
  render: () => createContainer({ id: 'graph-fixed-size-group' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: -120, y: -100 },
        style: {
          shape: { kind: 'rect', width: 240, height: 200, cornerRadius: 8 },
          bgFill: 0xfef9c3,
          bgStrokeColor: 0xeab308,
          bgStrokeWidth: 1,
          // autoFit explicitly off → declared 240×200 is final.
          group: { autoFit: false, padding: 16 },
          labelText: 'Fixed-size frame',
          labelColor: 0xa16207,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: -60, y: -50 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0xeab308 },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 0, y: -20 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0xeab308 },
      },
      {
        id: 'node3',
        parentId: 'group-a',
        position: { x: 60, y: 10 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0xeab308 },
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-fixed-size-group')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 120);
  },
};
