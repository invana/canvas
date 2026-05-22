import type { Meta, StoryObj } from '@storybook/react-vite';
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
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Decorations/Connectors/Label/PathOffset' };
export default meta;
type Story = StoryObj;

/**
 * `pathOffset` shifts the label along the path tangent in **pixels**. The
 * canonical "pad N px from the source endpoint" use case: anchor at `'start'`
 * and set `pathOffset: 24` to push the label 24 px toward the target.
 *
 * Positive values move toward the target; negative toward the source. This
 * composes with `placement` — the t-anchored point is the *origin*, and
 * `pathOffset` slides it along the local tangent from there.
 */
export const PathOffset: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-pathoffset' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-pathoffset')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-pathoffset', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Staggered y so the bezier curve actually arcs (otherwise a horizontal
    // pair would render the same as a straight line and `pathOffset` wouldn't
    // visibly track the tangent).
    layer.renderer.addShape('src', { kind: 'circle', x: -260, y: -60, radius: 20, fill: { kind: 'solid', color: 0x4f9cf9 } });
    layer.renderer.addShape('tgt', { kind: 'circle', x:  260, y:  60, radius: 20, fill: { kind: 'solid', color: 0x10b981 } });
    layer.renderer.addConnector('edge', {
      kind: 'connector',
      router: 'straight', pathStyle: 'bezier',
      pathStyleOpts: { axis: 'h', tension: 0.5 },
      source: { kind: 'shape', shapeId: 'src', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'tgt', anchor: 'boundary' },
      stroke: { color: 0xcbd5e1, width: 1.5 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 }),
    });

    const settings = {
      text: 'pad-from-source',
      placement: 'start' as ConnectorLabelPlacement,
      pathOffset: 24,
    };

    const apply = (): void => {
      layer.renderer.setDecoration('edge', 'label', {
        kind: 'label-connector',
        style: {
          content: { kind: 'text', text: settings.text, fontSize: 12, fontWeight: 600, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [2, 6] },
          placement: settings.placement,
          pathOffset: settings.pathOffset,
        },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 120);

    const gui = new GUI({ title: 'PathOffset' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'placement', { start: 'start', center: 'center', end: 'end' }).onChange(apply);
    gui.add(settings, 'pathOffset', -120, 120, 2).name('pathOffset (px along tangent)').onChange(apply);
  },
};
