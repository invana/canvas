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
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Shapes/Fill/Layered' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates **layered fills** — `fill` accepts an array of layers,
 * painted bottom-up. Silhouette-filler layers (`solid`, `image`) stack
 * via alpha; inset-content layers (`glyph`, `svg`, `image-inset`,
 * `svg-url`) sit on top of the silhouette as Pixi children.
 *
 * The dropdown swaps among preset combinations the previous single-fill
 * model couldn't express:
 *
 * - `plateAndGlyph` — `[solid, glyph]` (icon on coloured plate).
 * - `photoAndBadge` — `[image, glyph]` (photo silhouette + corner glyph).
 * - `plateAndLogoAndBadge` — `[solid, image-inset, glyph]` (three layers).
 * - `twoSolidsStacked` — `[solid, solid(alpha)]` (alpha-blended plates).
 * - `plateAndSvg` — `[solid, svg]` (literal path-d on plate).
 */
export const Layered: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-layered' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-layered')!;
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
    const layer = new RenderLayer({ id: 'fill-layered', options: {} });
    canvas.layers.add(layer);

    const presets: Record<string, ReadonlyArray<ShapeFillLayer>> = {
      plateAndGlyph: [
        { kind: 'solid', color: 0x6366f1 },
        { kind: 'glyph', char: '★', fontFamily: 'sans-serif', color: 0xffffff, sizeRatio: 0.55 },
      ],
      photoAndBadge: [
        { kind: 'image', url: 'https://picsum.photos/seed/canvas-layered-photo/256/256', fit: 'cover' },
        { kind: 'glyph', char: '✓', fontFamily: 'sans-serif', color: 0x10b981, sizeRatio: 0.28, anchor: 'top-right' },
      ],
      plateAndLogoAndBadge: [
        { kind: 'solid', color: 0x18181b },
        { kind: 'image-inset', url: 'https://picsum.photos/seed/canvas-layered-logo/96/96', sizeRatio: 0.55 },
        { kind: 'glyph', char: '⚡', fontFamily: 'sans-serif', color: 0xfbbf24, sizeRatio: 0.25, anchor: 'top-right' },
      ],
      twoSolidsStacked: [
        { kind: 'solid', color: 0x4f9cf9 },
        { kind: 'solid', color: 0xef4444, alpha: 0.5 },
      ],
      plateAndSvg: [
        { kind: 'solid', color: 0x0ea5e9 },
        {
          kind: 'svg',
          pathD: 'M4 12 L10 18 L20 6',
          viewBox: { width: 24, height: 24 },
          strokeWidth: 2,
          color: 0xffffff,
          sizeRatio: 0.55,
        },
      ],
    };

    const settings = { preset: 'plateAndGlyph' as keyof typeof presets };

    layer.renderer.addShape('l', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 128,
      height: 128,
      cornerRadius: 16,
      fill: presets[settings.preset],
      stroke: { color: 0xffffff, width: 2 },
    });

    canvas.camera.fitContent(layer.getBounds(), 60);

    const gui = new GUI({ title: 'Layered fill' });
    gui.add(settings, 'preset', Object.keys(presets)).onChange(() => {
      layer.renderer.updateShape('l', { fill: presets[settings.preset] });
    });
  },
};
