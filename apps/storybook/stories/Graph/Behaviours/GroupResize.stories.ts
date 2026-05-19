import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  NodeResizeBehaviour,
  type GraphEdge,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Behaviours/GroupResize' };
export default meta;
type Story = StoryObj;

/**
 * Two side-by-side resizable nodes — a compound group (`style.group.userResizable: true`)
 * on the left and a plain rect (`style.resizable: true`) on the right. The
 * same `NodeResizeBehaviour` registration handles both: dragging a corner
 * writes back into `style.group.width / height` for the group and
 * `style.shape.width / height` for the plain rect. The opposite anchor
 * stays fixed in both cases.
 *
 * Toggle `group.autoFit` in the GUI to flip the group between "user size is
 * a floor, frame still tracks children" and "user size is exact, no tracking".
 */
export const GroupResize: Story = {
  render: () => createContainer({ id: 'graph-group-resize' }),

  play: async ({ canvasElement }) => {
    const settings = { autoFit: false };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 260, height: 200, cornerRadius: 8 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { userResizable: true, autoFit: settings.autoFit, padding: 16 },
          labelText: 'Group (drag corners)',
          labelColor: 0x6b7fff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: 60, y: 60 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 200, y: 60 },
        style: { shape: { kind: 'circle', radius: 18 }, bgFill: 0x3b82f6 },
      },
      {
        id: 'plain-rect',
        position: { x: 380, y: 30 },
        style: {
          shape: { kind: 'rect', width: 180, height: 140, cornerRadius: 6 },
          bgFill: 0xfef9c3,
          bgStrokeColor: 0xeab308,
          bgStrokeWidth: 1,
          // No group field here — this is a regular node opting into resize
          // via the new `style.resizable` flag. Drag writes to
          // `style.shape.width / height` directly.
          resizable: true,
          labelText: 'Plain rect (resizable)',
          labelColor: 0xa16207,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-group-resize')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({
        id: 'drag',
        layerId: 'graph',
        enabled: true,
        filter: (id) => graph.getGroupRole(id) !== 'expanded',
      }),
    );
    canvas.behaviours.register(
      new NodeResizeBehaviour({ id: 'resize', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    const gui = new GUI({ title: 'Resize behaviour' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'autoFit').onChange(() => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const priorGroup = priorStyle.group ?? {};
      graph.store.updateNode('group-a', {
        style: { ...priorStyle, group: { ...priorGroup, autoFit: settings.autoFit } },
      });
    });
  },
};
