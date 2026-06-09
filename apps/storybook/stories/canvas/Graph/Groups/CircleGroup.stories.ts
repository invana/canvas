import type { Meta, StoryObj } from '@storybook/react-vite';
import GUI from 'lil-gui';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
  type NodeStyle,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph/Groups/CircleGroup' };
export default meta;
type Story = StoryObj;

/**
 * Same group concept, circular frame. Auto-fit math computes the smallest
 * enclosing radius via half-diagonal of the children AABB + padding —
 * cheap, monotonic, and good enough for most cluster overlays.
 */
export const CircleGroup: Story = {
  render: () => createContainer({ id: 'graph-circle-group' }),

  play: async ({ canvasElement }) => {
    const settings = { autoFit: true, padding: 28 };

    const nodes: GraphNode[] = [
      {
        id: 'group-c',
        position: { x: 0, y: 0 },
        style: {
          // Small declared radius — `autoFit: true` grows the frame to
          // wrap children while expanded; the small radius is what shows
          // on collapse, so the super-node reads as node-sized.
          shape: { kind: 'circle', radius: 32 },
          bgFill: 0xf5f7ff,
          bgStrokeColor: 0x6b7fff,
          bgStrokeWidth: 1,
          group: { autoFit: settings.autoFit, padding: settings.padding },
        },
      },
      {
        id: 'node1',
        parentId: 'group-c',
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
        parentId: 'group-c',
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
        parentId: 'group-c',
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

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-circle-group')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', targetLayerId: 'graph' }),
    );

    const canvasOptions = {
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: true },
        'collapse-expand': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 100);

    const gui = new GUI({ title: 'Circle group' });
    onStoryTeardown(() => gui.destroy());
    const apply = (): void => {
      const node = graph.store.getNode('group-c');
      if (!node) return;
      const priorStyle = (node.style ?? {}) as NodeStyle;
      const priorGroup = priorStyle.group ?? {};
      graph.store.updateNode('group-c', {
        style: {
          ...priorStyle,
          group: { ...priorGroup, autoFit: settings.autoFit, padding: settings.padding },
        },
      });
    };
    gui.add(settings, 'autoFit').onChange(apply);
    gui.add(settings, 'padding', 0, 60, 1).onChange(apply);
  },
};
