import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  ShapesRenderer,
  arrowMarkerSpec,
  circleMarkerSpec,
  squareMarkerSpec,
  diamondMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext, MarkerShapeSpec } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Connectors/DashedConnector' };
export default meta;
type Story = StoryObj;

export const DashedConnector: Story = {
  render: () => createContainer({ id: 'cvs-renderer-dashed-connector' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-dashed-connector')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'dashed-connector-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'line' as 'line' | 'curve',
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#374151',
      strokeWidth: 3,
      strokeAlpha: 1.0,
      dashLength: 12,
      gapLength: 6,
      sourceMarker: 'none' as 'none' | 'arrow' | 'circle' | 'square' | 'diamond',
      targetMarker: 'arrow' as 'none' | 'arrow' | 'circle' | 'square' | 'diamond',
      markerSize: 14,
      markerColor: '#374151',
    };

    function markerOf(kind: typeof settings.sourceMarker): MarkerShapeSpec | undefined {
      const opts = { color: toHex(settings.markerColor) };
      switch (kind) {
        case 'arrow': return arrowMarkerSpec(settings.markerSize, opts);
        case 'circle': return circleMarkerSpec(settings.markerSize, opts);
        case 'square': return squareMarkerSpec(settings.markerSize, opts);
        case 'diamond': return diamondMarkerSpec(settings.markerSize, opts);
        default: return undefined;
      }
    }

    function buildSpec() {
      return {
        kind: settings.kind,
        router: settings.router,
        source: SRC,
        target: TGT,
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        strokeAlpha: settings.strokeAlpha,
        dash: { dashLength: settings.dashLength, gapLength: settings.gapLength },
        sourceMarker: markerOf(settings.sourceMarker),
        targetMarker: markerOf(settings.targetMarker),
      };
    }

    layer.renderer.addConnector('edge', buildSpec() as never);
    canvas.camera.fitContent(layer.getBounds(), 100);

    function redraw() {
      layer.renderer.removeConnector('edge');
      layer.renderer.addConnector('edge', buildSpec() as never);
    }

    const gui = new GUI({ title: 'Dashed connector' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(redraw);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
    gui.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'dashLength', 1, 40, 1).onChange(redraw);
    gui.add(settings, 'gapLength', 1, 40, 1).onChange(redraw);

    const markerFolder = gui.addFolder('Markers');
    markerFolder.add(settings, 'sourceMarker', ['none', 'arrow', 'circle', 'square', 'diamond']).onChange(redraw);
    markerFolder.add(settings, 'targetMarker', ['none', 'arrow', 'circle', 'square', 'diamond']).onChange(redraw);
    markerFolder.add(settings, 'markerSize', 4, 24, 1).onChange(redraw);
    markerFolder.addColor(settings, 'markerColor').onChange(redraw);
  },
};
