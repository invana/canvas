import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Connectors/Routers/OneSide' };
export default meta;
type Story = StoryObj;

/**
 * The `oneSide` router forces the connector to exit the source on a
 * designated side, then routes orthogonally to the target. Useful for
 * swimlane / "all on one side" diagrams. All settings are in the gui.
 */
export const OneSide: Story = {
  render: () => createContainer({ id: 'cvs-prim-router-one-side' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-router-one-side')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'router-one-side', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer,
    }));

    const settings = {
      // router (oneSide)
      side: 'right' as 'top' | 'right' | 'bottom' | 'left',
      padLength: 40,
      // pathStyle
      pathStyle: 'normal' as 'normal' | 'rounded' | 'bezier' | 'smooth',
      roundedRadius: 12,
      bezierAxis: 'auto' as 'auto' | 'h' | 'v',
      bezierTension: 0.5,
      smoothTension: 1,
      // anchor
      sourceAnchor: 'perpendicular' as 'center' | 'boundary' | 'perpendicular',
      targetAnchor: 'perpendicular' as 'center' | 'boundary' | 'perpendicular',
      sourcePadding: 0,
      targetPadding: 0,
      // stroke
      strokeColor: 0x111827,
      strokeWidth: 2,
      // marker
      showSourceMarker: false,
      showTargetMarker: true,
      markerLengthScale: 5,
      markerWidthScale: 4,
    };

    layer.renderer.addShape('a', {
      kind: 'rect', x: -100, y: -80, width: 80, height: 50,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });
    layer.renderer.addShape('b', {
      kind: 'rect', x: 100, y: 80, width: 80, height: 50,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    const draw = (): void => {
      if (layer.renderer.hasConnector('edge')) layer.renderer.removeConnector('edge');
      const pathStyleOpts: Record<string, unknown> = {};
      if (settings.pathStyle === 'rounded') pathStyleOpts.radius = settings.roundedRadius;
      if (settings.pathStyle === 'bezier') {
        pathStyleOpts.axis = settings.bezierAxis;
        pathStyleOpts.tension = settings.bezierTension;
      }
      if (settings.pathStyle === 'smooth') pathStyleOpts.tension = settings.smoothTension;

      layer.renderer.addConnector('edge', {
        kind: 'connector',
        router: 'oneSide',
        routerOpts: { side: settings.side, padLength: settings.padLength },
        pathStyle: settings.pathStyle,
        pathStyleOpts,
        source: { kind: 'shape', shapeId: 'a', anchor: settings.sourceAnchor, padding: settings.sourcePadding },
        target: { kind: 'shape', shapeId: 'b', anchor: settings.targetAnchor, padding: settings.targetPadding },
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
        sourceMarker: settings.showSourceMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined,
        targetMarker: settings.showTargetMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined,
      });
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'oneSide router' });

    const routerFolder = gui.addFolder('router (oneSide)');
    routerFolder.add(settings, 'side', ['top', 'right', 'bottom', 'left']).onChange(draw);
    routerFolder.add(settings, 'padLength', 0, 120, 1).onChange(draw);

    const pathStyleFolder = gui.addFolder('pathStyle').close();
    pathStyleFolder.add(settings, 'pathStyle', ['normal', 'rounded', 'bezier', 'smooth']).onChange(draw);
    pathStyleFolder.add(settings, 'roundedRadius', 0, 40, 1).name('rounded.radius').onChange(draw);
    pathStyleFolder.add(settings, 'bezierAxis', ['auto', 'h', 'v']).name('bezier.axis').onChange(draw);
    pathStyleFolder.add(settings, 'bezierTension', 0, 1, 0.01).name('bezier.tension').onChange(draw);
    pathStyleFolder.add(settings, 'smoothTension', 0, 2, 0.05).name('smooth.tension').onChange(draw);

    const anchorFolder = gui.addFolder('anchor').close();
    anchorFolder.add(settings, 'sourceAnchor', ['center', 'boundary', 'perpendicular']).name('source').onChange(draw);
    anchorFolder.add(settings, 'targetAnchor', ['center', 'boundary', 'perpendicular']).name('target').onChange(draw);
    anchorFolder.add(settings, 'sourcePadding', -20, 60, 1).name('source.padding').onChange(draw);
    anchorFolder.add(settings, 'targetPadding', -20, 60, 1).name('target.padding').onChange(draw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(draw);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showSourceMarker').onChange(draw);
    markerFolder.add(settings, 'showTargetMarker').onChange(draw);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(draw);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(draw);
  },
};
