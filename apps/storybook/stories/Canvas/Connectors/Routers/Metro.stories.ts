import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Connectors/Routers/Metro' };
export default meta;
type Story = StoryObj;

/**
 * The `metro` router produces transit-map style paths — one axis-aligned
 * leg followed by a 45° diagonal. Obstacle-aware via A* with connectivity 8.
 * Drag any yellow obstacle to move it; the connector re-routes live. All
 * settings are in the gui.
 */
export const Metro: Story = {
  render: () => createContainer({ id: 'cvs-prim-router-metro' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-router-metro')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'router-metro', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-obstacle',
      enabled: true,
      renderer: layer.renderer,
      filter: (id) => id.startsWith('obstacle-'),
      reRouteConnectors: true,
    }));

    const settings = {
      // router (metro)
      avoidance: 'auto' as 'auto' | 'none',
      gridStep: 16,
      margin: 64,
      inflate: 4,
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
      kind: 'circle', x: -280, y: -150, radius: 24,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 280, y: 150, radius: 24,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });

    const obstacles = [
      { id: 'obstacle-1', kind: 'rect', x: -140, y:  -80, width: 70, height: 50,
        fill: { kind: 'solid', color: 0xfacc15 }, stroke: { color: 0xa16207, width: 2 } },
      { id: 'obstacle-2', kind: 'rect', x:  -30, y:   30, width: 80, height: 50,
        fill: { kind: 'solid', color: 0xfacc15 }, stroke: { color: 0xa16207, width: 2 } },
      { id: 'obstacle-3', kind: 'rect', x:   90, y:  -50, width: 70, height: 50,
        fill: { kind: 'solid', color: 0xfacc15 }, stroke: { color: 0xa16207, width: 2 } },
      { id: 'obstacle-4', kind: 'rect', x:  150, y:   80, width: 70, height: 50,
        fill: { kind: 'solid', color: 0xfacc15 }, stroke: { color: 0xa16207, width: 2 } },
      { id: 'obstacle-5', kind: 'rect', x:  -60, y: -180, width: 70, height: 50,
        fill: { kind: 'solid', color: 0xfacc15 }, stroke: { color: 0xa16207, width: 2 } },
    ];

    for (const { id, ...spec } of obstacles) {
      layer.renderer.addShape(id, spec as never);
    }

    const drawEdge = (): void => {
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
        router: 'metro',
        routerOpts: {
          obstacles: settings.avoidance,
          gridStep: settings.gridStep,
          margin: settings.margin,
          inflate: settings.inflate,
        },
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

    drawEdge();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'metro router' });

    const routerFolder = gui.addFolder('router (metro)');
    routerFolder.add(settings, 'avoidance', ['auto', 'none']).onChange(drawEdge);
    routerFolder.add(settings, 'gridStep', 4, 64, 1).onChange(drawEdge);
    routerFolder.add(settings, 'margin', 0, 200, 4).onChange(drawEdge);
    routerFolder.add(settings, 'inflate', 0, 32, 1).onChange(drawEdge);

    const pathStyleFolder = gui.addFolder('pathStyle').close();
    pathStyleFolder.add(settings, 'pathStyle', ['normal', 'rounded', 'bezier', 'smooth']).onChange(drawEdge);
    pathStyleFolder.add(settings, 'roundedRadius', 0, 40, 1).name('rounded.radius').onChange(drawEdge);
    pathStyleFolder.add(settings, 'bezierAxis', ['auto', 'h', 'v']).name('bezier.axis').onChange(drawEdge);
    pathStyleFolder.add(settings, 'bezierTension', 0, 1, 0.01).name('bezier.tension').onChange(drawEdge);
    pathStyleFolder.add(settings, 'smoothTension', 0, 2, 0.05).name('smooth.tension').onChange(drawEdge);

    const anchorFolder = gui.addFolder('anchor').close();
    anchorFolder.add(settings, 'sourceAnchor', ['center', 'boundary', 'perpendicular']).name('source').onChange(drawEdge);
    anchorFolder.add(settings, 'targetAnchor', ['center', 'boundary', 'perpendicular']).name('target').onChange(drawEdge);
    anchorFolder.add(settings, 'sourcePadding', -20, 60, 1).name('source.padding').onChange(drawEdge);
    anchorFolder.add(settings, 'targetPadding', -20, 60, 1).name('target.padding').onChange(drawEdge);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(drawEdge);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(drawEdge);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showSourceMarker').onChange(drawEdge);
    markerFolder.add(settings, 'showTargetMarker').onChange(drawEdge);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(drawEdge);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(drawEdge);
  },
};
