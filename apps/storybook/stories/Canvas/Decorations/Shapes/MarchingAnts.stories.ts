import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Shapes/MarchingAnts' };
export default meta;
type Story = StoryObj;

/**
 * `MarchingAntsDecoration` traces the host silhouette with a dashed
 * stroke whose `dashOffset` advances each frame, producing the classic
 * selection-marquee crawl. Works on every shape that implements
 * `paintInto` — here demonstrated on `circle` and `rect`. Set
 * `speedPxPerSec` to a negative value to reverse the march direction.
 */
export const MarchingAnts: Story = {
  render: () => createContainer({ id: 'cvs-deco-marching-ants' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-marching-ants')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'marching-ants', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('circle-host', {
      kind: 'circle', x: -90, y: 0, radius: 44,
      fill: { kind: 'solid', color: 0x4f9cf9 },
    });
    layer.renderer.addShape('rect-host', {
      kind: 'rect', x: 30, y: -44, width: 120, height: 88, cornerRadius: 12,
      fill: { kind: 'solid', color: 0xfde68a },
    });

    const settings = {
      color: 0x111827,
      strokeWidth: 1.5,
      dashLength: 6,
      gapLength: 4,
      speedPxPerSec: 24,
      inset: -4,
      alpha: 1,
    };

    const apply = () => {
      const style = { ...settings };
      layer.renderer.setDecoration('circle-host', 'marching-ants', {
        kind: 'marching-ants',
        style,
      });
      layer.renderer.setDecoration('rect-host', 'marching-ants', {
        kind: 'marching-ants',
        style,
      });
    };
    apply();

    const gui = new GUI({ title: 'MarchingAnts' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'strokeWidth', 0.5, 6, 0.5).onChange(apply);
    gui.add(settings, 'dashLength', 1, 24, 0.5).onChange(apply);
    gui.add(settings, 'gapLength', 1, 24, 0.5).onChange(apply);
    gui.add(settings, 'speedPxPerSec', -120, 120, 2).onChange(apply);
    gui.add(settings, 'inset', -20, 20, 1).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
