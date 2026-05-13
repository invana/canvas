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
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/FlowParticlesConnector' };
export default meta;
type Story = StoryObj;

/**
 * Connector decoration that animates N markers travelling along the routed
 * path at the same speed, evenly spread in phase — a sustained "flow" of
 * particles on the edge. Demonstrated with both a straight `normal` path
 * and a `bezier`-styled path so you can see the particles follow whatever
 * curve the path resolves to.
 */
export const FlowParticlesConnector: Story = {
  render: () => createContainer({ id: 'cvs-deco-flow-particles-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-flow-particles-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'flow-particles-connector', options: {} });
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
      color: 0x111827,
      markerKind: 'circle' as 'circle' | 'square' | 'arrow',
      count: 6,
      size: 7,
      speedPxPerSec: 60,
      loop: true,
      phase: 0,
      orientToPath: false,
      alpha: 1,
    };

    const apply = () => {
      const style = { ...settings };
      layer.renderer.setDecoration('a-to-b', 'flow-particles-connector', {
        kind: 'flow-particles-connector',
        style,
      });
      layer.renderer.setDecoration('c-to-d', 'flow-particles-connector', {
        kind: 'flow-particles-connector',
        style,
      });
    };
    apply();

    const gui = new GUI({ title: 'FlowParticlesConnector' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'markerKind', ['circle', 'square', 'arrow']).onChange(apply);
    gui.add(settings, 'count', 1, 24, 1).onChange(apply);
    gui.add(settings, 'size', 2, 24, 1).onChange(apply);
    gui.add(settings, 'speedPxPerSec', -240, 240, 2).onChange(apply);
    gui.add(settings, 'loop').onChange(apply);
    gui.add(settings, 'phase', 0, 1, 0.01).onChange(apply);
    gui.add(settings, 'orientToPath').onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
