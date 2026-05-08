import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  ShapesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Connectors/Breathing' };
export default meta;
type Story = StoryObj;

export const Breathing: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-conn-breathing' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-conn-breathing')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-conn-breathing-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'line' as 'line' | 'curve',
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#1e3a8a',
      strokeWidth: 4,
      color: '#34d399',
      width: 2,
      alpha: 0.9,
      minPadding: 2,
      maxPadding: 12,
      periodMs: 1800,
    };

    function buildSpec() {
      return {
        kind: settings.kind,
        router: settings.router,
        source: SRC,
        target: TGT,
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        strokeAlpha: 1,
        cap: 'round' as const,
        targetMarker: arrowMarkerSpec(14, { color: toHex(settings.strokeColor) }),
      };
    }

    function rebuild() {
      if (layer.renderer.hasConnector('edge')) layer.renderer.removeConnector('edge');
      layer.renderer.addConnector('edge', buildSpec() as never);
      applyDecoration();
    }

    function applyDecoration() {
      layer.renderer.setDecoration('edge', 'breathing', {
        kind: 'breathing-connector',
        style: {
          color: toHex(settings.color),
          width: settings.width,
          alpha: settings.alpha,
          minPadding: settings.minPadding,
          maxPadding: settings.maxPadding,
          periodMs: settings.periodMs,
        },
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Breathing (connector)' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(rebuild);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'strokeColor').onChange(rebuild);
    gui.add(settings, 'strokeWidth', 1, 12, 1).onChange(rebuild);
    const breathingFolder = gui.addFolder('Breathing');
    breathingFolder.addColor(settings, 'color').onChange(applyDecoration);
    breathingFolder.add(settings, 'width', 0, 10, 0.5).onChange(applyDecoration);
    breathingFolder.add(settings, 'alpha', 0, 1, 0.01).onChange(applyDecoration);
    breathingFolder.add(settings, 'minPadding', 0, 30, 1).onChange(applyDecoration);
    breathingFolder.add(settings, 'maxPadding', 5, 60, 1).onChange(applyDecoration);
    breathingFolder.add(settings, 'periodMs', 200, 5000, 100).onChange(applyDecoration);
  },
};
