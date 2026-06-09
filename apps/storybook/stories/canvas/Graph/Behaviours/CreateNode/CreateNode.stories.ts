import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { CreateNodeBehaviour, GraphCanvas, GraphLayer, type GraphNode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Behaviours/CreateNode/CreateNode' };
export default meta;
type Story = StoryObj;

/** Click empty canvas to add a node (drag still pans — only a click creates). */
export const CreateNode: Story = {
  render: () => createContainer({ id: 'graph-create-node' }),

  play: async ({ canvasElement }) => {
    const seed: GraphNode[] = [
      { id: 'a', position: { x: -80, y: 0 }, style: { labelText: 'A' } },
      { id: 'b', position: { x: 80, y: 0 }, style: { labelText: 'B' } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-create-node')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Data is content — it rides on the layer via initData.
    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes: seed, edges: [] } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const settings = { enable: true, nodes: seed.length };
    let n = seed.length;
    // createNode / onNodeCreate (functions) stay in the constructor; enabled → config.
    const create = new CreateNodeBehaviour({
      id: 'create-node',
      layerId: 'graph',
      createNode: (world) => ({
        id: `n${++n}`,
        position: world,
        style: { labelText: `n${n}` },
      }),
      onNodeCreate: () => {
        settings.nodes += 1;
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
      },
    });
    canvas.behaviours.register(create);

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 20 },
              bgFill: 0x10b981,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelColor: 0xffffff,
              labelPlacement: 'center',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'create-node': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 120);

    const gui = new GUI({ title: 'Create Node' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enable').onChange((on: boolean) => (on ? create.enable() : create.disable()));
    gui.add(settings, 'nodes').disable();
  },
};
