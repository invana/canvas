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

const meta: Meta = { title: 'Canvas/Primitives/Shapes/Fill/Icons' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'svg-url'` fill layer — the consumer
 * supplies a URL to **their own** remote SVG and the engine fetches,
 * parses, and renders it as a vector path on the GPU. Results are cached
 * globally per URL.
 *
 * The dropdown holds five sample SVGs from neutral public sources
 * (Wikimedia Commons public-domain artwork) — chosen deliberately to avoid
 * any icon library. The capability has nothing to do with curated icon
 * packs; this story just shows that *any* CORS-friendly SVG URL works.
 */
export const SvgUrl: Story = {
  render: () => createContainer({ id: 'cvs-prim-icons-svg' }),

  play: async ({ canvasElement }) => {
    // ─── Sample SVG URLs (Wikimedia Commons public-domain artwork) ─────────
    //
    // upload.wikimedia.org sends `Access-Control-Allow-Origin: *` so the
    // fetch isn't blocked in the storybook iframe. These are deliberately
    // *not* from any icon library — they're hand-drawn artwork the engine
    // has no special knowledge of. Swap in any other SVG URL you want.
    const samples: Record<string, string> = {
      heart:    'https://upload.wikimedia.org/wikipedia/commons/4/42/Love_Heart_SVG.svg',
      smiley:   'https://upload.wikimedia.org/wikipedia/commons/8/85/Smiley.svg',
      sun:      'https://upload.wikimedia.org/wikipedia/commons/0/02/Sun01.svg',
      svgLogo:  'https://upload.wikimedia.org/wikipedia/commons/0/02/SVG_logo.svg',
      flagJp:   'https://upload.wikimedia.org/wikipedia/commons/9/9e/Flag_of_Japan.svg',
    };

    // ─── Canvas setup ──────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-icons-svg')!;
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
    const layer = new RenderLayer({ id: 'icons-svg', options: {} });
    canvas.layers.add(layer);

    // ─── Initial shape ─────────────────────────────────────────────────────
    const settings = { sample: 'heart' as keyof typeof samples };
    const PLATE = 0x0ea5e9;

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: PLATE },
      {
        kind: 'svg-url',
        url: samples[settings.sample]!,
        strokeWidth: 2,
        color: 0xffffff,
        sizeRatio: 0.6,
      },
    ];

    layer.renderer.addShape('svg', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 48,
      fill: buildFill(),
      stroke: { color: 0x111827, width: 1 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Remote SVG' });
    gui.add(settings, 'sample', Object.keys(samples)).onChange(() => {
      layer.renderer.updateShape('svg', { fill: buildFill() });
    });
  },
};
