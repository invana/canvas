import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, InsetAnchor, ShapeFillLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Shapes/Fill/Images/ImageInset' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'image-inset'` inset-content layer — a
 * **small raster image** centred (or anchored) inside the silhouette as a
 * Pixi `Sprite`. Distinct from `kind: 'image'`, which uses the raster as
 * the silhouette fill. Use `image-inset` for "small logo on plate" / "tiny
 * thumbnail in card" / "corner badge as raster" compositions.
 */
export const ImageInset: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-image-inset' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-image-inset')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
      }
      hitTest() { return null; }
    }
    const layer = new RenderLayer({ id: 'fill-image-inset', options: {} });
    canvas.layers.add(layer);

    const samples: Record<string, string> = {
      photoA: 'https://picsum.photos/seed/canvas-inset-a/96/96',
      photoB: 'https://picsum.photos/seed/canvas-inset-b/96/96',
      photoC: 'https://picsum.photos/seed/canvas-inset-c/96/96',
    };

    const settings = {
      sample: 'photoA' as keyof typeof samples,
      sizeRatio: 0.5,
      anchor: 'center' as InsetAnchor,
      alpha: 1,
    };

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: 0x6366f1 },
      {
        kind: 'image-inset',
        url: samples[settings.sample]!,
        sizeRatio: settings.sizeRatio,
        anchor: settings.anchor,
        alpha: settings.alpha,
      },
    ];

    layer.renderer.addShape('ii', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 128,
      height: 128,
      cornerRadius: 16,
      fill: buildFill(),
      stroke: { color: 0xffffff, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 60);

    const gui = new GUI({ title: 'Image-inset fill' });
    const repaint = () => layer.renderer.updateShape('ii', { fill: buildFill() });
    gui.add(settings, 'sample', Object.keys(samples)).onChange(repaint);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.01).onChange(repaint);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(repaint);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(repaint);
  },
};
