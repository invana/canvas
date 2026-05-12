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

const meta: Meta = { title: 'Canvas/Effects/Breathing' };
export default meta;
type Story = StoryObj;

/**
 * `BreathingEffect` modulates the host's scale sinusoidally around the
 * host's bounds-centre — so a rect "breathes" symmetrically rather than
 * scaling toward its top-left origin. The renderer pivots the host
 * automatically when scale is non-identity.
 */
export const Breathing: Story = {
  render: () => createContainer({ id: 'cvs-effect-breathing' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-effect-breathing')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'breathing', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('circle-host', {
      kind: 'circle', x: -90, y: 0, radius: 40,
      fill: { kind: 'solid', color: 0x10b981 },
    });
    layer.renderer.addShape('rect-host', {
      kind: 'rect', x: 50, y: -40, width: 80, height: 80, cornerRadius: 8,
      fill: { kind: 'solid', color: 0xfacc15 },
    });

    const settings = { enabled: true, amplitude: 0.1, periodMs: 1800 };

    const apply = () => {
      const spec = settings.enabled
        ? { kind: 'breathing' as const, style: { amplitude: settings.amplitude, periodMs: settings.periodMs } }
        : null;
      layer.renderer.setEffect('circle-host', 'breathing', spec);
      layer.renderer.setEffect('rect-host', 'breathing', spec);
    };
    apply();

    const gui = new GUI({ title: 'Breathing' });
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'amplitude', 0, 0.4, 0.01).onChange(apply);
    gui.add(settings, 'periodMs', 400, 4000, 100).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
