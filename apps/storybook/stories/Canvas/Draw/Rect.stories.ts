import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { GenericLayer } from '../../_shared/GenericLayer';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Rect' };
export default meta;
type Story = StoryObj;

const toHex = (s: string) => parseInt(s.slice(1), 16);

export const Rect: Story = {
  render: () => createContainer({ id: 'cvs-rect' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-rect')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new GenericLayer({ id: 'rect-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('rect-gfx');

    const settings = { width: 160, height: 90, cornerRadius: 12, fillColor: '#4f9cf9', fillAlpha: 1.0, strokeColor: '#1e3a8a', strokeWidth: 3 };

    function redraw() {
      g.clear();
      draw.drawRect(g, {
        kind: 'rect', x: 0, y: 0,
        width: settings.width, height: settings.height,
        cornerRadius: settings.cornerRadius,
        fill: toHex(settings.fillColor), fillAlpha: settings.fillAlpha,
        stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Rect' });
    gui.add(settings, 'width', 20, 400, 1).onChange(redraw);
    gui.add(settings, 'height', 20, 400, 1).onChange(redraw);
    gui.add(settings, 'cornerRadius', 0, 100, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fillAlpha', 0, 1, 0.01).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
  },
};
