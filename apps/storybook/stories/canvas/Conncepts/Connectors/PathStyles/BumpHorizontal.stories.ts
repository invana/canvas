import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, arrowMarkerSpec,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/PathStyles/BumpHorizontal' };
export default meta;
type Story = StoryObj;

/**
 * The `bump-horizontal` pathStyle draws a single cubic Bézier from source to
 * target with control points placed on the **vertical midline** between
 * them — `c1 = ((sx+tx)/2, sy)`, `c2 = ((sx+tx)/2, ty)`. The curve leaves
 * the source tangent to the horizontal axis and arrives at the target
 * tangent to the horizontal axis; this is the curve d3-shape's
 * `linkHorizontal()` (and d3-sankey's `sankeyLinkHorizontal()`) produce.
 *
 * Stroked with `strokeWidth = link.value`, it doubles as a Sankey ribbon.
 * Try cranking `strokeWidth` in the gui below.
 */
export const BumpHorizontalStory: Story = {
  name: 'BumpHorizontal',
  render: () => createContainer({ id: 'cvs-prim-pathstyle-bump-horizontal' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-pathstyle-bump-horizontal')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pathstyle-bump-horizontal', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const settings = {
      // anchor
      sourceAnchor: 'perpendicular' as 'center' | 'boundary' | 'perpendicular',
      targetAnchor: 'perpendicular' as 'center' | 'boundary' | 'perpendicular',
      // stroke
      strokeColor: 0x6366f1,
      strokeAlpha: 0.6,
      strokeWidth: 24,
      // marker
      showTargetMarker: false
    };

    layer.renderer.addShape('a', {
      kind: 'rect', x: -240, y: -40, width: 24, height: 80,
      fill: { kind: 'solid', color: 0x1e293b }
    });
    layer.renderer.addShape('b', {
      kind: 'rect', x: 220, y: 20, width: 24, height: 80,
      fill: { kind: 'solid', color: 0x1e293b }
    });

    const draw = (): void => {
      if (layer.renderer.hasConnector('ribbon')) layer.renderer.removeConnector('ribbon');
      layer.renderer.addConnector('ribbon', {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'bump-horizontal',
        source: { kind: 'shape', shapeId: 'a', anchor: settings.sourceAnchor },
        target: { kind: 'shape', shapeId: 'b', anchor: settings.targetAnchor },
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
        alpha: settings.strokeAlpha,
        targetMarker: settings.showTargetMarker
          ? arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: settings.strokeColor })
          : undefined
      });
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'bump-horizontal' });
    onStoryTeardown(() => gui.destroy());

    const anchorFolder = gui.addFolder('anchor');
    anchorFolder.add(settings, 'sourceAnchor', ['center', 'boundary', 'perpendicular']).name('source').onChange(draw);
    anchorFolder.add(settings, 'targetAnchor', ['center', 'boundary', 'perpendicular']).name('target').onChange(draw);

    const strokeFolder = gui.addFolder('stroke');
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 1, 80, 1).name('strokeWidth (ribbon)').onChange(draw);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showTargetMarker').onChange(draw);
  }
};
