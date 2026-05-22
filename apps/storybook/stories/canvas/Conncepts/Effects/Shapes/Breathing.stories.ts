import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Effects/Shapes/Breathing' };
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
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'breathing', options: {} });
    canvas.layers.add(layer);

    const hosts = [
      { id: 'circle',   spec: { kind: 'circle' as const,
          x: -220, y: -110, radius: 50,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'rect',     spec: { kind: 'rect' as const,
          x: -55,  y: -155, width: 110, height: 90, cornerRadius: 8,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'triangle', spec: { kind: 'regular-polygon' as const,
          x: 220, y: -110, sides: 3, radius: 60,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'hexagon',  spec: { kind: 'regular-polygon' as const,
          x: -220, y: 110, sides: 6, radius: 55, rotation: Math.PI / 6,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'star',     spec: { kind: 'star' as const,
          x: 0, y: 110, points: 5, outerRadius: 60, innerRadius: 25,
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
      { id: 'chevron',  spec: { kind: 'polygon' as const, x: 220, y: 110,
          vertices: [
            { x: -60, y: -35 }, { x:  25, y: -35 }, { x:  60, y: 0 },
            { x:  25, y:  35 }, { x: -60, y:  35 }, { x: -25, y: 0 },
          ],
          fill: { kind: 'solid' as const, color: 0x4f9cf9 } } },
    ];
    for (const h of hosts) layer.renderer.addShape(h.id, h.spec);
    const hostIds = hosts.map((h) => h.id);

    const settings = { fillColor: 0x4f9cf9, enabled: true, amplitude: 0.1, periodMs: 1800 };

    const apply = () => {
      const spec = settings.enabled
        ? { kind: 'breathing' as const, style: { amplitude: settings.amplitude, periodMs: settings.periodMs } }
        : null;
      for (const id of hostIds) layer.renderer.setEffect(id, 'breathing', spec);
    };
    apply();

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const gui = new GUI({ title: 'Breathing' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'amplitude', 0, 0.4, 0.01).onChange(apply);
    gui.add(settings, 'periodMs', 400, 4000, 100).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
