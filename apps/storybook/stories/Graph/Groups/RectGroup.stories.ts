import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Groups/RectGroup' };
export default meta;
type Story = StoryObj;

/**
 * Single rectangular compound group enclosing three nodes. Mirrors the
 * outer-frame look in the reference UI: a thin blue stroke around a very
 * light blue fill, label tucked at the top-left corner of the frame.
 *
 * The lil-gui panel toggles `autoFit` and bumps `padding` /
 * `headerHeight` so you can see the frame's tracking math react live —
 * uncheck `autoFit` and the frame stops following children when they're
 * dragged.
 */
export const RectGroup: Story = {
  render: () => createContainer({ id: 'graph-rect-group' }),

  play: async ({ canvasElement }) => {
    const settings = { autoFit: true, padding: 20, headerHeight: 0 };

    const nodes: GraphNode[] = [
      {
        id: 'group-a',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'rect', width: 240, height: 220, cornerRadius: 8 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: {
            autoFit: settings.autoFit,
            padding: settings.padding,
            headerHeight: settings.headerHeight,
          },
          labelText: 'Group A',
          labelColor: 0x6b7fff,
          labelFontSize: 11,
          labelFontWeight: 600,
          labelPlacement: 'inside-top-left',
        },
      },
      {
        id: 'node1',
        parentId: 'group-a',
        position: { x: -50, y: -30 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node1',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
      {
        id: 'node2',
        parentId: 'group-a',
        position: { x: 50, y: -30 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node2',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
      {
        id: 'node3',
        parentId: 'group-a',
        position: { x: 0, y: 80 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node3',
          labelColor: 0x334155,
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6,
        },
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-rect-group')!;
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
        // Skip the group frame itself — dragging children is what reveals
        // auto-fit behaviour. groupAware: true (the default) would
        // translate the whole subtree when the group is grabbed.
        filter: (id) => graph.getGroupRole(id) !== 'expanded',
      }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    const gui = new GUI({ title: 'Rect group' });
    onStoryTeardown(() => gui.destroy());
    const apply = (): void => {
      const node = graph.store.getNode('group-a');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const priorGroup = priorStyle.group ?? {};
      graph.store.updateNode('group-a', {
        style: {
          ...priorStyle,
          group: {
            ...priorGroup,
            autoFit: settings.autoFit,
            padding: settings.padding,
            headerHeight: settings.headerHeight,
          },
        },
      });
    };
    gui.add(settings, 'autoFit').onChange(apply);
    gui.add(settings, 'padding', 0, 60, 1).onChange(apply);
    gui.add(settings, 'headerHeight', 0, 40, 1).onChange(apply);
  },
};
