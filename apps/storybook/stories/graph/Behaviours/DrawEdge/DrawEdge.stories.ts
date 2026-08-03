import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { DrawEdgeBehaviour, GraphCanvas, GraphLayer, type GraphNode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/DrawEdge/DrawEdge' };
export default meta;
type Story = StoryObj;

/** Drag from one node to another to draw an edge (dashed rubber-band preview). */
export const DrawEdgeStory: Story = {
  name: 'DrawEdge',
  render: () => createContainer({ id: 'graph-draw-edge' }),

  play: async ({ canvasElement }) => {
    const seed: GraphNode[] = [
      { type: 'node', id: 'a', position: { x: -140, y: -60 }, style: { labelText: 'A' } },
      { type: 'node', id: 'b', position: { x: 140, y: -60 }, style: { labelText: 'B' } },
      { type: 'node', id: 'c', position: { x: -140, y: 80 }, style: { labelText: 'C' } },
      { type: 'node', id: 'd', position: { x: 140, y: 80 }, style: { labelText: 'D' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-draw-edge')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes: seed, edges: [] } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const settings = { enable: true, edges: 0 };
    let e = 0;
    // `createEdge` / `onEdgeCreate` are resolver callbacks → they stay in the
    // constructor; the behaviour is turned on via `config.behaviours`.
    const draw = new DrawEdgeBehaviour({
      id: 'draw-edge',
      targetLayerId: 'graph',
      createEdge: (source, target) => ({ type: 'edge', id: `e${++e}`, source, target }),
      onEdgeCreate: () => {
        settings.edges += 1;
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
      },
    });
    canvas.behaviours.register(draw);

    const canvasOptions = {
      layers: {
        graph: {
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
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'draw-edge': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 120);

    const gui = new GUI({ title: 'Draw Edge' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange((on: boolean) => (on ? draw.enable() : draw.disable()));
    gui.add(settings, 'edges').disable();
  },
};
