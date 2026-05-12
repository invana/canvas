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

const meta: Meta = { title: 'Canvas/Effects/Shake' };
export default meta;
type Story = StoryObj;

/**
 * `ShakeEffect` modulates the host's transform with random per-frame
 * jitter. The shape's spec is never touched — the renderer applies the
 * delta on top of the spec each frame and reverts cleanly when the
 * effect is removed (or its decay envelope completes).
 */
export const Shake: Story = {
  render: () => createContainer({ id: 'cvs-effect-shake' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-effect-shake')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'shake', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 48,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e3a8a, width: 3 },
    });

    const settings = { enabled: true, amplitude: 4, axis: 'both' as 'both' | 'x' | 'y' };

    const applyShake = () => {
      if (settings.enabled) {
        layer.renderer.setEffect('host', 'shake', {
          kind: 'shake',
          style: { amplitude: settings.amplitude, axis: settings.axis },
        });
      } else {
        layer.renderer.setEffect('host', 'shake', null);
      }
    };
    applyShake();

    const gui = new GUI({ title: 'Shake' });
    gui.add(settings, 'enabled').onChange(applyShake);
    gui.add(settings, 'amplitude', 0, 20, 0.5).onChange(applyShake);
    gui.add(settings, 'axis', ['both', 'x', 'y']).onChange(applyShake);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
