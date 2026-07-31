import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, InsetAnchor, ShapeFillLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Shapes/Fill/ImageWithInsetGlyph' };
export default meta;
type Story = StoryObj;

/**
 * Multi-layer fill composition: a raster image filling the silhouette plus a
 * glyph fill layer anchored to a corner via `InsetAnchor`. Two `ShapeFillLayer`
 * entries on a single shape — no follower shapes involved.
 *
 * This is **not** the badge attachment system (`PrimitivesRenderer.setBadge()`).
 * See `Canvas/Primitives/Shapes/Badges` for that — it attaches separate follower
 * shapes to a host with auto-reanchoring.
 *
 * The lil-gui panel lets you move the inset glyph to any of the five anchors and
 * resize it independently of the image underneath.
 */
export const ImageWithInsetGlyphStory: Story = {
  name: 'ImageWithInsetGlyph',
  render: () => createContainer({ id: 'cvs-prim-image-with-inset-glyph' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-image-with-inset-glyph')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
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
    const layer = new RenderLayer({ id: 'image-inset-glyph', options: {} });
    canvas.layers.add(layer);

    const settings = {
      photoUrl: 'https://picsum.photos/seed/canvas-icon-demo/256/256',
      anchor: 'top-right' as InsetAnchor,
      badgeChar: '✓',
      badgeColor: 0x10b981,
      badgeSize: 0.28,
    };

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'image', url: settings.photoUrl },
      {
        kind: 'glyph',
        char: settings.badgeChar,
        fontFamily: 'sans-serif',
        color: settings.badgeColor,
        sizeRatio: settings.badgeSize,
        anchor: settings.anchor,
      },
    ];

    layer.renderer.addShape('avatar', {
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

    const repaint = () =>
      layer.renderer.updateShape('avatar', { fill: buildFill() });

    const gui = new GUI({ title: 'Image + inset glyph' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange(repaint);
    gui.add(settings, 'badgeChar', ['✓', '★', '!', '♥', '⚡'])
      .onChange(repaint);
    gui.addColor(settings, 'badgeColor').onChange(repaint);
    gui.add(settings, 'badgeSize', 0.1, 0.6, 0.01).onChange(repaint);
  },
};
