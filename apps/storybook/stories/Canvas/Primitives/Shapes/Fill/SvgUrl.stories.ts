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
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Shapes/Fill/SvgUrl' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'svg-url'` inset-content layer — the
 * consumer supplies a **URL** to a remote SVG and the engine fetches,
 * extracts every drawing primitive, builds a path-d, and renders as a
 * Pixi `Graphics` path. Result is cached globally per URL; subsequent
 * shapes reusing the same URL skip the fetch.
 */
export const SvgUrl: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-svg-url' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-svg-url')!;
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
    const layer = new RenderLayer({ id: 'fill-svg-url', options: {} });
    canvas.layers.add(layer);

    // Wikimedia Commons public-domain SVGs — neutral artwork, not from
    // any icon library. upload.wikimedia.org sends permissive CORS so
    // the fetch isn't blocked in the storybook iframe.
    const samples: Record<string, string> = {
      heart:    'https://upload.wikimedia.org/wikipedia/commons/4/42/Love_Heart_SVG.svg',
      smiley:   'https://upload.wikimedia.org/wikipedia/commons/3/3f/Smiley.svg',
      sun:      'https://upload.wikimedia.org/wikipedia/commons/d/d1/Sun01.svg',
      svgLogo:  'https://upload.wikimedia.org/wikipedia/commons/0/01/SVG_logo.svg',
      flagJp:   'https://upload.wikimedia.org/wikipedia/commons/9/9a/Flag_of_Japan.svg',
    };

    const settings = {
      sample: 'heart' as keyof typeof samples,
      color: 0xffffff,
      strokeWidth: 2,
      sizeRatio: 0.6,
      anchor: 'center' as InsetAnchor,
    };

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: 0x0ea5e9 },
      {
        kind: 'svg-url',
        url: samples[settings.sample]!,
        strokeWidth: settings.strokeWidth,
        color: settings.color,
        sizeRatio: settings.sizeRatio,
        anchor: settings.anchor,
      },
    ];

    layer.renderer.addShape('u', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 56,
      fill: buildFill(),
      stroke: { color: 0x111827, width: 1 },
    });

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Remote SVG' });
    const repaint = () => layer.renderer.updateShape('u', { fill: buildFill() });
    gui.add(settings, 'sample', Object.keys(samples)).onChange(repaint);
    gui.addColor(settings, 'color').onChange(repaint);
    gui.add(settings, 'strokeWidth', 0.5, 6, 0.5).onChange(repaint);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.01).onChange(repaint);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(repaint);
  },
};
