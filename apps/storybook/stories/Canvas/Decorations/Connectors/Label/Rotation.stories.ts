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
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Canvas/Decorations/Connectors/Label/Rotation' };
export default meta;
type Story = StoryObj;

/**
 * `autoRotate` aligns the label's baseline with the path tangent — handy for
 * labels that should read along the edge (e.g. `"flows-to"` on a diagonal
 * connector). With `autoRotate: false` the label stays axis-aligned regardless
 * of path direction.
 *
 * `keepUpright` (default `true`) flips the label by π when the tangent angle
 * lies in `(π/2, 3π/2)` so the text never reads upside-down. Try a connector
 * pointing right-to-left: with `keepUpright: false` you'll see mirrored text.
 *
 * Three connectors point in different directions so the rotation logic is
 * visible at a glance.
 */
export const Rotation: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-rotation' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-rotation')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-rotation', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // 3 connectors pointing in different directions (rightward, leftward,
    // diagonal up-right) so rotation + keepUpright behaviour is visible.
    const edges = [
      { id: 'rtl', srcX: -240, srcY: -140, tgtX:  240, tgtY: -140 },
      { id: 'ltr', srcX:  240, srcY:    0, tgtX: -240, tgtY:    0 },
      { id: 'dia', srcX: -240, srcY:  160, tgtX:  240, tgtY: -80  },
    ];
    for (const e of edges) {
      layer.renderer.addShape(`${e.id}-src`, { kind: 'circle', x: e.srcX, y: e.srcY, radius: 18, fill: { kind: 'solid', color: 0x4f9cf9 } });
      layer.renderer.addShape(`${e.id}-tgt`, { kind: 'circle', x: e.tgtX, y: e.tgtY, radius: 18, fill: { kind: 'solid', color: 0x10b981 } });
      layer.renderer.addConnector(e.id, {
        kind: 'connector',
        router: 'straight', pathStyle: 'normal',
        source: { kind: 'shape', shapeId: `${e.id}-src`, anchor: 'boundary' },
        target: { kind: 'shape', shapeId: `${e.id}-tgt`, anchor: 'boundary' },
        stroke: { color: 0xcbd5e1, width: 1.5 },
        targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 }),
      });
    }

    const settings = {
      text: 'flows-to',
      autoRotate: true,
      keepUpright: true,
      offsetY: -8,
    };

    const apply = (): void => {
      for (const e of edges) {
        layer.renderer.setDecoration(e.id, 'label', {
          kind: 'label-connector',
          style: {
            content: { kind: 'text', text: settings.text, fontSize: 12, fontWeight: 600, fill: 0x0f172a },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [2, 6] },
            placement: 'center',
            autoRotate: settings.autoRotate,
            keepUpright: settings.keepUpright,
            offset: { y: settings.offsetY },
          },
        });
      }
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'Rotation' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'autoRotate').onChange(apply);
    gui.add(settings, 'keepUpright').name('keepUpright (when autoRotate)').onChange(apply);
    gui.add(settings, 'offsetY', -30, 30, 1).name('offset.y (post-rotation)').onChange(apply);
  },
};
