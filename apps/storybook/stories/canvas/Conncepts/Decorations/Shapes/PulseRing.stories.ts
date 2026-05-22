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

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/PulseRing' };
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
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pulse-ring', options: {} });
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

    const settings = {
      fillColor: 0x4f9cf9,
      color: 0xfb923c, maxRadius: 40, periodMs: 1600, rings: 2,
      strokeWidth: 2, innerAlpha: 0.7,
    };

    const apply = () => {
      const { fillColor: _ignored, ...style } = settings;
      for (const id of hostIds) {
        layer.renderer.setDecoration(id, 'pulse-ring', {
          kind: 'pulse-ring',
          style: { ...style },
        });
      }
    };
    apply();

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const gui = new GUI({ title: 'PulseRing' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'maxRadius', 4, 120, 2).onChange(apply);
    gui.add(settings, 'periodMs', 400, 4000, 100).onChange(apply);
    gui.add(settings, 'rings', 1, 5, 1).onChange(apply);
    gui.add(settings, 'strokeWidth', 0.5, 8, 0.5).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);

    // DEBUG: bypass layer.getBounds() to isolate whether the bug is bounds-computation
    // or shape-rendering. This rect contains all 6 host positions.
    const debugBounds = layer.getBounds()
    // eslint-disable-next-line no-console
    console.log('[PulseRing debug] layer.getBounds()', layer.getBounds(), 'using debug bounds:', debugBounds);
    canvas.camera.fitContent(debugBounds, 200);
  },
};
