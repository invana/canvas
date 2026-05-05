import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Routers' };
export default meta;
type Story = StoryObj;

export const Routers: Story = {
  render: () => createContainer({ id: 'cvs-routers' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-routers')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'routers', options: {} });
    canvas.layers.add(layer);

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      targetX: 400,
      targetY: 300,
      strokeColor: '#374151',
      strokeWidth: 2,
    };

    function buildSpec() {
      return {
        kind: settings.router === 'bezier' ? 'curve' : 'line',
        router: settings.router,
        source: { kind: 'point' as const, x: 80, y: 100 },
        target: { kind: 'point' as const, x: settings.targetX, y: settings.targetY },
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        targetMarker: 'arrow',
        targetMarkerOptions: { color: toHex(settings.strokeColor), size: 12 },
      };
    }

    layer.renderer.addConnector('edge', buildSpec() as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeConnector('edge');
      layer.renderer.addConnector('edge', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Router' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.add(settings, 'targetX', 100, 600, 1).onChange(redraw);
    gui.add(settings, 'targetY', 100, 500, 1).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
  },
};
