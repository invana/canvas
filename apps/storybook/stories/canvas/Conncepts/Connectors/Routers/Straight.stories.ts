import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/Routers/Straight' };
export default meta;
type Story = StoryObj;

/**
 * The `straight` router is the simplest router: a direct line between the
 * resolved source and target endpoints, passing any waypoints through
 * verbatim. Combine with `pathStyle: 'bezier' | 'smooth' | 'rounded'` for
 * curved variants. All settings are in the gui.
 */
export const Straight: Story = {
  render: () => createContainer({ id: 'cvs-prim-router-straight' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-router-straight')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'straight-line', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const settings = {
      pathStyle: 'normal' as 'normal' | 'rounded' | 'bezier' | 'smooth',
      roundedRadius: 12,
      bezierAxis: 'auto' as 'auto' | 'h' | 'v',
      bezierTension: 0.5,
      smoothTension: 1,
      sourceAnchor: 'boundary' as 'center' | 'boundary' | 'perpendicular',
      targetAnchor: 'boundary' as 'center' | 'boundary' | 'perpendicular',
      sourcePadding: 0,
      targetPadding: 0,
      strokeColor: 0x111827,
      strokeWidth: 2,
      showSourceMarker: false,
      showTargetMarker: true,
      markerLengthScale: 6,
      markerWidthScale: 5
    };

    layer.renderer.addShape('a', {
      kind: 'circle', x: -150, y: 0, radius: 28,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 }
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 150, y: 0, radius: 28,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 }
    });

    const draw = (): void => {
      if (layer.renderer.hasConnector('a-to-b')) layer.renderer.removeConnector('a-to-b');
      const pathStyleOpts: Record<string, unknown> = {};
      if (settings.pathStyle === 'rounded') pathStyleOpts.radius = settings.roundedRadius;
      if (settings.pathStyle === 'bezier') {
        pathStyleOpts.axis = settings.bezierAxis;
        pathStyleOpts.tension = settings.bezierTension;
      }
      if (settings.pathStyle === 'smooth') pathStyleOpts.tension = settings.smoothTension;

      layer.renderer.addConnector('a-to-b', {
        kind: 'connector',
        router: 'straight',
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
          : undefined
      });
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'straight router' });
    onStoryTeardown(() => gui.destroy());

    const pathStyleFolder = gui.addFolder('pathStyle');
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
  }
};
