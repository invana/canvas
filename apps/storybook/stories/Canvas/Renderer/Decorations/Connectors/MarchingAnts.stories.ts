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

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Connectors/MarchingAnts' };
export default meta;
type Story = StoryObj;

export const MarchingAnts: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-conn-marching-ants' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-conn-marching-ants')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-conn-marching-ants-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'curve' as 'line' | 'curve',
      router: 'orthogonal' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#94a3b8',
      strokeWidth: 2,
      antsColor: '#0ea5e9',
      antsWidth: 2,
      dashLength: 8,
      gapLength: 6,
      speed: 0.05,
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
      layer.renderer.setDecoration('edge', 'fx', {
        kind: 'marching-ants-connector',
        style: {
          color: toHex(settings.antsColor),
          width: settings.antsWidth,
          dashLength: settings.dashLength,
          gapLength: settings.gapLength,
          speed: settings.speed,
          cap: 'round',
        },
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Marching ants' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(rebuild);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'strokeColor').onChange(rebuild);
    gui.add(settings, 'strokeWidth', 1, 12, 1).onChange(rebuild);
    const antsFolder = gui.addFolder('Ants');
    antsFolder.addColor(settings, 'antsColor').onChange(applyDecoration);
    antsFolder.add(settings, 'antsWidth', 0.5, 8, 0.5).onChange(applyDecoration);
    antsFolder.add(settings, 'dashLength', 1, 40, 1).onChange(applyDecoration);
    antsFolder.add(settings, 'gapLength', 1, 40, 1).onChange(applyDecoration);
    antsFolder.add(settings, 'speed', 0, 0.3, 0.005).onChange(applyDecoration);
  },
};
