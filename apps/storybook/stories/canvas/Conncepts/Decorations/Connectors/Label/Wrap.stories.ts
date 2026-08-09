import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  DragShapeBehaviour,
  WorldLayer,
  arrowMarkerSpec,
  type IElementRenderer
} from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Connectors/Label/Wrap' };
export default meta;
type Story = StoryObj;

/**
 * `LabelWrap` on a connector label — `maxWidth`, `maxHeight`, `maxLines`,
 * `wordWrap`, `overflow`. Wrap is applied to the rendered text *before*
 * the autoRotate transform, so a wrapped multi-line label rotates as a
 * rigid block along the path tangent.
 *
 * Same semantics as on shape labels: `maxWidth` triggers wordWrap;
 * `maxHeight` divides by line height to derive an upper bound on `maxLines`
 * (smaller wins); `overflow: 'ellipsis'` appends `…` to the truncated string.
 */
export const Wrap: Story = {
  render: () => createContainer({ id: 'cvs-cdeco-label-wrap' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-wrap')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-wrap', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Diagonal endpoints + bezier so the connector shows pathStyle character
    // and the wrapped label sits on a curved baseline.
    layer.renderer.addShape('src', { kind: 'circle', x: -260, y: -70, radius: 20, fill: { kind: 'solid', color: 0x4f9cf9 } });
    layer.renderer.addShape('tgt', { kind: 'circle', x:  260, y:  70, radius: 20, fill: { kind: 'solid', color: 0x10b981 } });
    layer.renderer.addConnector('edge', {
      kind: 'connector',
      router: 'straight', pathStyle: 'bezier',
      pathStyleOpts: { axis: 'h', tension: 0.5 },
      source: { kind: 'shape', shapeId: 'src', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'tgt', anchor: 'boundary' },
      stroke: { color: 0xcbd5e1, width: 1.5 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 })
    });

    const settings = {
      text: 'A long descriptive relation that wraps across multiple lines on a connector',
      maxWidth: 160,
      maxHeight: 0,
      maxLines: 3,
      wordWrap: true,
      overflow: 'ellipsis' as 'clip' | 'ellipsis',
      autoRotate: false
    };

    const apply = (): void => {
      layer.renderer.setDecoration('edge', 'label', {
        kind: 'label-connector',
        style: {
          content: { kind: 'text', text: settings.text, fontSize: 12, fontWeight: 500, fill: 0x0f172a },
          background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [4, 8] },
          wrap: {
            ...(settings.maxWidth  > 0 ? { maxWidth:  settings.maxWidth  } : {}),
            ...(settings.maxHeight > 0 ? { maxHeight: settings.maxHeight } : {}),
            ...(settings.maxLines  > 0 ? { maxLines:  settings.maxLines  } : {}),
            wordWrap: settings.wordWrap,
            overflow: settings.overflow
          },
          placement: 'center',
          autoRotate: settings.autoRotate
        }
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 160);

    const gui = new GUI({ title: 'Wrap' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'autoRotate').name('autoRotate (see Rotation story)').onChange(apply);
    const wr = gui.addFolder('LabelWrap');
    wr.add(settings, 'maxWidth',  0, 320, 10).name('maxWidth  (0=off)').onChange(apply);
    wr.add(settings, 'maxHeight', 0, 160,  5).name('maxHeight (0=off)').onChange(apply);
    wr.add(settings, 'maxLines',  1,   6,  1).onChange(apply);
    wr.add(settings, 'wordWrap').onChange(apply);
    wr.add(settings, 'overflow', ['clip', 'ellipsis']).onChange(apply);
  }
};
