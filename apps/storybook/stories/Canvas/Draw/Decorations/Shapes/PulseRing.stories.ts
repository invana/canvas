import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/PulseRing' };
export default meta;
type Story = StoryObj;

export const PulseRing: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-pulse-ring' }),

  play: async ({ canvasElement }) => {
    const BOUNDS = { x: 0, y: 0, width: 200, height: 120 };

    class DrawLayer extends WorldLayer {
      deco?: draw.AnimatedDecoration;
      protected createState() { return {}; }
      hitTest() { return null; }
      tickAnimations(dt: number) { this.deco?.tick(dt); }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-pulse-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-pulse-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    draw.drawRect(hostG, {
      kind: 'rect', x: BOUNDS.x, y: BOUNDS.y,
      width: BOUNDS.width, height: BOUNDS.height,
      fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
    });

    const decoSlot = layer.createContainer('pulse-slot');
    const decoG = layer.createGraphics('pulse-gfx');
    decoSlot.addChild(decoG);

    const settings = { color: '#a78bfa', width: 2, alpha: 0.6, startPadding: 0, endPadding: 30, periodMs: 1500 };

    function rebuild() {
      layer.deco?.destroy();
      layer.deco = new draw.PulseRingDecoration(decoSlot, decoG, {
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        startPadding: settings.startPadding,
        endPadding: settings.endPadding,
        periodMs: settings.periodMs,
      });
      layer.deco.update(BOUNDS, 'rect');
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Pulse Ring (shape)' });
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 0, 10, 1).onChange(rebuild);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'startPadding', 0, 30, 1).onChange(rebuild);
    gui.add(settings, 'endPadding', 10, 80, 1).onChange(rebuild);
    gui.add(settings, 'periodMs', 200, 5000, 100).onChange(rebuild);
  },
};
