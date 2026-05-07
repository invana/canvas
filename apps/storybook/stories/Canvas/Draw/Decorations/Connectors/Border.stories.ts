import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Connectors/Border' };
export default meta;
type Story = StoryObj;

export const Border: Story = {
  render: () => createContainer({ id: 'cvs-deco-conn-border' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { x: 60, y: 200 };
    const TGT = { x: 440, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-conn-border')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-conn-border-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    const decoG = layer.createGraphics('border-gfx');

    const polyline = draw.straightRouter(SRC, TGT);
    const connectorSpec = {
      kind: 'line' as const,
      source: { kind: 'point' as const, ...SRC },
      target: { kind: 'point' as const, ...TGT },
      stroke: 0x1e3a8a,
      strokeWidth: 4,
    };
    const bounds = draw.lineConnectorBounds(polyline, connectorSpec);

    const settings = { color: '#f43f5e', width: 2, alpha: 1, cornerRadius: 0, inset: -6 };

    function redraw() {
      hostG.clear();
      draw.drawLineConnector(hostG, polyline, connectorSpec);
      decoG.clear();
      draw.drawBorder(decoG, bounds, {
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        cornerRadius: settings.cornerRadius,
        inset: settings.inset,
      }, 'line');
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Border (connector AABB)' });
    gui.addColor(settings, 'color').onChange(redraw);
    gui.add(settings, 'width', 0, 20, 1).onChange(redraw);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'cornerRadius', 0, 40, 1).onChange(redraw);
    gui.add(settings, 'inset', -20, 20, 1).onChange(redraw);
  },
};
