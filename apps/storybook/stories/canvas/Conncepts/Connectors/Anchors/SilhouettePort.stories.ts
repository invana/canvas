import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, arrowMarkerSpec,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/Anchors/SilhouettePort' };
export default meta;
type Story = StoryObj;

/**
 * The `silhouette-port` anchor is the silhouette-aware sibling of
 * `edge-port`. Same `{ side, offset }` opts, but the endpoint is
 * resolved by casting a ray from the shape's centre through the AABB
 * face point and intersecting the shape's *actual* outline via
 * `boundaryIntersect`. For `rect` (where AABB == silhouette) it's
 * identical to `edge-port`; for `circle`, `polygon`, and rounded rects
 * the endpoint lands flush on the rendered curve instead of floating
 * on the AABB tangent line.
 *
 * Flip `anchor` between `silhouette-port` and `edge-port` to see the
 * gap: with circles, only `silhouette-port` keeps the arrow tips on
 * the perimeter. Drag the shapes; the ports follow. Drag the offset
 * sliders to watch each endpoint walk around the silhouette.
 */
export const SilhouettePortStory: Story = {
  name: 'SilhouettePort',
  render: () => createContainer({ id: 'cvs-prim-anchor-silhouette-port' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-anchor-silhouette-port')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'anchor-silhouette-port', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer
    }));

    const settings = {
      anchor: 'silhouette-port',
      offsetTop: -40,
      offsetMid: 0,
      offsetBot: 40,
      strokeColor: 0x6366f1,
      strokeWidth: 14,
      strokeAlpha: 0.55
    };
    const ANCHORS = ['silhouette-port', 'edge-port'];

    // Circles, not rects, so the AABB-vs-silhouette distinction is
    // immediately visible. The circle's AABB face is a vertical line at
    // `centre.x + radius`, but only the single point `(centre.x + radius,
    // centre.y)` actually lies on the silhouette — every non-zero offset
    // hangs in empty space if you use `edge-port`.
    layer.renderer.addShape('source', {
      kind: 'circle', x: -225, y: 0, radius: 60,
      fill: { kind: 'solid', color: 0x1f2937 }
    });
    layer.renderer.addShape('target', {
      kind: 'circle', x:  225, y: 0, radius: 60,
      fill: { kind: 'solid', color: 0x1f2937 }
    });

    const draw = (): void => {
      for (const id of ['l-top', 'l-mid', 'l-bot']) {
        if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
      }
      const make = (id: string, offset: number): void => {
        layer.renderer.addConnector(id, {
          kind: 'connector',
          router: 'straight',
          pathStyle: 'bump-horizontal',
          source: {
            kind: 'shape',
            shapeId: 'source',
            anchor: { name: settings.anchor, opts: { side: 'right', offset } }
          },
          target: {
            kind: 'shape',
            shapeId: 'target',
            anchor: { name: settings.anchor, opts: { side: 'left', offset } }
          },
          stroke: { color: settings.strokeColor, width: settings.strokeWidth },
          alpha: settings.strokeAlpha,
          targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: settings.strokeColor })
        });
      };
      make('l-top', settings.offsetTop);
      make('l-mid', settings.offsetMid);
      make('l-bot', settings.offsetBot);
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'silhouette-port' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'anchor', ANCHORS).onChange(draw);

    const offsetsFolder = gui.addFolder('port offsets');
    offsetsFolder.add(settings, 'offsetTop', -90, 90, 1).onChange(draw);
    offsetsFolder.add(settings, 'offsetMid', -90, 90, 1).onChange(draw);
    offsetsFolder.add(settings, 'offsetBot', -90, 90, 1).onChange(draw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 1, 40, 1).onChange(draw);
  }
};
