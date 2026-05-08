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
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Shapes/PhotoBadge' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates a composition that the previous single-fill model couldn't
 * express: a raster image filling the silhouette with a small "verified"
 * glyph anchored to a corner — two fill layers in one shape.
 *
 * The lil-gui panel lets you move the badge to any of the five anchors and
 * resize it independently of the photo underneath.
 */
export const PhotoBadge: Story = {
  render: () => createContainer({ id: 'cvs-prim-photo-badge' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-photo-badge')!;
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
    const layer = new RenderLayer({ id: 'photo-badge', options: {} });
    canvas.layers.add(layer);

    const settings = {
      photoUrl: 'https://picsum.photos/seed/canvas-icon-demo/256/256',
      anchor: 'top-right' as InsetAnchor,
      badgeChar: '✓',
      badgeColor: 0x10b981,
      badgeSize: 0.28,
    };

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'image', url: settings.photoUrl, fit: 'cover' },
      {
        kind: 'glyph',
        char: settings.badgeChar,
        fontFamily: 'sans-serif',
        color: 0xffffff,
        sizeRatio: settings.badgeSize,
        anchor: settings.anchor,
      },
      // Tiny solid disc behind the glyph for visibility — drawn AFTER the
      // image and BEFORE the glyph would also work via a third silhouette
      // layer, but a glyph-on-photo demo reads cleaner without one.
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

    const gui = new GUI({ title: 'Photo + badge' });
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange(repaint);
    gui.add(settings, 'badgeChar', ['✓', '★', '!', '♥', '⚡'])
      .onChange(repaint);
    gui.addColor(settings, 'badgeColor').onChange(repaint);
    gui.add(settings, 'badgeSize', 0.1, 0.6, 0.01).onChange(repaint);
  },
};
