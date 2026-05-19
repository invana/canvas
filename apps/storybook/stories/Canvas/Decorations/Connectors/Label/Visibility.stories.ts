import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/Label/Visibility' };
export default meta;
type Story = StoryObj;

/**
 * `LabelVisibility` on a connector label — per-label zoom-band LOD. The
 * decoration detaches its `gfx` from the surface when the camera zoom falls
 * outside `[minZoom, maxZoom]`. Useful for graphs that show terse edge labels
 * only when zoomed in close, or coarse "summary" labels only when zoomed out.
 *
 * Three connectors stacked: always-visible, far-only (`maxZoom: 1.2`), and
 * near-only (`minZoom: 0.8`). Pan + zoom to see them appear/disappear.
 */
export const Visibility: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-vis' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-vis')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-vis', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Each row uses a different path style so visibility behaviour can be
    // observed across straight, bezier, and orth+rounded paths. Endpoints
    // are staggered so the path style is visible (bezier needs a y-delta,
    // orth needs an xy-delta).
    const edges = [
      { id: 'always', srcY: -180, tgtY: -180, fill: 0x4f9cf9, router: 'straight' as const, pathStyle: 'normal' as const,  curved: false },
      { id: 'far',    srcY:  -30, tgtY:   30, fill: 0xfb923c, router: 'straight' as const, pathStyle: 'bezier' as const,  curved: true  },
      { id: 'near',   srcY:  120, tgtY:  200, fill: 0x10b981, router: 'orth' as const,     pathStyle: 'rounded' as const, curved: false },
    ];
    for (const e of edges) {
      layer.renderer.addShape(`${e.id}-src`, { kind: 'circle', x: -240, y: e.srcY, radius: 16, fill: { kind: 'solid', color: e.fill } });
      layer.renderer.addShape(`${e.id}-tgt`, { kind: 'circle', x:  240, y: e.tgtY, radius: 16, fill: { kind: 'solid', color: e.fill } });
      layer.renderer.addConnector(e.id, {
        kind: 'connector',
        router: e.router, pathStyle: e.pathStyle,
        source: { kind: 'shape', shapeId: `${e.id}-src`, anchor: 'boundary' },
        target: { kind: 'shape', shapeId: `${e.id}-tgt`, anchor: 'boundary' },
        stroke: { color: 0xcbd5e1, width: 1.5 },
        targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 }),
        ...(e.curved ? { pathStyleOpts: { axis: 'h' as const, tension: 0.5 } } : {}),
      });
    }

    const settings = {
      minZoomNear: 0.8,
      maxZoomFar: 1.2,
      fontSize: 12,
    };

    const apply = (): void => {
      layer.renderer.setDecoration('always', 'label', {
        kind: 'label-connector',
        style: {
          content: { kind: 'text', text: 'always', fontSize: settings.fontSize, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [2, 6] },
          placement: 'center',
        },
      });
      layer.renderer.setDecoration('far', 'label', {
        kind: 'label-connector',
        style: {
          content: { kind: 'text', text: `far only (maxZoom ${settings.maxZoomFar})`, fontSize: settings.fontSize, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [2, 6] },
          placement: 'center',
          visibility: { maxZoom: settings.maxZoomFar },
        },
      });
      layer.renderer.setDecoration('near', 'label', {
        kind: 'label-connector',
        style: {
          content: { kind: 'text', text: `near only (minZoom ${settings.minZoomNear})`, fontSize: settings.fontSize, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [2, 6] },
          placement: 'center',
          visibility: { minZoom: settings.minZoomNear },
        },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 120);

    const gui = new GUI({ title: 'Visibility (LOD)' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'fontSize', 8, 24, 1).onChange(apply);
    gui.add(settings, 'maxZoomFar',  0.2, 4, 0.05).name('far: maxZoom').onChange(apply);
    gui.add(settings, 'minZoomNear', 0.2, 4, 0.05).name('near: minZoom').onChange(apply);
  },
};
