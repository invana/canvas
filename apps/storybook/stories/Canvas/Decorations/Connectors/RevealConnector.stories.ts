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
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/RevealConnector' };
export default meta;
type Story = StoryObj;

/**
 * `RevealConnectorDecoration` progressively draws the host's routed path
 * from one endpoint toward the other — as if the line were being "written"
 * onto the canvas. Stroke style, colour, width, cap, join, and the
 * source / target markers are all inherited from the host connector spec,
 * so the reveal looks identical to the final stroke — just animated in.
 *
 * Markers stay anchored at the endpoints throughout the reveal (they live
 * in a sibling Graphics that the decoration leaves visible), so the
 * arrowhead doesn't pop in at the end — it's there waiting for the line
 * to reach it.
 *
 * This story demonstrates the effect across every shipped path style:
 * `straight + normal`, `straight + bezier`, `orth + rounded`,
 * `straight + smooth` (with waypoints). Tweak the GUI controls and click
 * "Replay" to restart the animation on every edge at once.
 */
export const RevealConnector: Story = {
  render: () => createContainer({ id: 'cvs-deco-reveal-connector' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-deco-reveal-connector')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'reveal-connector', options: {} });
    canvas.layers.add(layer);

    // ── Shapes (four rows, two columns) ──────────────────────────────────────
    const nodes = [
      { id: 'a', x: -200, y: -220, color: 0x4f9cf9 },
      { id: 'b', x:  200, y: -220, color: 0x10b981 },
      { id: 'c', x: -200, y:  -90, color: 0xfb923c },
      { id: 'd', x:  200, y:  -90, color: 0xa78bfa },
      { id: 'e', x: -220, y:   60, color: 0xf472b6 },
      { id: 'f', x:  220, y:  160, color: 0x14b8a6 },
      { id: 'g', x: -200, y:  280, color: 0xeab308 },
      { id: 'h', x:  200, y:  280, color: 0xef4444 },
    ];
    for (const n of nodes) {
      layer.renderer.addShape(n.id, {
        kind: 'circle', x: n.x, y: n.y, radius: 22,
        fill: { kind: 'solid', color: n.color },
      });
    }

    // ── Connectors covering all four path styles ─────────────────────────────
    const stroke = { color: 0x111827, width: 3 };
    const marker = arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: stroke.color });

    layer.renderer.addConnector('a-b', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'normal',
      source: { kind: 'shape', shapeId: 'a', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'b', anchor: 'boundary' },
      stroke,
      targetMarker: marker,
    });

    layer.renderer.addConnector('c-d', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'bezier',
      pathStyleOpts: { axis: 'auto', tension: 0.6 },
      source: { kind: 'shape', shapeId: 'c', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'd', anchor: 'boundary' },
      stroke,
      targetMarker: marker,
    });

    // Orthogonal router needs a non-straight pair to demonstrate the L-shape;
    // `rounded` pathStyle then softens the corner.
    layer.renderer.addConnector('e-f', {
      kind: 'connector',
      router: 'orth',
      pathStyle: 'rounded',
      pathStyleOpts: { radius: 24 },
      source: { kind: 'shape', shapeId: 'e', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'f', anchor: 'boundary' },
      stroke,
      targetMarker: marker,
    });

    // Smooth pathStyle interpolates a Catmull-Rom-style spline through
    // waypoints; a single mid-waypoint creates a noticeable S-curve.
    layer.renderer.addConnector('g-h', {
      kind: 'connector',
      router: 'straight',
      pathStyle: 'smooth',
      pathStyleOpts: { tension: 0.5 },
      waypoints: [{ x: 0, y: 220 }],
      source: { kind: 'shape', shapeId: 'g', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'h', anchor: 'boundary' },
      stroke,
      targetMarker: marker,
    });

    const connectorIds = ['a-b', 'c-d', 'e-f', 'g-h'];

    const settings = {
      durationMs: 2500,
      repeatMode: 'one-shot' as 'one-shot' | 'infinite' | 'count',
      repeatCount: 3,
      easing: 'linear' as 'linear' | 'easeOutCubic' | 'easeInOutCubic' | 'easeInOutSine',
      direction: 'source-to-target' as 'source-to-target' | 'target-to-source',
      hostStroke: 'hide' as 'hide' | 'overlay',
      holdAtFull: true,
      delayMs: 0,
      replay: () => apply(),
    };

    const apply = () => {
      const repeat =
        settings.repeatMode === 'infinite'
          ? true
          : settings.repeatMode === 'count'
            ? settings.repeatCount
            : false;
      const spec = {
        kind: 'reveal-connector' as const,
        style: {
          durationMs: settings.durationMs,
          repeat,
          easing: settings.easing,
          direction: settings.direction,
          hostStroke: settings.hostStroke,
          holdAtFull: settings.holdAtFull,
          delayMs: settings.delayMs,
        },
      };
      // Detach + re-attach so the tween restarts from 0 on every change /
      // Replay click.
      for (const id of connectorIds) layer.renderer.setDecoration(id, 'reveal', null);
      for (const id of connectorIds) layer.renderer.setDecoration(id, 'reveal', spec);
    };
    apply();

    const gui = new GUI({ title: 'RevealConnector' });
    gui.add(settings, 'durationMs', 100, 6000, 50).onChange(apply);
    gui.add(settings, 'repeatMode', ['one-shot', 'infinite', 'count']).onChange(apply);
    gui.add(settings, 'repeatCount', 1, 10, 1).onChange(apply);
    gui.add(settings, 'easing', ['linear', 'easeOutCubic', 'easeInOutCubic', 'easeInOutSine']).onChange(apply);
    gui.add(settings, 'direction', ['source-to-target', 'target-to-source']).onChange(apply);
    gui.add(settings, 'hostStroke', ['hide', 'overlay']).onChange(apply);
    gui.add(settings, 'holdAtFull').onChange(apply);
    gui.add(settings, 'delayMs', 0, 2000, 50).onChange(apply);
    gui.add(settings, 'replay').name('▶ Replay');

    canvas.camera.fitContent(layer.getBounds(), 100);
  },
};
