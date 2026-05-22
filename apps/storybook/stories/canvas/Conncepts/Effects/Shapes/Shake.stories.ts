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

const meta: Meta = { title: 'canvas/concepts/Effects/Shapes/Shake' };
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
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'shake', options: {} });
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

    const settings = { fillColor: 0x4f9cf9, enabled: true, amplitude: 4, axis: 'both' as 'both' | 'x' | 'y' };

    const applyShake = () => {
      const spec = settings.enabled
        ? { kind: 'shake' as const, style: { amplitude: settings.amplitude, axis: settings.axis } }
        : null;
      for (const id of hostIds) layer.renderer.setEffect(id, 'shake', spec);
    };
    applyShake();

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const gui = new GUI({ title: 'Shake' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);
    gui.add(settings, 'enabled').onChange(applyShake);
    gui.add(settings, 'amplitude', 0, 20, 0.5).onChange(applyShake);
    gui.add(settings, 'axis', ['both', 'x', 'y']).onChange(applyShake);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
