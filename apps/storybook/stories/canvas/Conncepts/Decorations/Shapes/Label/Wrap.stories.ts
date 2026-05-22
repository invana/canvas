import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/Label/Wrap' };
export default meta;
type Story = StoryObj;

/**
 * `LabelWrap` controls — `maxWidth`, `maxHeight`, `maxLines`, `wordWrap`,
 * `overflow`. Demonstrates how the four constraints combine on a single
 * outside-placed label (so wrap output isn't being further squeezed by
 * a containment box).
 *
 * - `maxWidth` triggers word-wrap; lines break at the cap.
 * - `maxHeight` divides by the rendered line height to derive an upper
 *   bound on `maxLines` (smaller of the two wins).
 * - `maxLines` caps the rendered line count directly.
 * - `overflow` chooses how excess content is handled: `'clip'` drops it,
 *   `'ellipsis'` appends `…`.
 *
 * Containment-driven shrink is *not* shown here — that lives in the
 * `Containment` story under the `inside-*` placements.
 */
export const Wrap: Story = {
  render: () => createContainer({ id: 'cvs-prim-label-wrap' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-wrap')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-wrap', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Single circle host; the label sits below it so wrap output has room to
    // grow vertically without being clipped by the host edges.
    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 36,
      fill: { kind: 'solid', color: 0x4f9cf9 }, stroke: { color: 0x1d4ed8, width: 1 },
    });

    const settings = {
      text: 'A long descriptive label that demonstrates wrapping behaviour across multiple lines',
      maxWidth: 180,
      maxHeight: 0,
      maxLines: 3,
      wordWrap: true,
      overflow: 'ellipsis' as 'clip' | 'ellipsis',
      fontSize: 13,
      lineHeight: 0,
    };

    const apply = (): void => {
      layer.renderer.setDecoration('host', 'label', {
        kind: 'label',
        style: {
          content: {
            kind: 'text',
            text: settings.text,
            fontSize: settings.fontSize,
            fontWeight: 500,
            fill: 0x0f172a,
            ...(settings.lineHeight > 0 ? { lineHeight: settings.lineHeight } : {}),
          },
          background: {
            fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 6, padding: [6, 10],
          },
          wrap: {
            ...(settings.maxWidth  > 0 ? { maxWidth:  settings.maxWidth  } : {}),
            ...(settings.maxHeight > 0 ? { maxHeight: settings.maxHeight } : {}),
            ...(settings.maxLines  > 0 ? { maxLines:  settings.maxLines  } : {}),
            wordWrap: settings.wordWrap,
            overflow: settings.overflow,
          },
          placement: 'bottom',
          offset: { y: 12 },
        },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 180);

    const gui = new GUI({ title: 'Wrap' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'fontSize', 8, 24, 1).onChange(apply);
    gui.add(settings, 'lineHeight', 0, 40, 1).name('lineHeight (0=auto)').onChange(apply);
    const wr = gui.addFolder('LabelWrap');
    wr.add(settings, 'maxWidth',  0, 320, 10).name('maxWidth  (0=off)').onChange(apply);
    wr.add(settings, 'maxHeight', 0, 160,  5).name('maxHeight (0=off)').onChange(apply);
    wr.add(settings, 'maxLines',  1,   6,  1).onChange(apply);
    wr.add(settings, 'wordWrap').onChange(apply);
    wr.add(settings, 'overflow', ['clip', 'ellipsis']).onChange(apply);
  },
};
