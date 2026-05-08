import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Connectors/Ring' };
export default meta;
type Story = StoryObj;

export const Ring: Story = {
  render: () => createContainer({ id: 'cvs-deco-conn-ring' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { x: 60, y: 200 };
    const TGT = { x: 440, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-conn-ring')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-conn-ring-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    const decoG = layer.createGraphics('ring-gfx');

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      color: '#f43f5e',
      width: 2,
      alpha: 1,
      inset: 6,
      ringCount: 1,
      ringSpacing: 6,
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

    function redraw() {
      const polyline = route();
      hostG.clear();
      draw.drawLineConnector(hostG, polyline, connectorSpec);
      decoG.clear();
      draw.drawRingConnector(decoG, polyline, {
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        inset: settings.inset,
        ringCount: settings.ringCount,
        ringSpacing: settings.ringSpacing,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Ring (connector)' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.addColor(settings, 'color').onChange(redraw);
    gui.add(settings, 'width', 0, 20, 1).onChange(redraw);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'inset', 0, 30, 1).onChange(redraw);
    gui.add(settings, 'ringCount', 1, 5, 1).onChange(redraw);
    gui.add(settings, 'ringSpacing', 0, 30, 1).onChange(redraw);
  },
};
