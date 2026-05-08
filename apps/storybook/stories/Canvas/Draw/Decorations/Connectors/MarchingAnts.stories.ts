import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, draw } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Draw/Decorations/Connectors/MarchingAnts' };
export default meta;
type Story = StoryObj;

export const MarchingAnts: Story = {
  render: () => createContainer({ id: 'cvs-deco-conn-marching-ants' }),

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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-conn-marching-ants')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new DrawLayer({ id: 'deco-conn-ants-layer', options: {} });
    canvas.layers.add(layer);

    const hostG = layer.createGraphics('host-gfx');
    const decoG = layer.createGraphics('ants-gfx');

    const settings = {
      router: 'straight' as 'straight' | 'orthogonal' | 'bezier',
      color: '#f43f5e',
      width: 1.5,
      alpha: 1,
      dashLength: 6,
      gapLength: 4,
      speed: 0.04,
      cap: 'butt' as 'butt' | 'round' | 'square',
      join: 'miter' as 'miter' | 'round' | 'bevel',
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

      const deco = new draw.MarchingAntsConnectorDecoration({
        color: toHex(settings.color),
        width: settings.width,
        alpha: settings.alpha,
        dashLength: settings.dashLength,
        gapLength: settings.gapLength,
        speed: settings.speed,
        cap: settings.cap,
        join: settings.join,
      });
      // The decoration owns animation state + emits a `ConnectorPaintStyle`.
      // We route the style to the draw-layer `paintCenterline` helper here;
      // the renderer routes the same style through `IConnector.paintInto`.
      layer.ticker = (dt) => {
        deco.tick(dt);
        decoG.clear();
        const style = deco.style();
        if (style) draw.paintCenterline(decoG, polyline, style);
      };
    }

    rebuild();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Marching ants (connector)' });
    gui.add(settings, 'router', ['straight', 'orthogonal', 'bezier']).onChange(rebuild);
    gui.addColor(settings, 'color').onChange(rebuild);
    gui.add(settings, 'width', 0, 10, 0.5).onChange(rebuild);
    gui.add(settings, 'alpha', 0, 1, 0.01).onChange(rebuild);
    gui.add(settings, 'dashLength', 1, 30, 1).onChange(rebuild);
    gui.add(settings, 'gapLength', 1, 30, 1).onChange(rebuild);
    gui.add(settings, 'speed', 0, 0.2, 0.005).onChange(rebuild);
    gui.add(settings, 'cap', ['butt', 'round', 'square']).onChange(rebuild);
    gui.add(settings, 'join', ['miter', 'round', 'bevel']).onChange(rebuild);
  },
};
