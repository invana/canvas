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
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Concepts/Shapes/Fill/Solid' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'solid'` silhouette-filler — a flat
 * colour painted into the shape's silhouette via Pixi `g.fill()`. The
 * `number` shorthand (e.g. `fill: 0x4f9cf9`) collapses to the same thing.
 */
export const Solid: Story = {
  render: () => createContainer({ id: 'cvs-prim-fill-solid' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-fill-solid')!;
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
    const layer = new RenderLayer({ id: 'fill-solid', options: {} });
    canvas.layers.add(layer);

    const settings = {
      color: 0x4f9cf9,
      alpha: 1,
      strokeColor: 0x111827,
      strokeWidth: 2,
    };

    const buildFill = (): ShapeFillLayer => ({
      kind: 'solid',
      color: settings.color,
      alpha: settings.alpha,
    });

    layer.renderer.addShape('s', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 64,
      fill: buildFill(),
      stroke: { color: settings.strokeColor, width: settings.strokeWidth },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Solid fill' });
    onStoryTeardown(() => gui.destroy());
    const repaint = () =>
      layer.renderer.updateShape('s', {
        fill: buildFill(),
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
      });
    gui.addColor(settings, 'color').onChange(repaint);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(repaint);
    gui.addColor(settings, 'strokeColor').onChange(repaint);
    gui.add(settings, 'strokeWidth', 0, 8, 0.5).onChange(repaint);
  },
};
