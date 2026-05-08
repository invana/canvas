import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Connectors/PulseRing' };
export default meta;
type Story = StoryObj;

export const PulseRing: Story = {
  render: () => createContainer({ id: 'cvs-deco-conn-pulse-ring' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-conn-pulse-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-conn-pulse-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    const decoG = layer.createGraphics('pulse-gfx');

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      color: '#a78bfa',
      width: 2,
      alpha: 0.6,
      startPadding: 0,
      endPadding: 24,
      periodMs: 1500,
      ringCount: 1,
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

      const deco = new draw.PulseRingConnectorDecoration({
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        startPadding: settings.startPadding,
        endPadding: settings.endPadding,
        periodMs: settings.periodMs,
        ringCount: settings.ringCount,
      });
      // Each ring is at a different point in the staggered cycle, so the
      // decoration emits N styles per tick (one per ring).
      layer.ticker = (dt) => {
        deco.tick(dt);
        decoG.clear();
        for (const style of deco.styles(0)) {
          draw.paintCenterline(decoG, polyline, style);
        }
      };
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Pulse ring (connector)' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 0, 10, 1).onChange(rebuild);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'startPadding', 0, 30, 1).onChange(rebuild);
    gui.add(settings, 'endPadding', 10, 80, 1).onChange(rebuild);
    gui.add(settings, 'periodMs', 200, 5000, 100).onChange(rebuild);
    gui.add(settings, 'ringCount', 1, 5, 1).onChange(rebuild);
  },
};
