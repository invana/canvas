import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Shapes/Arrow' };
export default meta;
type Story = StoryObj;

export const Arrow: Story = {
  render: () => createContainer({ id: 'cvs-arrow' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-arrow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'arrow-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('arrow-gfx');

    const settings = { size: 50, fillColor: '#4f9cf9', fillAlpha: 1.0, strokeColor: '#1e3a8a', strokeWidth: 2, rotation: 0 };

    function redraw() {
      g.clear();
      draw.drawArrow(g, {
        kind: 'arrow', x: 0, y: 0, size: settings.size,
        fill: toHex(settings.fillColor), fillAlpha: settings.fillAlpha,
        stroke: toHex(settings.strokeColor), strokeWidth: settings.strokeWidth,
      }, 0, 0, settings.rotation * Math.PI / 180);
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Arrow' });
    gui.add(settings, 'size', 10, 150, 1).onChange(redraw);
    gui.add(settings, 'rotation', -180, 180, 1).onChange(redraw);
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.add(settings, 'fillAlpha', 0, 1, 0.01).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 10, 1).onChange(redraw);
  },
};
