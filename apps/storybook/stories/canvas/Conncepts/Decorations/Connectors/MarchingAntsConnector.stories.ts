import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Connectors/MarchingAntsConnector' };
export default meta;
type Story = StoryObj;

/**
 * Connector variant of marching-ants. Strokes the routed path of a
 * connector with a dashed line whose `dashOffset` advances each frame.
 * Works on every router / pathStyle — here demonstrated with a `straight`
 * router using both `normal` and `bezier` pathStyles to show that the
 * march follows whatever curve the path resolves to.
 */
export const MarchingAntsConnector: Story = {
  render: () => createContainer({ id: 'cvs-deco-marching-ants-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-marching-ants-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'marching-ants-connector', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('a', {
      kind: 'circle', x: -160, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x4f9cf9 },
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 160, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x10b981 },
    });
    layer.renderer.addShape('c', {
      kind: 'circle', x: -160, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xfb923c },
    });
    layer.renderer.addShape('d', {
      kind: 'circle', x: 160, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xa78bfa },
    });

    layer.renderer.addConnector('a-to-b', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'normal',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      stroke: { color: 0xd1d5db, width: 1.5 },
    });
    layer.renderer.addConnector('c-to-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke: { color: 0xd1d5db, width: 1.5 },
    });

    const settings = {
      color: 0x111827,
      strokeWidth: 2,
      dashLength: 6,
      gapLength: 4,
      speedPxPerSec: 36,
      alpha: 1,
    };

    const apply = () => {
      const style = { ...settings };
      layer.renderer.setDecoration('a-to-b', 'marching-ants-connector', {
        kind: 'marching-ants-connector',
        style,
      });
      layer.renderer.setDecoration('c-to-d', 'marching-ants-connector', {
        kind: 'marching-ants-connector',
        style,
      });
    };
    apply();

    const gui = new GUI({ title: 'MarchingAntsConnector' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'strokeWidth', 0.5, 8, 0.5).onChange(apply);
    gui.add(settings, 'dashLength', 1, 24, 0.5).onChange(apply);
    gui.add(settings, 'gapLength', 1, 24, 0.5).onChange(apply);
    gui.add(settings, 'speedPxPerSec', -160, 160, 2).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
