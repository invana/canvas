import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/Label/Visibility' };
export default meta;
type Story = StoryObj;

/**
 * `LabelVisibility` — per-label zoom-band LOD. The decoration detaches its
 * `gfx` from the surface when the camera zoom falls outside `[minZoom, maxZoom]`,
 * skipping Pixi's transform pass entirely. Pan + zoom this story; the
 * three demo hosts each have a different visibility band.
 *
 * - **Always visible** — no band set.
 * - **Far-zoom only** — `maxZoom: 1.2` (hides when zoomed in past 1.2×).
 * - **Near-zoom only** — `minZoom: 0.8` (hides when zoomed out past 0.8×).
 *
 * `forceShow: true` bypasses collision detection entirely, but does NOT
 * override the zoom band — those are independent contracts.
 */
export const Visibility: Story = {
  render: () => createContainer({ id: 'cvs-prim-label-vis' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-vis')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-vis', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    const HOSTS = [
      { id: 'always', x: -260, label: 'always',     fill: 0x4f9cf9, stroke: 0x1d4ed8 },
      { id: 'far',    x:    0, label: 'far only',   fill: 0xfb923c, stroke: 0xea580c },
      { id: 'near',   x:  260, label: 'near only',  fill: 0x10b981, stroke: 0x047857 },
    ];
    for (const h of HOSTS) {
      layer.renderer.addShape(h.id, {
        kind: 'circle', x: h.x, y: 0, radius: 40,
        fill: { kind: 'solid', color: h.fill }, stroke: { color: h.stroke, width: 1 }
      });
    }

    const settings = {
      minZoomNear: 0.8,
      maxZoomFar: 1.2,
      fontSize: 14
    };

    const apply = (): void => {
      // Always visible — no visibility band.
      layer.renderer.setDecoration('always', 'label', {
        kind: 'label',
        style: {
          content: { kind: 'text', text: 'always (no band)', fontSize: settings.fontSize, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6] },
          placement: 'bottom',
          offset: { y: 10 }
        }
      });
      // Far-zoom only — hides as you zoom in.
      layer.renderer.setDecoration('far', 'label', {
        kind: 'label',
        style: {
          content: { kind: 'text', text: `far only (maxZoom ${settings.maxZoomFar})`, fontSize: settings.fontSize, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6] },
          placement: 'bottom',
          offset: { y: 10 },
          visibility: { maxZoom: settings.maxZoomFar }
        }
      });
      // Near-zoom only — hides as you zoom out.
      layer.renderer.setDecoration('near', 'label', {
        kind: 'label',
        style: {
          content: { kind: 'text', text: `near only (minZoom ${settings.minZoomNear})`, fontSize: settings.fontSize, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [3, 6] },
          placement: 'bottom',
          offset: { y: 10 },
          visibility: { minZoom: settings.minZoomNear }
        }
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 160);

    const gui = new GUI({ title: 'Visibility (LOD)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'fontSize', 8, 24, 1).onChange(apply);
    gui.add(settings, 'maxZoomFar',  0.2, 4, 0.05).name('far: maxZoom').onChange(apply);
    gui.add(settings, 'minZoomNear', 0.2, 4, 0.05).name('near: minZoom').onChange(apply);
  }
};
