import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Shapes/Ellipse' };
export default meta;
type Story = StoryObj;

export const Ellipse: Story = {
  render: () => createContainer({ id: 'cvs-ellipse' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-ellipse')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'ellipse-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('ellipse-gfx');

    const settings = { rx: 100, ry: 60, fillColor: '#4f9cf9', fillAlpha: 0.2, strokeColor: '#1e3a8a', strokeWidth: 3 };

    function redraw() {
      g.clear();
      draw.drawEllipse(g, {
        kind: 'ellipse', x: 0, y: 0,
        rx: settings.rx, ry: settings.ry,
        fill: toHex(settings.fillColor), fillAlpha: settings.fillAlpha,
        stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Ellipse' });
    gui.add(settings, 'rx', 10, 200, 1).onChange(redraw);
    gui.add(settings, 'ry', 10, 200, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fillAlpha', 0, 1, 0.01).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
  },
};
