import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/Rounded' };
export default meta;
type Story = StoryObj;

/**
 * The `rounded` pathStyle replaces each interior polyline corner with a
 * quadratic arc fillet of the configured radius. Combine with an orth-style
 * router for clean H/V routes with rounded corners. All settings are in the
 * gui.
 */
export const Rounded: Story = {
  render: () => createContainer({ id: 'cvs-prim-pathstyle-rounded' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-pathstyle-rounded')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pathstyle-rounded', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const settings = {
      // pathStyle (rounded)
      radius: 24,
      useWaypoints: true,
      // router
      router: 'straight' as 'straight' | 'orth',
      // anchor
      sourceAnchor: 'boundary' as 'center' | 'boundary' | 'perpendicular',
      targetAnchor: 'boundary' as 'center' | 'boundary' | 'perpendicular',
      sourcePadding: 0,
      targetPadding: 0,
      // stroke
      strokeColor: 0x111827,
      strokeWidth: 2,
      // marker
      showSourceMarker: false,
      showTargetMarker: true,
      markerLengthScale: 4,
      markerWidthScale: 3
    };

    const waypoints = [
      { x: 0, y: -100 },
      { x: 0, y: 100 },
    ];

    layer.renderer.addShape('a', {
      kind: 'circle', x: -200, y: -100, radius: 18,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 }
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 200, y: 100, radius: 18,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 }
    });

    const draw = (): void => {
      if (layer.renderer.hasConnector('curve')) layer.renderer.removeConnector('curve');
      layer.renderer.addConnector('curve', {
        kind: 'connector',
        router: settings.router,
        pathStyle: 'rounded',
        pathStyleOpts: { radius: settings.radius },
        source: { kind: 'shape', shapeId: 'a', anchor: settings.sourceAnchor, padding: settings.sourcePadding },
        target: { kind: 'shape', shapeId: 'b', anchor: settings.targetAnchor, padding: settings.targetPadding },
        waypoints: settings.useWaypoints ? waypoints : undefined,
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
        sourceMarker: settings.showSourceMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined,
        targetMarker: settings.showTargetMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined
      });
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'rounded pathStyle' });
    onStoryTeardown(() => gui.destroy());

    const pathStyleFolder = gui.addFolder('pathStyle (rounded)');
    pathStyleFolder.add(settings, 'radius', 0, 80, 1).onChange(draw);
    pathStyleFolder.add(settings, 'useWaypoints').onChange(draw);

    const routerFolder = gui.addFolder('router').close();
    routerFolder.add(settings, 'router', ['straight', 'orth']).onChange(draw);

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
  }
};
