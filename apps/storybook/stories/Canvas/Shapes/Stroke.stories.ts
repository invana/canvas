import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, ShapeStroke } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Canvas/Shapes/Stroke' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates `ShapeStroke` — the border painted around a shape's
 * silhouette. The lil-gui exposes every field on the interface so each
 * variant is reachable interactively:
 *
 * - **shape** — switches between `circle` and `rect` (the two built-in kinds).
 * - **color / alpha / width** — basic paint controls.
 * - **alignment** — `inside` / `center` / `outside` relative to the silhouette.
 * - **dashArray / dashOffset** — solid line when `dash`/`gap` are both `0`.
 * - **cap / join** — line endings and corner joins; visible with thick strokes.
 */
export const Stroke: Story = {
  render: () => createContainer({ id: 'cvs-prim-stroke' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-stroke')!;
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
    const layer = new RenderLayer({ id: 'stroke-demo', options: {} });
    canvas.layers.add(layer);

    const settings = {
      shape: 'circle' as 'circle' | 'rect',
      color: 0x4f9cf9,
      alpha: 1,
      width: 4,
      alignment: 'center' as 'inside' | 'center' | 'outside',
      dash: 0,
      gap: 0,
      dashOffset: 0,
      cap: 'butt' as 'butt' | 'round' | 'square',
      join: 'miter' as 'miter' | 'round' | 'bevel',
    };

    const buildStroke = (): ShapeStroke => ({
      color: settings.color,
      alpha: settings.alpha,
      width: settings.width,
      alignment: settings.alignment,
      dashArray:
        settings.dash > 0 || settings.gap > 0 ? [settings.dash, settings.gap] : undefined,
      dashOffset: settings.dashOffset,
      cap: settings.cap,
      join: settings.join,
    });

    const drawShape = () => {
      layer.renderer.removeShape('s');
      const stroke = buildStroke();
      const fill = { kind: 'solid' as const, color: 0x1f2937, alpha: 1 };
      if (settings.shape === 'circle') {
        layer.renderer.addShape('s', {
          kind: 'circle', x: 0, y: 0, radius: 64, fill, stroke,
        });
      } else {
        layer.renderer.addShape('s', {
          kind: 'rect', x: 0, y: 0, width: 140, height: 100, cornerRadius: 8, fill, stroke,
        });
      }
    };

    drawShape();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Stroke' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'shape', ['circle', 'rect']).onChange(drawShape);
    gui.addColor(settings, 'color').onChange(drawShape);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(drawShape);
    gui.add(settings, 'width', 0, 24, 0.5).onChange(drawShape);
    gui.add(settings, 'alignment', ['inside', 'center', 'outside']).onChange(drawShape);
    gui.add(settings, 'dash', 0, 40, 1).onChange(drawShape);
    gui.add(settings, 'gap', 0, 40, 1).onChange(drawShape);
    gui.add(settings, 'dashOffset', 0, 40, 1).onChange(drawShape);
    gui.add(settings, 'cap', ['butt', 'round', 'square']).onChange(drawShape);
    gui.add(settings, 'join', ['miter', 'round', 'bevel']).onChange(drawShape);
  },
};
