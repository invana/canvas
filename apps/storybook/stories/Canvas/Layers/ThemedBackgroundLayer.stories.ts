import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  PrimitivesRenderer,
  ThemedBackgroundLayer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, ThemedBackgroundMode } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Canvas/Layers/ThemedBackgroundLayer' };
export default meta;
type Story = StoryObj;

export const ThemedBackground: Story = {
  render: () => createContainer({ id: 'cvs-themed-background-layer' }),

  play: async ({ canvasElement }) => {
    class FixturesLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() {
        return {};
      }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
        this.renderer.addShape('a', {
          kind: 'circle',
          x: -120,
          y: 0,
          radius: 36,
          fill: 0x3b82f6,
        });
        this.renderer.addShape('b', {
          kind: 'circle',
          x: 120,
          y: 0,
          radius: 36,
          fill: 0xf59e0b,
        });
        this.renderer.addShape('c', {
          kind: 'rect',
          x: 0,
          y: 120,
          width: 80,
          height: 50,
          cornerRadius: 6,
          fill: 0x10b981,
        });
      }
      hitTest() {
        return null;
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#cvs-themed-background-layer',
    )!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const themed = new ThemedBackgroundLayer({
      id: 'bg',
      options: {
        mode: 'auto',
        defaultTheme: 'graph-paper',
        themes: [
          {
            id: 'graph-paper',
            label: 'Graph paper',
            light: {
              type: 'pattern',
              patternType: 'grid',
              backgroundColor: '#f8fafc',
              color: '#94a3b8',
              size: 1,
              spacing: 30,
              alpha: 0.7,
              followCamera: true,
            },
            dark: {
              type: 'pattern',
              patternType: 'grid',
              backgroundColor: '#0f172a',
              color: '#334155',
              size: 1,
              spacing: 30,
              alpha: 0.9,
              followCamera: true,
            },
          },
          {
            id: 'dots',
            label: 'Dot field',
            light: {
              type: 'pattern',
              patternType: 'dots',
              backgroundColor: '#f1f5f9',
              color: '#94a3b8',
              size: 1.5,
              spacing: 24,
              alpha: 0.85,
              followCamera: true,
            },
            dark: {
              type: 'pattern',
              patternType: 'dots',
              backgroundColor: '#020617',
              color: '#475569',
              size: 1.5,
              spacing: 24,
              alpha: 0.9,
              followCamera: true,
            },
          },
          {
            id: 'flat',
            label: 'Flat',
            light: {
              type: 'solid',
              backgroundColor: '#ffffff',
            },
            dark: {
              type: 'solid',
              backgroundColor: '#0a0a0a',
            },
          },
        ],
      },
    });
    canvas.layers.add(themed);

    const fixtures = new FixturesLayer({ id: 'fx', options: {} });
    canvas.layers.add(fixtures);

    const toCssColor = (c: number | string): string =>
      typeof c === 'number' ? `#${c.toString(16).padStart(6, '0')}` : c;

    const initial = themed.getOptions();
    const settings = {
      theme: themed.getActiveTheme().id,
      mode: themed.getMode(),
      type: initial.type,
      patternType: initial.patternType,
      backgroundColor: toCssColor(initial.backgroundColor),
      color: toCssColor(initial.color),
      size: initial.size,
      spacing: initial.spacing,
      alpha: initial.alpha,
      followCamera: initial.followCamera,
    };

    const pushOverrides = (): void => {
      themed.setOptions({
        type: settings.type,
        patternType: settings.patternType,
        backgroundColor: settings.backgroundColor,
        color: settings.color,
        size: settings.size,
        spacing: settings.spacing,
        alpha: settings.alpha,
        followCamera: settings.followCamera,
      });
    };

    const gui = new GUI({ title: 'Themed background' });
    gui
      .add(
        settings,
        'theme',
        themed.getThemes().map((t) => t.id),
      )
      .onChange((id: string) => themed.setTheme(id));
    gui
      .add(settings, 'mode', ['auto', 'light', 'dark'])
      .onChange((m: ThemedBackgroundMode) => themed.setMode(m));
    const styleFolder = gui.addFolder('Style');
    styleFolder.add(settings, 'type', ['solid', 'pattern']).onChange(pushOverrides);
    styleFolder
      .add(settings, 'patternType', ['dots', 'grid', 'lines'])
      .onChange(pushOverrides);
    styleFolder.addColor(settings, 'backgroundColor').onChange(pushOverrides);
    styleFolder.addColor(settings, 'color').onChange(pushOverrides);
    styleFolder.add(settings, 'size', 0.5, 8, 0.5).onChange(pushOverrides);
    styleFolder.add(settings, 'spacing', 10, 80, 2).onChange(pushOverrides);
    styleFolder.add(settings, 'alpha', 0, 1, 0.05).onChange(pushOverrides);
    styleFolder.add(settings, 'followCamera').onChange(pushOverrides);

    const syncStyleFromLayer = (): void => {
      const o = themed.getOptions();
      settings.type = o.type;
      settings.patternType = o.patternType;
      settings.backgroundColor = toCssColor(o.backgroundColor);
      settings.color = toCssColor(o.color);
      settings.size = o.size;
      settings.spacing = o.spacing;
      settings.alpha = o.alpha;
      settings.followCamera = o.followCamera;
      styleFolder.controllersRecursive().forEach((c) => c.updateDisplay());
    };
    themed.events.on('theme:switched', syncStyleFromLayer);
    themed.events.on('mode:updated', syncStyleFromLayer);

    canvas.camera.fitContent(fixtures.getBounds(), 80);
  },
};
