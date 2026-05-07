import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Shapes/MarchingAnts' };
export default meta;
type Story = StoryObj;

export const MarchingAnts: Story = {
  render: () => createContainer({ id: 'cvs-deco-shape-marching-ants' }),

  play: async ({ canvasElement }) => {
    const BOUNDS = { x: 0, y: 0, width: 200, height: 120 };

    class DrawLayer extends WorldLayer {
      deco?: draw.AnimatedDecoration;
      protected createState() { return {}; }
      hitTest() { return null; }
      tickAnimations(dt: number) { this.deco?.tick(dt); }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-shape-marching-ants')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-shape-ants-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    draw.drawRect(hostG, {
      kind: 'rect', x: BOUNDS.x, y: BOUNDS.y,
      width: BOUNDS.width, height: BOUNDS.height,
      fill: 0x4f9cf9, stroke: 0x1e3a8a, strokeWidth: 2,
    });

    const decoSlot = layer.createContainer('ants-slot');
    const decoG = layer.createGraphics('ants-gfx');
    decoSlot.addChild(decoG);

    const settings = { color: '#f43f5e', width: 1.5, alpha: 1, dashLength: 6, gapLength: 4, speed: 0.04, inset: 2 };

    function rebuild() {
      layer.deco?.destroy();
      layer.deco = new draw.MarchingAntsDecoration(decoSlot, decoG, {
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        dashLength: settings.dashLength,
        gapLength: settings.gapLength,
        speed: settings.speed,
        inset: settings.inset,
      });
      layer.deco.update(BOUNDS, 'rect');
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Marching Ants (shape)' });
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 0, 10, 0.5).onChange(rebuild);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'dashLength', 1, 30, 1).onChange(rebuild);
    gui.add(settings, 'gapLength', 1, 30, 1).onChange(rebuild);
    gui.add(settings, 'speed', 0, 0.2, 0.005).onChange(rebuild);
    gui.add(settings, 'inset', 0, 20, 1).onChange(rebuild);
  },
};
