import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, ShapesRenderer } from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Connectors/LineConnector' };
export default meta;
type Story = StoryObj;

export const LineConnector: Story = {
  render: () => createContainer({ id: 'cvs-renderer-line-connector' }),

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
    const SRC = { kind: 'point' as const, x: 80, y: 200 };
    const TGT = { kind: 'point' as const, x: 480, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-line-connector')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'line-connector-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#374151',
      strokeWidth: 2,
      strokeAlpha: 1.0,
      cap: 'butt' as 'butt' | 'round' | 'square',
      join: 'miter' as 'miter' | 'round' | 'bevel',
      sourceMarker: 'none' as 'none' | 'arrow' | 'circle' | 'square' | 'diamond',
      targetMarker: 'arrow' as 'none' | 'arrow' | 'circle' | 'square' | 'diamond',
      markerSize: 12,
      markerColor: '#374151',
    };

    function buildSpec() {
      const markerColor = toHex(settings.markerColor);
      return {
        kind: 'line' as const,
        router: settings.router,
        source: SRC,
        target: TGT,
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        strokeAlpha: settings.strokeAlpha,
        cap: settings.cap,
        join: settings.join,
        ...(settings.sourceMarker !== 'none' ? {
          sourceMarker: settings.sourceMarker,
          sourceMarkerOptions: { color: markerColor, size: settings.markerSize },
        } : {}),
        ...(settings.targetMarker !== 'none' ? {
          targetMarker: settings.targetMarker,
          targetMarkerOptions: { color: markerColor, size: settings.markerSize },
        } : {}),
      };
    }

    layer.renderer.addConnector('edge', buildSpec() as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeConnector('edge');
      layer.renderer.addConnector('edge', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Line connector' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
    gui.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'cap', ['butt', 'round', 'square']).onChange(redraw);
    gui.add(settings, 'join', ['miter', 'round', 'bevel']).onChange(redraw);

    const markerFolder = gui.addFolder('Markers');
    markerFolder.add(settings, 'sourceMarker', ['none', 'arrow', 'circle', 'square', 'diamond']).onChange(redraw);
    markerFolder.add(settings, 'targetMarker', ['none', 'arrow', 'circle', 'square', 'diamond']).onChange(redraw);
    markerFolder.add(settings, 'markerSize', 4, 24, 1).onChange(redraw);
    markerFolder.addColor(settings, 'markerColor').onChange(redraw);
  },
};
