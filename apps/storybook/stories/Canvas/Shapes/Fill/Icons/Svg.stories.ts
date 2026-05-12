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

const meta: Meta = { title: 'Canvas/Shapes/Fill/Icons/Svg' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'svg'` inset-content layer — an SVG
 * **path-d literal** rendered as a Pixi `Graphics` path on top of the
 * silhouette. No fetch, no parsing — the consumer hands the engine a
 * pathD string and it draws it. For fetching a remote SVG file, see the
 * `svg-url` story.
 */
export const Svg: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-svg' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-svg')!;
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
    const layer = new RenderLayer({ id: 'fill-svg', options: {} });
    canvas.layers.add(layer);

    // Hand-written 24×24 path-d strings. Multiple subpaths in one string
    // (separated by additional `M` commands) are supported — see `plus`
    // and `cross`.
    const paths: Record<string, string> = {
      triangle: 'M12 3 L21 20 L3 20 Z',
      plus:     'M12 4 V20 M4 12 H20',
      check:    'M4 12 L10 18 L20 6',
      cross:    'M5 5 L19 19 M19 5 L5 19',
      diamond:  'M12 3 L21 12 L12 21 L3 12 Z',
    };

    const settings = {
      path: 'check',
      color: 0xffffff,
      strokeWidth: 2,
      sizeRatio: 0.55,
      anchor: 'center' as InsetAnchor,
    };

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: 0x0ea5e9 },
      {
        kind: 'svg',
        pathD: paths[settings.path]!,
        viewBox: { width: 24, height: 24 },
        strokeWidth: settings.strokeWidth,
        color: settings.color,
        sizeRatio: settings.sizeRatio,
        anchor: settings.anchor,
      },
    ];

    layer.renderer.addShape('s', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 48,
      fill: buildFill(),
      stroke: { color: 0x111827, width: 1 },
    });

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'SVG (literal path-d)' });
    const repaint = () => layer.renderer.updateShape('s', { fill: buildFill() });
    gui.add(settings, 'path', Object.keys(paths)).onChange(repaint);
    gui.addColor(settings, 'color').onChange(repaint);
    gui.add(settings, 'strokeWidth', 0.5, 6, 0.5).onChange(repaint);
    gui.add(settings, 'sizeRatio', 0.1, 1, 0.01).onChange(repaint);
    gui.add(settings, 'anchor', ['center', 'top-left', 'top-right', 'bottom-left', 'bottom-right']).onChange(repaint);
  },
};
