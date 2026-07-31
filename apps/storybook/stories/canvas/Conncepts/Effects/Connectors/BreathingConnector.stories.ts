import type { Meta, StoryObj } from '@storybook/react-vite';
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
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Effects/Connectors/BreathingConnector' };
export default meta;
type Story = StoryObj;

/**
 * `BreathingConnectorEffect` is the first connector-targeting effect.
 * It sinusoidally modulates the host connector's alpha — no new geometry
 * is drawn (that would be a decoration). Demonstrated on two edges with
 * different path styles to show the modulation applies uniformly to
 * whatever the path resolves to. Toggle `enabled` to verify the renderer
 * cleanly restores the connector's baseline alpha on removal.
 */
export const BreathingConnectorStory: Story = {
  name: 'BreathingConnector',
  render: () => createContainer({ id: 'cvs-effect-breathing-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-effect-breathing-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'breathing-connector', options: {} });
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
      stroke: { color: 0x111827, width: 3 },
      targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: 0x111827 }),
    });
    layer.renderer.addConnector('c-to-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 3 },
      targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: 0x111827 }),
    });

    const settings = {
      enabled: true,
      amplitude: 0.6,
      periodMs: 1800,
    };

    const apply = () => {
      const spec = settings.enabled
        ? {
            kind: 'breathing-connector' as const,
            style: { amplitude: settings.amplitude, periodMs: settings.periodMs },
          }
        : null;
      layer.renderer.setEffect('a-to-b', 'breathing', spec);
      layer.renderer.setEffect('c-to-d', 'breathing', spec);
    };
    apply();

    const gui = new GUI({ title: 'BreathingConnector' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'amplitude', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'periodMs', 400, 4000, 100).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
