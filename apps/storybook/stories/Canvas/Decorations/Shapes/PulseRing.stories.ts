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
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/PulseRing' };
export default meta;
type Story = StoryObj;

/**
 * `PulseRingDecoration` traces the host's silhouette repeatedly at an
 * expanding negative inset, fading as the ring grows. Multiple
 * concurrent rings are phase-distributed so the visual rhythm stays
 * steady regardless of cycle length.
 */
export const PulseRing: Story = {
  render: () => createContainer({ id: 'cvs-deco-pulse-ring' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-pulse-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pulse-ring', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 36,
      fill: { kind: 'solid', color: 0xfb923c },
    });

    const settings = {
      color: 0xfb923c, maxRadius: 40, periodMs: 1600, rings: 2,
      strokeWidth: 2, innerAlpha: 0.7,
    };

    const apply = () => {
      layer.renderer.setDecoration('host', 'pulse-ring', {
        kind: 'pulse-ring',
        style: { ...settings },
      });
    };
    apply();

    const gui = new GUI({ title: 'PulseRing' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'maxRadius', 4, 120, 2).onChange(apply);
    gui.add(settings, 'periodMs', 400, 4000, 100).onChange(apply);
    gui.add(settings, 'rings', 1, 5, 1).onChange(apply);
    gui.add(settings, 'strokeWidth', 0.5, 8, 0.5).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 200);
  },
};
