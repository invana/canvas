import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { DrawEdgeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/DrawEdge/DrawEdge' };
export default meta;
type Story = StoryObj;

/** Drag from one node to another to draw an edge (dashed rubber-band preview). */
export const DrawEdge: Story = {
  render: () => createContainer({ id: 'graph-draw-edge' }),

  play: async ({ canvasElement }) => {
    const seed: GraphNode[] = [
      { id: 'a', position: { x: -140, y: -60 }, style: { labelText: 'A' } },
      { id: 'b', position: { x: 140, y: -60 }, style: { labelText: 'B' } },
      { id: 'c', position: { x: -140, y: 80 }, style: { labelText: 'C' } },
      { id: 'd', position: { x: 140, y: 80 }, style: { labelText: 'D' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-draw-edge')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 24 },
            bgFill: 0x6366f1,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 2,
            labelColor: 0xffffff,
            labelPlacement: 'center',
          },
        },
        edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 2 } },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes: seed, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 120);

    const settings = { enable: true, edges: 0 };
    let e = 0;
    const draw = new DrawEdgeBehaviour({
      id: 'draw-edge',
      layerId: 'graph',
      enabled: true,
      createEdge: (source, target) => ({ id: `e${++e}`, source, target }),
      onEdgeCreate: () => {
        settings.edges += 1;
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
      },
    });
    canvas.behaviours.register(draw);

    const gui = new GUI({ title: 'Draw Edge' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange((on: boolean) => (on ? draw.enable() : draw.disable()));
    gui.add(settings, 'edges').disable();
  },
};
