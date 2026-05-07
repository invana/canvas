import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Routers/Straight' };
export default meta;
type Story = StoryObj;

export const Straight: Story = {
  render: () => createContainer({ id: 'cvs-router-straight' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-router-straight')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'router-straight-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('router-straight-gfx');

    const settings = {
      sourceX: 80,  sourceY: 200,
      targetX: 480, targetY: 340,
      strokeColor: '#0ea5e9',
      strokeWidth: 2,
    };

    function redraw() {
      const SRC = { x: settings.sourceX, y: settings.sourceY };
      const TGT = { x: settings.targetX, y: settings.targetY };
      const polyline = draw.straightRouter(SRC, TGT);
      g.clear();
      draw.drawLineConnector(g, polyline, {
        kind: 'line',
        source: { kind: 'point', ...SRC },
        target: { kind: 'point', ...TGT },
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Straight router' });
    gui.add(settings, 'sourceX', 0, 800, 1).onChange(redraw);
    gui.add(settings, 'sourceY', 0, 600, 1).onChange(redraw);
    gui.add(settings, 'targetX', 0, 800, 1).onChange(redraw);
    gui.add(settings, 'targetY', 0, 600, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
  },
};
