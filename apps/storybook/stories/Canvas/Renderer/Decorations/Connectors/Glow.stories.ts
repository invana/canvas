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

const meta: Meta = { title: 'Canvas/Renderer/Decorations/Connectors/Glow' };
export default meta;
type Story = StoryObj;

export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-renderer-deco-conn-glow' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-renderer-deco-conn-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'renderer-deco-conn-glow-layer', options: {} });
    canvas.layers.add(layer);

    const settings = {
      kind: 'line' as 'line' | 'curve',
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#0f172a',
      strokeWidth: 3,
      glowColor: '#0ea5e9',
      glowWidth: 14,
      alphaMin: 0.35,
      alphaMax: 0.9,
      layerCount: 3,
      featherStep: 5,
      featherFalloff: 0.5,
      periodMs: 1400,
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
      layer.renderer.setDecoration('edge', 'glow', {
        kind: 'pulsating-glow',
        style: {
          color: toHex(settings.glowColor),
          width: settings.glowWidth,
          alphaMin: settings.alphaMin,
          alphaMax: settings.alphaMax,
          layerCount: settings.layerCount,
          featherStep: settings.featherStep,
          featherFalloff: settings.featherFalloff,
          periodMs: settings.periodMs,
        },
      });
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Pulsating glow' });
    gui.add(settings, 'kind', ['line', 'curve']).onChange(rebuild);
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'strokeColor').onChange(rebuild);
    gui.add(settings, 'strokeWidth', 1, 12, 1).onChange(rebuild);
    const glowFolder = gui.addFolder('Glow');
    glowFolder.addColor(settings, 'glowColor').onChange(applyDecoration);
    glowFolder.add(settings, 'glowWidth', 4, 40, 1).onChange(applyDecoration);
    glowFolder.add(settings, 'alphaMin', 0, 1, 0.01).onChange(applyDecoration);
    glowFolder.add(settings, 'alphaMax', 0, 1, 0.01).onChange(applyDecoration);
    glowFolder.add(settings, 'layerCount', 0, 8, 1).onChange(applyDecoration);
    glowFolder.add(settings, 'featherStep', 0, 20, 1).onChange(applyDecoration);
    glowFolder.add(settings, 'featherFalloff', 0.1, 1, 0.05).onChange(applyDecoration);
    glowFolder.add(settings, 'periodMs', 200, 4000, 50).onChange(applyDecoration);
  },
};
