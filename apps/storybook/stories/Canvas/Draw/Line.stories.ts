import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Line' };
export default meta;
type Story = StoryObj;

export const Line: Story = {
  render: () => createContainer({ id: 'cvs-line' }),

  play: async ({ canvasElement }) => {
    class DrawLayer extends WorldLayer {
      protected createState() { return {}; }
      hitTest() { return null; }
    }

    const toHex = (s: string) => parseInt(s.slice(1), 16);
    const SRC = { x: 60, y: 0 };
    const TGT = { x: 500, y: 120 };

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-line')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'line-layer', options: {} });
    canvas.layers.add(layer);
    const g = layer.createGraphics('line-gfx');

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      connector: 'line' as 'line' | 'curve',
      strokeColor: '#4f9cf9',
      strokeWidth: 2,
      strokeAlpha: 1.0,
    };

    function redraw() {
      g.clear();
      const polyline =
        settings.router === 'orthogonal' ? draw.orthogonalRouter(SRC, TGT) :
        settings.router === 'bezier'     ? draw.bezierRouter(SRC, TGT)     :
                                           draw.straightRouter(SRC, TGT);

      const spec = {
        source: { kind: 'point' as const, ...SRC },
        target: { kind: 'point' as const, ...TGT },
        stroke: toHex(settings.strokeColor),
        strokeWidth: settings.strokeWidth,
        strokeAlpha: settings.strokeAlpha,
      };

      if (settings.connector === 'curve') {
        draw.drawCurveConnector(g, polyline, { kind: 'curve', ...spec });
      } else {
        draw.drawLineConnector(g, polyline, { kind: 'line', ...spec });
      }
    }

    redraw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Line connector' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(redraw);
    gui.add(settings, 'connector', ['line', 'curve']).onChange(redraw);
    gui.addColor(settings, 'strokeColor').onChange(redraw);
    gui.add(settings, 'strokeWidth', 1, 20, 1).onChange(redraw);
    gui.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(redraw);
  },
};
