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
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/MarchingAnts' };
export default meta;
type Story = StoryObj;

/**
 * `MarchingAntsDecoration` traces the host silhouette with a dashed
 * stroke whose `dashOffset` advances each frame, producing the classic
 * selection-marquee crawl. Works on every shape that implements
 * `paintInto` — here demonstrated on `circle` and `rect`. Set
 * `speedPxPerSec` to a negative value to reverse the march direction.
 */
export const MarchingAnts: Story = {
  render: () => createContainer({ id: 'cvs-deco-marching-ants' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-marching-ants')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'marching-ants', options: {} });
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
      color: 0x919191,
      strokeWidth: 1.5,
      dashLength: 6,
      gapLength: 4,
      speedPxPerSec: 24,
      inset: -4,
      alpha: 1,
    };

    const apply = () => {
      const { fillColor: _ignored, ...style } = settings;
      for (const id of hostIds) {
        layer.renderer.setDecoration(id, 'marching-ants', {
          kind: 'marching-ants',
          style,
        });
      }
    };
    apply();

    const applyFill = () => {
      for (const id of hostIds) {
        layer.renderer.updateShape(id, { fill: { kind: 'solid', color: settings.fillColor } });
      }
    };

    const gui = new GUI({ title: 'MarchingAnts' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'fillColor').name('shape fill').onChange(applyFill);
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'strokeWidth', 0.5, 6, 0.5).onChange(apply);
    gui.add(settings, 'dashLength', 1, 24, 0.5).onChange(apply);
    gui.add(settings, 'gapLength', 1, 24, 0.5).onChange(apply);
    gui.add(settings, 'speedPxPerSec', -120, 120, 2).onChange(apply);
    gui.add(settings, 'inset', -20, 20, 1).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);

    // DEBUG: bypass layer.getBounds() to isolate whether the bug is bounds-computation
    // or shape-rendering. This rect contains all 6 host positions.
    const debugBounds = layer.getBounds()
    // eslint-disable-next-line no-console
    console.log('[MarchingAnts debug] layer.getBounds()', layer.getBounds(), 'using debug bounds:', debugBounds);
    canvas.camera.fitContent(debugBounds, 200);
  },
};
