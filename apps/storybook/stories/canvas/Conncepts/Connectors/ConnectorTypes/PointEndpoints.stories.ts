import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, arrowMarkerSpec,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/ConnectorTypes/PointEndpoints' };
export default meta;
type Story = StoryObj;

/**
 * Connector with literal `kind: 'point'` endpoints rather than shape ids —
 * useful for free-floating connectors, debug overlays, or annotations.
 * `anchor` doesn't apply here (no shape to anchor to); position the
 * endpoints directly via the gui or programmatically. All settings are in
 * the gui.
 */
export const PointEndpointsStory: Story = {
  name: 'PointEndpoints',
  render: () => createContainer({ id: 'cvs-prim-connector-point-endpoints' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-connector-point-endpoints')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'connector-point-endpoints', options: {} });
    canvas.layers.add(layer);

    const settings = {
      // endpoints
      sourceX: -150,
      sourceY: 0,
      targetX: 150,
      targetY: 0,
      // router
      router: 'straight' as 'straight' | 'orth',
      // pathStyle
      pathStyle: 'normal' as 'normal' | 'rounded' | 'bezier' | 'smooth',
      roundedRadius: 12,
      bezierAxis: 'auto' as 'auto' | 'h' | 'v',
      bezierTension: 0.5,
      smoothTension: 1,
      // stroke
      strokeColor: 0x111827,
      strokeWidth: 2,
      // marker
      showSourceMarker: false,
      showTargetMarker: true,
      markerLengthScale: 4,
      markerWidthScale: 3
    };

    const buildSpec = () => {
      const pathStyleOpts: Record<string, unknown> = {};
      if (settings.pathStyle === 'rounded') pathStyleOpts.radius = settings.roundedRadius;
      if (settings.pathStyle === 'bezier') {
        pathStyleOpts.axis = settings.bezierAxis;
        pathStyleOpts.tension = settings.bezierTension;
      }
      if (settings.pathStyle === 'smooth') pathStyleOpts.tension = settings.smoothTension;

      return {
        kind: 'connector' as const,
        router: settings.router,
        pathStyle: settings.pathStyle,
        pathStyleOpts,
        source: { kind: 'point' as const, x: settings.sourceX, y: settings.sourceY },
        target: { kind: 'point' as const, x: settings.targetX, y: settings.targetY },
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
        sourceMarker: settings.showSourceMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined,
        targetMarker: settings.showTargetMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined
      };
    };

    layer.renderer.addConnector('free', buildSpec());

    const redraw = () => layer.renderer.updateConnector('free', buildSpec());

    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'connector (point endpoints)' });
    onStoryTeardown(() => gui.destroy());

    const endpointsFolder = gui.addFolder('endpoints');
    endpointsFolder.add(settings, 'sourceX', -400, 400, 1).onChange(redraw);
    endpointsFolder.add(settings, 'sourceY', -300, 300, 1).onChange(redraw);
    endpointsFolder.add(settings, 'targetX', -400, 400, 1).onChange(redraw);
    endpointsFolder.add(settings, 'targetY', -300, 300, 1).onChange(redraw);

    const routerFolder = gui.addFolder('router').close();
    routerFolder.add(settings, 'router', ['straight', 'orth']).onChange(redraw);

    const pathStyleFolder = gui.addFolder('pathStyle').close();
    pathStyleFolder.add(settings, 'pathStyle', ['normal', 'rounded', 'bezier', 'smooth']).onChange(redraw);
    pathStyleFolder.add(settings, 'roundedRadius', 0, 40, 1).name('rounded.radius').onChange(redraw);
    pathStyleFolder.add(settings, 'bezierAxis', ['auto', 'h', 'v']).name('bezier.axis').onChange(redraw);
    pathStyleFolder.add(settings, 'bezierTension', 0, 1, 0.01).name('bezier.tension').onChange(redraw);
    pathStyleFolder.add(settings, 'smoothTension', 0, 2, 0.05).name('smooth.tension').onChange(redraw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(redraw);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(redraw);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showSourceMarker').onChange(redraw);
    markerFolder.add(settings, 'showTargetMarker').onChange(redraw);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(redraw);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(redraw);
  }
};
