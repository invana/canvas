import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/AnimatedGlow' };
export default meta;
type Story = StoryObj;

/**
 * `GlowDecoration` with the optional `pulse` style — geometry is painted
 * once at mount; only the container alpha is touched per frame, so an
 * animated glow costs essentially nothing per frame after the initial
 * draw.
 */
export const AnimatedGlow: Story = {
  render: () => createContainer({ id: 'cvs-deco-animated-glow' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-animated-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'animated-glow', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 44,
      fill: { kind: 'solid', color: 0x4f9cf9 },
    });

    const settings = {
      color: 0xfb923c, radius: 22, layers: 8, innerAlpha: 0.6,
      pulseEnabled: true, periodMs: 1200, amplitude: 0.6,
    };

    const apply = () => {
      layer.renderer.setDecoration('host', 'glow', {
        kind: 'glow',
        style: {
          color: settings.color,
          radius: settings.radius,
          layers: settings.layers,
          innerAlpha: settings.innerAlpha,
          ...(settings.pulseEnabled
            ? { pulse: { periodMs: settings.periodMs, amplitude: settings.amplitude } }
            : {}),
        },
      });
    };
    apply();

    const gui = new GUI({ title: 'AnimatedGlow' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'radius', 2, 60, 1).onChange(apply);
    gui.add(settings, 'layers', 1, 16, 1).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'pulseEnabled').onChange(apply);
    gui.add(settings, 'periodMs', 200, 4000, 100).onChange(apply);
    gui.add(settings, 'amplitude', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 200);
  },
};
