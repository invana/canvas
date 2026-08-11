import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/Quadratic' };
export default meta;
type Story = StoryObj;

/**
 * The `quadratic` pathStyle draws a single quadratic Bézier between the
 * first and last polyline points with one control point placed
 * **perpendicular to the chord** at `curvePosition` (default `0.5`,
 * chord midpoint) and `curveOffset` units to the side (default `30`).
 * Positive offset bows the curve to the visual right of the chord
 * direction; negative to the left. Unlike `bezier` (axis-aligned cubic),
 * the perpendicular construction gives a real bow on **every** chord
 * orientation. All settings are in the gui.
 */
export const Quadratic: Story = {
  render: () => createContainer({ id: 'cvs-prim-pathstyle-quadratic' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-pathstyle-quadratic')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pathstyle-quadratic', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const settings = {
      // pathStyle (quadratic)
      curveOffset: 50,
      curvePosition: 0.5,
      // anchor
      sourceAnchor: 'boundary' as 'center' | 'boundary' | 'perpendicular',
      targetAnchor: 'boundary' as 'center' | 'boundary' | 'perpendicular',
      // stroke
      strokeColor: 0x111827,
      strokeWidth: 2,
      // marker
      showTargetMarker: true,
      markerLengthScale: 4,
      markerWidthScale: 3
    };

    layer.renderer.addShape('a', {
      kind: 'circle', x: -150, y: -60, radius: 22,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 }
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 150, y: 60, radius: 22,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 }
    });

    const draw = (): void => {
      if (layer.renderer.hasConnector('curve')) layer.renderer.removeConnector('curve');
      layer.renderer.addConnector('curve', {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'quadratic',
        pathStyleOpts: {
          curveOffset: settings.curveOffset,
          curvePosition: settings.curvePosition
        },
        source: { kind: 'shape', shapeId: 'a', anchor: settings.sourceAnchor },
        target: { kind: 'shape', shapeId: 'b', anchor: settings.targetAnchor },
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
        targetMarker: settings.showTargetMarker
          ? arrowMarkerSpec({
              lengthScale: settings.markerLengthScale,
              widthScale: settings.markerWidthScale,
              fill: settings.strokeColor
            })
          : undefined
      });
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'quadratic pathStyle' });
    onStoryTeardown(() => gui.destroy());

    const pathStyleFolder = gui.addFolder('pathStyle (quadratic)');
    pathStyleFolder.add(settings, 'curveOffset', -150, 150, 1).onChange(draw);
    pathStyleFolder.add(settings, 'curvePosition', 0, 1, 0.01).onChange(draw);

    const anchorFolder = gui.addFolder('anchor').close();
    anchorFolder.add(settings, 'sourceAnchor', ['center', 'boundary', 'perpendicular']).name('source').onChange(draw);
    anchorFolder.add(settings, 'targetAnchor', ['center', 'boundary', 'perpendicular']).name('target').onChange(draw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(draw);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showTargetMarker').onChange(draw);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(draw);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(draw);
  }
};
