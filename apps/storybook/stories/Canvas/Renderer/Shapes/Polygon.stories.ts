import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Shapes/Polygon' };
export default meta;
type Story = StoryObj;

export const Polygon: Story = {
  render: () => createContainer({ id: 'cvs-renderer-shape-polygon' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-shape-polygon')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'polygon', options: {} });
    canvas.layers.add(layer);

    const settings = { fillColor: '#4f9cf9', strokeColor: '#1e3a8a', strokeWidth: 2 };

    function buildSpec() {
      return {
        kind: 'polygon' as const,
        x: 0, y: 0,
        points: [
          { x:  0,    y: -55 },
          { x:  47.6, y: -27.5 },
          { x:  47.6, y:  27.5 },
          { x:  0,    y:  55 },
          { x: -47.6, y:  27.5 },
          { x: -47.6, y: -27.5 },
        ],
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

    const gui = new GUI({ title: 'Polygon (hexagon)' });
    gui.addColor(settings, 'fillColor').onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 0, 20, 1).onChange(redraw);
  },
};
