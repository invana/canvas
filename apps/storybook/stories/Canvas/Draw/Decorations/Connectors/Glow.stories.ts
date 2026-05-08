import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Connectors/Glow' };
export default meta;
type Story = StoryObj;

export const Glow: Story = {
  render: () => createContainer({ id: 'cvs-deco-conn-glow' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      ticker?: (dt: number) => void;
      protected createState() { return {}; }
      hitTest() { return null; }
      tickAnimations(dt: number) { this.ticker?.(dt); }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { x: 60, y: 200 };
    const TGT = { x: 440, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-conn-glow')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-conn-glow-layer', options: {} });
    canvas.layers.add(layer);

    // Slot Container holds the decoG below; the glow's container alpha is
    // applied to the slot once per tick (geometry stays fixed between
    // updates — only one scalar mutates per frame).
    const decoSlot = layer.createContainer('glow-slot');
    const decoG = layer.createGraphics('glow-gfx');
    decoSlot.addChild(decoG);
    const hostG = layer.createGraphics('host-gfx');

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      color: '#0ea5e9',
      width: 14,
      alphaMin: 0.35,
      alphaMax: 0.9,
      layerCount: 3,
      featherStep: 5,
      featherFalloff: 0.5,
      periodMs: 1400,
    };

    const connectorSpec = {
      kind: 'line' as const,
      source: { kind: 'point' as const, ...SRC },
      target: { kind: 'point' as const, ...TGT },
      stroke: 0x1e3a8a,
      strokeWidth: 4,
    };

    function route() {
      return settings.router === 'orthogonal' ? draw.orthogonalRouter(SRC, TGT)
        : settings.router === 'bezier' ? draw.bezierRouter(SRC, TGT)
        : draw.straightRouter(SRC, TGT);
    }

    function rebuild() {
      const polyline = route();
      hostG.clear();
      draw.drawLineConnector(hostG, polyline, connectorSpec);

      const deco = new draw.PulsatingGlowConnectorDecoration({
        color: toHex(settings.color),
        width: settings.width,
        alphaMin: settings.alphaMin,
        alphaMax: settings.alphaMax,
        layerCount: settings.layerCount,
        featherStep: settings.featherStep,
        featherFalloff: settings.featherFalloff,
        periodMs: settings.periodMs,
      });

      // Stacked layer geometry is fixed per rebuild; only the slot's alpha
      // changes per tick, so we paint once here and modulate alpha below.
      decoG.clear();
      for (const style of deco.styles(0)) {
        draw.paintCenterline(decoG, polyline, style);
      }
      decoSlot.alpha = deco.containerAlpha();

      layer.ticker = (dt) => {
        deco.tick(dt);
        decoSlot.alpha = deco.containerAlpha();
      };
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Pulsating glow (connector)' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 1, 40, 1).onChange(rebuild);
    gui.add(settings, 'alphaMin', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'alphaMax', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'layerCount', 0, 8, 1).onChange(rebuild);
    gui.add(settings, 'featherStep', 0, 20, 1).onChange(rebuild);
    gui.add(settings, 'featherFalloff', 0.1, 1, 0.05).onChange(rebuild);
    gui.add(settings, 'periodMs', 200, 5000, 50).onChange(rebuild);
  },
};
