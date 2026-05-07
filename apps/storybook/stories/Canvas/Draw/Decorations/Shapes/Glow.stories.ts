import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/Glow' };
export default meta;
type Story = StoryObj;

export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-glow' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const BOUNDS = { x: 0, y: 0, width: 200, height: 120 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-glow-layer', options: {} });
    canvas.layers.add(layer);

    const decoSlot = layer.createContainer('glow-slot');
    const decoG = layer.createGraphics('glow-gfx');
    decoSlot.addChild(decoG);
    const hostG = layer.createGraphics('host-gfx');

    const settings = { color: '#38bdf8', padding: 12, alpha: 0.6, blur: 8 };

    function redraw() {
      const opts = {
        color: toHex(settings.color),
        padding: settings.padding,
        alpha: settings.alpha,
        blur: settings.blur,
      };
      hostG.clear();
      draw.drawRect(hostG, {
        kind: 'rect',
        x: BOUNDS.x + BOUNDS.width / 2,
        y: BOUNDS.y + BOUNDS.height / 2,
        width: BOUNDS.width, height: BOUNDS.height,
        fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
      });
      draw.setupGlow(decoSlot, opts);
      decoG.clear();
      draw.drawGlow(decoG, BOUNDS, opts, 'rect');
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Glow (shape)' });
    gui.addColor(settings, 'color').onChange(redraw);
    gui.add(settings, 'padding', 0, 40, 1).onChange(redraw);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'blur', 0, 30, 1).onChange(redraw);
  },
};
