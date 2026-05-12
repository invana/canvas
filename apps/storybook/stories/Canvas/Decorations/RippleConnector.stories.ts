import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/RippleConnector' };
export default meta;
type Story = StoryObj;

/**
 * Connector-shaped ripple. Each wave strokes the host's body + markers at
 * a width that grows outward and fades — so the wave inherits the line's
 * shape (straight, bezier, curves, bends) and the arrowhead silhouette
 * instead of being a circular pulse. Multiple concurrent rings are
 * phase-distributed across one period for a steady rhythm. Demonstrated
 * on both a straight `normal` path and a `bezier`-styled path.
 */
export const RippleConnector: Story = {
  render: () => createContainer({ id: 'cvs-deco-ripple-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-ripple-connector')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'ripple-connector', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('a', {
      kind: 'circle', x: -180, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x4f9cf9 },
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 180, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x10b981 },
    });
    layer.renderer.addShape('c', {
      kind: 'circle', x: -180, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xfb923c },
    });
    layer.renderer.addShape('d', {
      kind: 'circle', x: 180, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xa78bfa },
    });

    layer.renderer.addConnector('a-to-b', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'normal',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      stroke: { color: 0xd1d5db, width: 1.5 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xd1d5db }),
    });
    layer.renderer.addConnector('c-to-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke: { color: 0xd1d5db, width: 1.5 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xd1d5db }),
    });

    const settings = {
      color: 0xef4444,
      maxRadius: 18,
      periodMs: 1400,
      rings: 3,
      innerAlpha: 0.7,
    };

    const apply = () => {
      const style = { ...settings };
      layer.renderer.setDecoration('a-to-b', 'ripple-connector', {
        kind: 'ripple-connector',
        style,
      });
      layer.renderer.setDecoration('c-to-d', 'ripple-connector', {
        kind: 'ripple-connector',
        style,
      });
    };
    apply();

    const gui = new GUI({ title: 'RippleConnector' });
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'maxRadius', 2, 48, 1).onChange(apply);
    gui.add(settings, 'periodMs', 200, 4000, 50).onChange(apply);
    gui.add(settings, 'rings', 1, 8, 1).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
