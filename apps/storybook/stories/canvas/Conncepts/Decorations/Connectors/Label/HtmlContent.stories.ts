import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour, DragShapeBehaviour, WorldLayer, type IElementRenderer } from '@invana/canvas';
import { arrowMarkerSpec } from '@invana/renderer-pixijs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Decorations/Connectors/Label/HtmlContent' };
export default meta;
type Story = StoryObj;

/**
 * The `kind: 'html-text'` variant of `LabelContent` on a connector — inline
 * tag styles via `tagStyles`. Useful for "verb + qualifier" relation labels
 * (`reads <b>users</b>`) where the markup carries semantics.
 *
 * Note: `autoRotate` is disabled by default in this story because `HTMLText`
 * has a single-rotation transform that doesn't always interact well with
 * mid-line tag changes — try toggling it on a diagonal connector to see
 * whether the result reads in your use case.
 */
export const HtmlContentStory: Story = {
  name: 'HtmlContent',
  render: () => createContainer({ id: 'cvs-cdeco-label-html' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() { return {}; }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-cdeco-label-html')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-html', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    // Diagonal endpoints + bezier so the html label sits on a visible curve.
    layer.renderer.addShape('src', { kind: 'circle', x: -280, y: -50, radius: 22, fill: { kind: 'solid', color: 0x4f9cf9 } });
    layer.renderer.addShape('tgt', { kind: 'circle', x:  280, y:  50, radius: 22, fill: { kind: 'solid', color: 0x10b981 } });
    layer.renderer.addConnector('edge', {
      kind: 'connector',
      router: 'straight', pathStyle: 'bezier',
      pathStyleOpts: { axis: 'h', tension: 0.5 },
      source: { kind: 'shape', shapeId: 'src', anchor: 'boundary' },
      target: { kind: 'shape', shapeId: 'tgt', anchor: 'boundary' },
      stroke: { color: 0xcbd5e1, width: 1.5 },
      targetMarker: arrowMarkerSpec({ lengthScale: 6, widthScale: 4, fill: 0xcbd5e1 })
    });

    const PRESETS = {
      'verb + entity':
        '<verb>reads</verb> <entity>users</entity>',
      'weighted relation':
        '<verb>flows</verb> <weight>×3.4</weight>',
      'state badge':
        '<state>RUNNING</state> for <dur>13d 4h</dur>'
    } as const;

    type PresetKey = keyof typeof PRESETS;

    const TAG_STYLES: Record<string, Record<string, unknown>> = {
      verb:   { fontSize: 12, fill: '#0f172a', fontWeight: 600 },
      entity: { fontSize: 12, fill: '#4f9cf9', fontWeight: 700 },
      weight: { fontSize: 11, fill: '#64748b', fontWeight: 500 },
      state:  { fontSize: 11, fill: '#10b981', fontWeight: 700 },
      dur:    { fontSize: 11, fill: '#475569', fontWeight: 400 }
    };

    const settings: {
      preset: PresetKey;
      html: string;
      defaultFontFamily: string;
      defaultFontSize: number;
      defaultFill: string;
      width: number;
      autoRotate: boolean;
      background: boolean;
    } = {
      preset: 'verb + entity',
      html: PRESETS['verb + entity'],
      defaultFontFamily: 'sans-serif',
      defaultFontSize: 12,
      defaultFill: '#0f172a',
      width: 240,
      autoRotate: false,
      background: true
    };

    const apply = (): void => {
      layer.renderer.setDecoration('edge', 'label', {
        kind: 'label-connector',
        style: {
          content: {
            kind: 'html-text',
            html: settings.html,
            defaultFontFamily: settings.defaultFontFamily,
            defaultFontSize: settings.defaultFontSize,
            defaultFill: settings.defaultFill,
            width: settings.width,
            tagStyles: TAG_STYLES
          },
          background: settings.background ? {
            fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [4, 8]
          } : undefined,
          placement: 'center',
          autoRotate: settings.autoRotate,
          offset: { y: -12 }
        }
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 160);

    const gui = new GUI({ title: 'HtmlContent' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'preset', Object.keys(PRESETS)).onChange((k: PresetKey) => {
      settings.html = PRESETS[k];
      apply();
      gui.controllersRecursive().forEach((c) => c.updateDisplay());
    });
    gui.add(settings, 'html').onChange(apply);
    gui.add(settings, 'defaultFontFamily', ['sans-serif', 'serif', 'monospace', 'system-ui']).onChange(apply);
    gui.add(settings, 'defaultFontSize', 8, 28, 1).onChange(apply);
    gui.addColor(settings, 'defaultFill').onChange(apply);
    gui.add(settings, 'width', 80, 480, 10).name('width (for wrap)').onChange(apply);
    gui.add(settings, 'autoRotate').name('autoRotate (HTMLText, experimental)').onChange(apply);
    gui.add(settings, 'background').onChange(apply);
  }
};
