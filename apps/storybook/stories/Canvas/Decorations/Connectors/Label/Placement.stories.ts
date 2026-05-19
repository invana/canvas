import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  PrimitivesRenderer,
  arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext, ConnectorLabelPlacement } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/Label/Placement' };
export default meta;
type Story = StoryObj;

/**
 * `ConnectorLabelPlacement` — where along the path the label anchors.
 * Named constants `'start'` / `'center'` / `'end'` map to `t = 0 / 0.5 / 1`;
 * any numeric `t ∈ [0, 1]` is honoured literally (clamped if outside).
 *
 * One label per path style (straight, bezier, orth) — same `placement`
 * applied to all so you can see the parametric position behave uniformly
 * across path kinds. Slide the `t` control to scan from source to target.
 */
export const Placement: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-placement' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-placement')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-placement', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Staggered endpoints so each path style is visually distinct: bezier
    // needs a y-delta to show its curve, orth needs an xy-delta to make an
    // L-bend. Straight stays horizontal for reference.
    const variants = [
      { id: 'straight', router: 'straight', pathStyle: 'normal',  srcX: -260, srcY: -220, tgtX: 240, tgtY: -220 },
      { id: 'bezier',   router: 'straight', pathStyle: 'bezier',  srcX: -260, srcY:  -60, tgtX: 240, tgtY:   20 },
      { id: 'orth',     router: 'orth',     pathStyle: 'rounded', srcX: -260, srcY:  140, tgtX: 240, tgtY:  240 },
    ];
    for (const v of variants) {
      layer.renderer.addShape(`${v.id}-src`, { kind: 'circle', x: v.srcX, y: v.srcY, radius: 16, fill: { kind: 'solid', color: 0x4f9cf9 } });
      layer.renderer.addShape(`${v.id}-tgt`, { kind: 'circle', x: v.tgtX, y: v.tgtY, radius: 16, fill: { kind: 'solid', color: 0x10b981 } });
      layer.renderer.addConnector(v.id, {
        kind: 'connector',
        router: v.router, pathStyle: v.pathStyle,
        source: { kind: 'shape', shapeId: `${v.id}-src`, anchor: 'boundary' },
        target: { kind: 'shape', shapeId: `${v.id}-tgt`, anchor: 'boundary' },
        stroke: { color: 0xcbd5e1, width: 1.5 },
        targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 }),
        ...(v.pathStyle === 'bezier' ? { pathStyleOpts: { axis: 'h', tension: 0.6 } } : {}),
      });
    }

    const settings = {
      preset: 'center' as 'start' | 'center' | 'end' | 'numeric',
      t: 0.5,
    };

    const apply = (): void => {
      const placement: ConnectorLabelPlacement = settings.preset === 'numeric' ? settings.t : settings.preset;
      for (const v of variants) {
        layer.renderer.setDecoration(v.id, 'label', {
          kind: 'label-connector',
          style: {
            content: { kind: 'text', text: `t=${typeof placement === 'number' ? placement.toFixed(2) : placement}`, fontSize: 12, fontWeight: 600, fill: 0x0f172a },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [2, 6] },
            placement,
          },
        });
      }
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Placement' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'preset', ['start', 'center', 'end', 'numeric']).onChange(apply);
    gui.add(settings, 't', 0, 1, 0.01).name('numeric t').onChange(() => {
      settings.preset = 'numeric';
      apply();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    });
  },
};
