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

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Connectors/PulseRing' };
export default meta;
type Story = StoryObj;

export const PulseRing: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-conn-pulse-ring' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-conn-pulse-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-conn-pulse-ring-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'line' as 'line' | 'curve',
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#1e3a8a',
      strokeWidth: 4,
      color: '#a78bfa',
      width: 2,
      alpha: 0.6,
      startPadding: 0,
      endPadding: 24,
      periodMs: 1500,
      ringCount: 1,
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
      layer.renderer.setDecoration('edge', 'pulse', {
        kind: 'pulse-ring-connector',
        style: {
          color: toHex(settings.color),
          width: settings.width,
          alpha: settings.alpha,
          startPadding: settings.startPadding,
          endPadding: settings.endPadding,
          periodMs: settings.periodMs,
          ringCount: settings.ringCount,
        },
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Pulse ring (connector)' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(rebuild);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'strokeColor').onChange(rebuild);
    gui.add(settings, 'strokeWidth', 1, 12, 1).onChange(rebuild);
    const pulseFolder = gui.addFolder('Pulse');
    pulseFolder.addColor(settings, 'color').onChange(applyDecoration);
    pulseFolder.add(settings, 'width', 0, 10, 0.5).onChange(applyDecoration);
    pulseFolder.add(settings, 'alpha', 0, 1, 0.01).onChange(applyDecoration);
    pulseFolder.add(settings, 'startPadding', 0, 30, 1).onChange(applyDecoration);
    pulseFolder.add(settings, 'endPadding', 10, 80, 1).onChange(applyDecoration);
    pulseFolder.add(settings, 'periodMs', 200, 5000, 100).onChange(applyDecoration);
    pulseFolder.add(settings, 'ringCount', 1, 5, 1).onChange(applyDecoration);
  },
};
