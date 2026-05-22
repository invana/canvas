import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, ShapeFillLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Concepts/Shapes/Fill/Icons/Unicode' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'glyph'` fill layer rendering a
 * **system-font Unicode character** — no webfont, no CDN, just the user's
 * default sans-serif. Useful for stars / hearts / arrows / emoji without
 * pulling in an icon-font package.
 *
 * All Unicode chars used in this demo are inlined inside `play`. Deleting
 * this file removes them from the codebase entirely.
 */
export const Unicode: Story = {
  render: () => createContainer({ id: 'cvs-prim-icons-unicode' }),

  play: async ({ canvasElement }) => {
    // ─── Inline Unicode chars ──────────────────────────────────────────────
    const chars = ['★', '♥', '✓', '✗', '➜', '⚡', '🔥', '🚀'];

    // ─── Canvas setup ──────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-icons-unicode')!;
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
    const layer = new RenderLayer({ id: 'icons-unicode', options: {} });
    canvas.layers.add(layer);

    // ─── Initial shape ─────────────────────────────────────────────────────
    const settings = { char: '★' };
    const PLATE = 0x18181b;

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: PLATE },
      {
        kind: 'glyph',
        char: settings.char,
        fontFamily: 'sans-serif',
        color: 0xfbbf24,
        sizeRatio: 0.55,
      },
    ];

    layer.renderer.addShape('unicode', {
      kind: 'rect',
      x: 0,
      y: 0,
      width: 80,
      height: 80,
      cornerRadius: 12,
      fill: buildFill(),
      stroke: { color: 0x111827, width: 1 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Unicode char' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'char', chars).onChange(() => {
      layer.renderer.updateShape('unicode', { fill: buildFill() });
    });
  },
};
