import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Connectors/Line' };
export default meta;
type Story = StoryObj;

export const Line: Story = {
  render: () => createContainer({ id: 'cvs-draw-line' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { x: 80, y: 200 };
    const TGT = { x: 480, y: 340 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-draw-line')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'line-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('line-gfx');

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      strokeColor: '#4f9cf9',
      strokeWidth: 2,
      strokeAlpha: 1.0,
      cap: 'butt' as 'butt' | 'round' | 'square',
      join: 'miter' as 'miter' | 'round' | 'bevel',
    };

    function redraw() {
      g.clear();
      const polyline =
        settings.router === 'orthogonal' ? draw.orthogonalRouter(SRC, TGT) :
        settings.router === 'bezier'     ? draw.bezierRouter(SRC, TGT)     :
                                           draw.straightRouter(SRC, TGT);
      draw.drawLineConnector(g, polyline, {
        kind: 'line',
        source: { kind: 'point', ...SRC },
        target: { kind: 'point', ...TGT },
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        strokeAlpha: settings.strokeAlpha,
        cap: settings.cap,
        join: settings.join,
      });
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'Line connector' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
    gui.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(redraw);
    gui.add(settings, 'cap', ['butt', 'round', 'square']).onChange(redraw);
    gui.add(settings, 'join', ['miter', 'round', 'bevel']).onChange(redraw);
  },
};
