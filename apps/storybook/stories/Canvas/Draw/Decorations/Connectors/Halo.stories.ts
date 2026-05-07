import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Connectors/Halo' };
export default meta;
type Story = StoryObj;

export const Halo: Story = {
  render: () => createContainer({ id: 'cvs-deco-conn-halo' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { x: 60, y: 200 };
    const TGT = { x: 440, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-conn-halo')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-conn-halo-layer', options: {} });
    canvas.layers.add(layer);

    const decoG = layer.createGraphics('halo-gfx');
    const hostG = layer.createGraphics('host-gfx');

    const polyline = draw.straightRouter(SRC, TGT);
    const connectorSpec = {
      kind: 'line' as const,
      source: { kind: 'point' as const, ...SRC },
      target: { kind: 'point' as const, ...TGT },
      stroke: 0x1e3a8a,
      strokeWidth: 4,
    };
    const bounds = draw.lineConnectorBounds(polyline, connectorSpec);

    const settings = { color: '#f59e0b', alpha: 0.4, padding: 8 };

    function redraw() {
      hostG.clear();
      draw.drawLineConnector(hostG, polyline, connectorSpec);
      decoG.clear();
      draw.drawHalo(decoG, bounds, {
        color: toHex(settings.color),
        alpha: settings.alpha,
        padding: settings.padding,
      }, 'line');
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Halo (connector AABB)' });
    gui.addColor(settings, 'color').onChange(redraw);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'padding', 0, 40, 1).onChange(redraw);
  },
};
