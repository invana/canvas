import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Routers/Orthogonal' };
export default meta;
type Story = StoryObj;

export const Orthogonal: Story = {
  render: () => createContainer({ id: 'cvs-router-orthogonal' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-router-orthogonal')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'router-orthogonal-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('router-orthogonal-gfx');

    const settings = {
      sourceX: 80,  sourceY: 200,
      targetX: 480, targetY: 340,
      strokeColor: '#10b981',
      strokeWidth: 2,
    };

    function redraw() {
      const SRC = { x: settings.sourceX, y: settings.sourceY };
      const TGT = { x: settings.targetX, y: settings.targetY };
      const polyline = draw.orthogonalRouter(SRC, TGT);
      g.clear();
      draw.drawLineConnector(g, polyline, {
        kind: 'line',
        source: { kind: 'point', ...SRC },
        target: { kind: 'point', ...TGT },
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        join: 'miter',
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Orthogonal router' });
    gui.add(settings, 'sourceX', 0, 800, 1).onChange(redraw);
    gui.add(settings, 'sourceY', 0, 600, 1).onChange(redraw);
    gui.add(settings, 'targetX', 0, 800, 1).onChange(redraw);
    gui.add(settings, 'targetY', 0, 600, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
  },
};
