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
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Shapes/Fill/Icons/Glyph' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'glyph'` inset-content layer — a
 * font-rendered character mounted **on top** of the silhouette (not as the
 * silhouette fill). Sized by `sizeRatio`, anchored by `anchor`. Uses
 * system-font Unicode chars so the demo doesn't depend on any webfont.
 *
 * For a webfont-backed glyph (e.g. Font Awesome), set `fontFamily` /
 * `fontWeight` and load the stylesheet first via the engine's
 * `loadIconFont(...)` helper — see the FontAwesome story.
 */
export const Glyph: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-glyph' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-glyph')!;
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
    const layer = new RenderLayer({ id: 'fill-glyph', options: {} });
    canvas.layers.add(layer);

    const settings = {
      char: '★',
      color: 0xfbbf24,
      sizeRatio: 0.6,
      anchor: 'center' as InsetAnchor,
    };

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: 0x18181b },
      {
        kind: 'glyph',
        char: settings.char,
        fontFamily: 'sans-serif',
        color: settings.color,
        sizeRatio: settings.sizeRatio,
        anchor: settings.anchor,
      },
    ];

    layer.renderer.addShape('g', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 96,
      height: 96,
      cornerRadius: 16,
      fill: buildFill(),
      stroke: { color: 0xffffff, width: 1 },
    });

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Glyph fill' });
    onStoryTeardown(() => gui.destroy());
    const repaint = () => layer.renderer.updateShape('g', { fill: buildFill() });
    gui.add(settings, 'char', ['★', '♥', '✓', '✗', '➜', '⚡', '🔥', '🚀']).onChange(repaint);
    gui.addColor(settings, 'color').onChange(repaint);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.01).onChange(repaint);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(repaint);
  },
};
