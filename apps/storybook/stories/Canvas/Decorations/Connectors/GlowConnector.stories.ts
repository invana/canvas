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
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/GlowConnector' };
export default meta;
type Story = StoryObj;

/**
 * Soft halo around a connector's routed path. Demonstrated on two edges
 * — a straight `normal` path and a `bezier`-styled path — to show the glow
 * follows whatever curve the path resolves to. Toggle `pulseOn` in the GUI
 * to animate brightness; the geometry only repaints once per style change,
 * so animated pulse is essentially free.
 */
export const GlowConnector: Story = {
  render: () => createContainer({ id: 'cvs-deco-glow-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-glow-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'glow-connector', options: {} });
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
      stroke: { color: 0x111827, width: 2 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0x111827 }),
    });
    layer.renderer.addConnector('c-to-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 2 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0x111827 }),
    });

    const settings = {
      color: 0x4f9cf9,
      radius: 16,
      layers: 6,
      innerAlpha: 0.6,
      pulseOn: false,
      pulsePeriodMs: 1200,
      pulseAmplitude: 0.5,
    };

    const apply = () => {
      const style = {
        color: settings.color,
        radius: settings.radius,
        layers: settings.layers,
        innerAlpha: settings.innerAlpha,
        ...(settings.pulseOn
          ? { pulse: { periodMs: settings.pulsePeriodMs, amplitude: settings.pulseAmplitude } }
          : {}),
      };
      layer.renderer.setDecoration('a-to-b', 'glow-connector', {
        kind: 'glow-connector',
        style,
      });
      layer.renderer.setDecoration('c-to-d', 'glow-connector', {
        kind: 'glow-connector',
        style,
      });
    };
    apply();

    const gui = new GUI({ title: 'GlowConnector' });
    onStoryTeardown(() => gui.destroy());
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'radius', 1, 48, 1).onChange(apply);
    gui.add(settings, 'layers', 1, 16, 1).onChange(apply);
    gui.add(settings, 'innerAlpha', 0, 1, 0.05).onChange(apply);
    const pulseFolder = gui.addFolder('pulse');
    pulseFolder.add(settings, 'pulseOn').onChange(apply);
    pulseFolder.add(settings, 'pulsePeriodMs', 200, 4000, 50).onChange(apply);
    pulseFolder.add(settings, 'pulseAmplitude', 0, 1, 0.05).onChange(apply);

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
