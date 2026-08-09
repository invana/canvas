import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Effects/Connectors/FadeInConnector' };
export default meta;
type Story = StoryObj;

/**
 * `FadeInConnectorEffect` is a one-shot opacity ramp on the host connector
 * — useful as an entrance cue when a new edge appears in a graph. The
 * effect retires from the per-frame tick set once the tween completes
 * but keeps contributing `toAlpha` to the effect aggregation, so the
 * connector remains visible afterward. Hit "Replay" to detach the effect
 * and re-attach it so the fade plays again.
 */
export const FadeInConnectorStory: Story = {
  name: 'FadeInConnector',
  render: () => createContainer({ id: 'cvs-effect-fade-in-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-effect-fade-in-connector')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'fade-in-connector', options: {} });
    canvas.layers.add(layer);

    layer.renderer.addShape('a', {
      kind: 'circle', x: -180, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x4f9cf9 }
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: 180, y: -60, radius: 24,
      fill: { kind: 'solid', color: 0x10b981 }
    });
    layer.renderer.addShape('c', {
      kind: 'circle', x: -180, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xfb923c }
    });
    layer.renderer.addShape('d', {
      kind: 'circle', x: 180, y: 60, radius: 24,
      fill: { kind: 'solid', color: 0xa78bfa }
    });

    layer.renderer.addConnector('a-to-b', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'normal',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 3 },
      targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: 0x111827 })
    });
    layer.renderer.addConnector('c-to-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke: { color: 0x111827, width: 3 },
      targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: 0x111827 })
    });

    const settings = {
      durationMs: 800,
      fromAlpha: 0,
      toAlpha: 1,
      easing: 'easeOutCubic' as 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine',
      delayMs: 0,
      replay: () => apply()
    };

    const apply = () => {
      const spec = {
        kind: 'fade-in-connector' as const,
        style: {
          durationMs: settings.durationMs,
          fromAlpha: settings.fromAlpha,
          toAlpha: settings.toAlpha,
          easing: settings.easing,
          delayMs: settings.delayMs
        }
      };
      // Detach + re-attach so the tween restarts from `fromAlpha`. Order
      // matters: clear first to release the old effect, then re-add.
      layer.renderer.setEffect('a-to-b', 'fade-in', null);
      layer.renderer.setEffect('c-to-d', 'fade-in', null);
      layer.renderer.setEffect('a-to-b', 'fade-in', spec);
      layer.renderer.setEffect('c-to-d', 'fade-in', spec);
    };
    apply();

    const gui = new GUI({ title: 'FadeInConnector' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'durationMs', 100, 4000, 50).onChange(apply);
    gui.add(settings, 'fromAlpha', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'toAlpha', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'easing', ['linear', 'easeOutCubic', 'easeInOutCubic', 'easeInOutSine']).onChange(apply);
    gui.add(settings, 'delayMs', 0, 2000, 50).onChange(apply);
    gui.add(settings, 'replay').name('▶ Replay');

    canvas.camera.fitContent(layer.getBounds(), 100);
  }
};
