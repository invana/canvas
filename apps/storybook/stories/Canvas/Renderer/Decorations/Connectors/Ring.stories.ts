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

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Connectors/Ring' };
export default meta;
type Story = StoryObj;

export const Ring: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-conn-ring' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-conn-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-conn-ring-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'line' as 'line' | 'curve',
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#1e3a8a',
      strokeWidth: 4,
      color: '#f43f5e',
      width: 1,
      alpha: 1,
      inset: 4,
      ringCount: 1,
      ringSpacing: 6,
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
      layer.renderer.setDecoration('edge', 'ring', {
        kind: 'ring-connector',
        style: {
          color: toHex(settings.color),
          width: settings.width,
          alpha: settings.alpha,
          inset: settings.inset,
          ringCount: settings.ringCount,
          ringSpacing: settings.ringSpacing,
        },
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Ring (connector)' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(rebuild);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'strokeColor').onChange(rebuild);
    gui.add(settings, 'strokeWidth', 1, 12, 1).onChange(rebuild);
    const ringFolder = gui.addFolder('Ring');
    ringFolder.addColor(settings, 'color').onChange(applyDecoration);
    ringFolder.add(settings, 'width', 0, 20, 1).onChange(applyDecoration);
    ringFolder.add(settings, 'alpha', 0, 1, 0.01).onChange(applyDecoration);
    ringFolder.add(settings, 'inset', -20, 30, 1).onChange(applyDecoration);
    ringFolder.add(settings, 'ringCount', 1, 5, 1).onChange(applyDecoration);
    ringFolder.add(settings, 'ringSpacing', 0, 30, 1).onChange(applyDecoration);
  },
};
