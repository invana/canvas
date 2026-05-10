import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, ShapeFillLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Shapes/Fill/Images/Image' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'image'` silhouette-filler — a raster
 * image fills the **entire silhouette**. The `fit` option (`fill` / `cover`
 * / `contain` / `none` / `tile`) controls how the texture maps onto the
 * silhouette. For a *small* raster centred inside a plate, see the
 * `image-inset` story instead.
 */
export const Image: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-image' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-image')!;
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
    const layer = new RenderLayer({ id: 'fill-image', options: {} });
    canvas.layers.add(layer);

    const samples = {
      avatar: 'https://picsum.photos/seed/canvas-fill-image-a/256/256',
      landscape: 'https://picsum.photos/seed/canvas-fill-image-b/512/256',
      portrait: 'https://picsum.photos/seed/canvas-fill-image-c/256/512',
    };
    const settings = {
      sample: 'avatar' as keyof typeof samples,
      fit: 'cover' as 'fill' | 'cover' | 'contain' | 'none' | 'tile',
      alpha: 1,
    };

    const buildFill = (): ShapeFillLayer => ({
      kind: 'image',
      url: samples[settings.sample],
      fit: settings.fit,
      alpha: settings.alpha,
    });

    layer.renderer.addShape('img', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 160,
      height: 120,
      cornerRadius: 16,
      fill: buildFill(),
      stroke: { color: 0xffffff, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 60);

    const gui = new GUI({ title: 'Image fill' });
    const repaint = () => layer.renderer.updateShape('img', { fill: buildFill() });
    gui.add(settings, 'sample', Object.keys(samples)).onChange(repaint);
    gui.add(settings, 'fit', ['fill', 'cover', 'contain', 'none', 'tile']).onChange(repaint);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(repaint);
  },
};
