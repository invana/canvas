import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/Glow' };
export default meta;
type Story = StoryObj;

/**
 * Same `GlowDecoration` applied to a circle, a rect, and a rounded rect.
 * Visual proof that decorations don't branch on shape kind — the same code
 * path produces a coherent glow around any silhouette. The lil-gui panel
 * exposes every field of `GlowDecorationStyle`, including the optional
 * `pulse` animation.
 */
export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-prim-glow' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'glow', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('circle-host', {
      kind: 'circle', x: -180, y: 0, radius: 40,
      fill: { kind: 'solid', color: 0x4f9cf9 },
    });

    layer.renderer.addShape('rect-host', {
      kind: 'rect', x: -50, y: -40, width: 100, height: 80,
      fill: { kind: 'solid', color: 0x10b981 },
    });

    layer.renderer.addShape('rounded-host', {
      kind: 'rect', x: 110, y: -40, width: 100, height: 80, cornerRadius: 18,
      fill: { kind: 'solid', color: 0xfacc15 },
    });

    const hosts = ['circle-host', 'rect-host', 'rounded-host'];
    const settings = {
      color: 0xfb923c,
      radius: 18,
      layers: 8,
      innerAlpha: 0.55,
      pulseEnabled: false,
      periodMs: 1200,
      amplitude: 0.5,
    };

    const apply = () => {
      const style = {
        color: settings.color,
        radius: settings.radius,
        layers: settings.layers,
        innerAlpha: settings.innerAlpha,
        ...(settings.pulseEnabled
          ? { pulse: { periodMs: settings.periodMs, amplitude: settings.amplitude } }
          : {}),
      };
      for (const id of hosts) {
        layer.renderer.setDecoration(id, 'glow', { kind: 'glow', style });
      }
    };
    apply();

    const gui = new GUI({ title: 'Glow' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'radius', 2, 60, 1).onChange(apply);
    gui.add(settings, 'layers', 1, 16, 1).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);
    const pulse = gui.addFolder('pulse');
    pulse.add(settings, 'pulseEnabled').name('enabled').onChange(apply);
    pulse.add(settings, 'periodMs', 200, 4000, 100).onChange(apply);
    pulse.add(settings, 'amplitude', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
