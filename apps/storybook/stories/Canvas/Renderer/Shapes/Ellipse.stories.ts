import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Shapes/Ellipse' };
export default meta;
type Story = StoryObj;

export const Ellipse: Story = {
  render: () => createContainer({ id: 'cvs-renderer-shape-ellipse' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: ShapesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new ShapesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-shape-ellipse')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'ellipse', options: {} });
    canvas.layers.add(layer);

    const settings = { fillColor: '#4f9cf9', strokeColor: '#1e3a8a', strokeWidth: 2, rx: 70, ry: 40 };

    function buildSpec() {
      return {
        kind: 'ellipse' as const,
        x: 0, y: 0,
        rx: settings.rx,
        ry: settings.ry,
        fill: toHex(settings.fillColor),
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
      };
    }

    layer.renderer.addShape('s', buildSpec() as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeShape('s');
      layer.renderer.addShape('s', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Ellipse' });
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
    gui.add(settings, 'rx', 10, 200, 1).onChange(redraw);
    gui.add(settings, 'ry', 10, 200, 1).onChange(redraw);
  },
};
