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

const meta: Meta = { title: 'canvas/concepts/Decorations/Shapes/Label/HtmlContent' };
export default meta;
type Story = StoryObj;

/**
 * The `kind: 'html-text'` variant of `LabelContent` — backed by Pixi's
 * `HTMLText`. Inline tags are styled via the `tagStyles` map; arbitrary CSS
 * (e.g. `@font-face` rules for an icon font) can be injected via
 * `cssOverrides`.
 *
 * Three presets demonstrate the common shapes: badge + name + version,
 * inline highlight, and a multi-line snippet. Edit the raw HTML or tweak
 * `defaultFontSize` / `defaultFill` to see live changes.
 */
export const HtmlContentStory: Story = {
  name: 'HtmlContent',
  render: () => createContainer({ id: 'cvs-prim-label-html' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-label-html')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'label-html', options: {} });
    canvas.layers.add(layer);
    canvas.behaviours.register(new DragShapeBehaviour({ id: 'drag', enabled: true, renderer: layer.renderer }));

    layer.renderer.addShape('host', {
      kind: 'circle', x: 0, y: 0, radius: 32,
      fill: { kind: 'solid', color: 0x10b981 }, stroke: { color: 0x047857, width: 1 },
    });

    const PRESETS = {
      'badge + name + version':
        '<role>API</role> <name>users-service</name> <ver>v2.4.1</ver>',
      'highlight phrase':
        'Status: <hl>Healthy</hl> — last seen 2s ago',
      'multi-line':
        '<title>Server A</title><br/><meta>region: us-east-1</meta><br/><meta>uptime: 13d 4h</meta>',
    } as const;

    type PresetKey = keyof typeof PRESETS;

    const TAG_STYLES: Record<string, Record<string, unknown>> = {
      role:  { fontSize: 10, fill: '#10b981', fontWeight: 700 },
      name:  { fontSize: 13, fill: '#0f172a', fontWeight: 600 },
      ver:   { fontSize: 10, fill: '#64748b', fontWeight: 400 },
      hl:    { fontSize: 12, fill: '#0f172a', fontWeight: 700 },
      title: { fontSize: 14, fill: '#0f172a', fontWeight: 700 },
      meta:  { fontSize: 11, fill: '#64748b', fontWeight: 400 },
    };

    const settings: {
      preset: PresetKey;
      html: string;
      defaultFontFamily: string;
      defaultFontSize: number;
      defaultFill: string;
      defaultFontWeight: number;
      width: number;
      background: boolean;
    } = {
      preset: 'badge + name + version',
      html: PRESETS['badge + name + version'],
      defaultFontFamily: 'sans-serif',
      defaultFontSize: 12,
      defaultFill: '#0f172a',
      defaultFontWeight: 400,
      width: 280,
      background: true,
    };

    const apply = (): void => {
      layer.renderer.setDecoration('host', 'label', {
        kind: 'label',
        style: {
          content: {
            kind: 'html-text',
            html: settings.html,
            defaultFontFamily: settings.defaultFontFamily,
            defaultFontSize: settings.defaultFontSize,
            defaultFill: settings.defaultFill,
            defaultFontWeight: settings.defaultFontWeight,
            width: settings.width,
            tagStyles: TAG_STYLES,
          },
          background: settings.background ? {
            fill: 0xecfdf5, stroke: 0x10b981, strokeWidth: 1, radius: 6, padding: [6, 10],
          } : undefined,
          placement: 'bottom',
          offset: { y: 12 },
        },
      });
    };
    apply();

    canvas.camera.fitContent(layer.getBounds(), 200);

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
    gui.add(settings, 'defaultFontWeight', { regular: 400, semibold: 600, bold: 700 }).onChange(apply);
    gui.add(settings, 'width', 80, 480, 10).name('width (for wrap)').onChange(apply);
    gui.add(settings, 'background').onChange(apply);
  },
};
