import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/Halo' };
export default meta;
type Story = StoryObj;

export const Halo: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-halo' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const BOUNDS = { x: 0, y: 0, width: 200, height: 120 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-halo')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-halo-layer', options: {} });
    canvas.layers.add(layer);

    const decoG = layer.createGraphics('halo-gfx');
    const hostG = layer.createGraphics('host-gfx');

    const settings = { color: '#f59e0b', alpha: 0.4, padding: 8, cornerRadius: 0 };

    function redraw() {
      hostG.clear();
      draw.drawRect(hostG, {
        kind: 'rect',
        x: BOUNDS.x + BOUNDS.width / 2,
        y: BOUNDS.y + BOUNDS.height / 2,
        width: BOUNDS.width, height: BOUNDS.height,
        cornerRadius: settings.cornerRadius,
        fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
      });
      decoG.clear();
      draw.drawHalo(decoG, BOUNDS, {
        color: toHex(settings.color),
        alpha: settings.alpha,
        padding: settings.padding,
        cornerRadius: settings.cornerRadius,
      }, 'rect');
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Halo (shape)' });
    gui.addColor(settings, 'color').onChange(redraw);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'padding', 0, 40, 1).onChange(redraw);
    gui.add(settings, 'cornerRadius', 0, 60, 1).onChange(redraw);
  },
};
