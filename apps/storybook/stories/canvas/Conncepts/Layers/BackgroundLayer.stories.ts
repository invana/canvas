import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import { ThemeBehaviour, BUILT_IN_THEMES, type ThemeMode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Layers/BackgroundLayer' };
export default meta;
type Story = StoryObj;

export const BackgroundLayerStory: Story = {
  name: 'BackgroundLayer',
  render: () => createContainer({ id: 'cvs-background-layer' }),

  play: async ({ canvasElement }) => {
    // A trivial world layer so users see *something* to pan / zoom against
    // the background.
    class FixturesLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() {
        return {};
      }
      protected onMount() {
        this.renderer = this.surface.primitives;
        this.renderer.addShape('a', {
          kind: 'circle',
          x: -120,
          y: 0,
          radius: 36,
          fill: 0x3b82f6
        });
        this.renderer.addShape('b', {
          kind: 'circle',
          x: 120,
          y: 0,
          radius: 36,
          fill: 0xf59e0b
        });
        this.renderer.addShape('c', {
          kind: 'rect',
          x: 0,
          y: 120,
          width: 80,
          height: 50,
          cornerRadius: 6,
          fill: 0x10b981
        });
      }
      hitTest() {
        return null;
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-background-layer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    // The sole publisher of `theme:change`. Without one, an `'inherit'` colour
    // has no palette to read and falls back to the layer's built-in default —
    // so the Source: theme controls below would do nothing. `mode: 'document'`
    // tracks the Storybook toolbar's theme + variant off `<html>`.
    const theme = new ThemeBehaviour({ id: 'theme', enabled: true, mode: 'document' });
    canvas.behaviours.register(theme);

    const bg = new BackgroundLayer({
      id: 'bg',
      options: {
        type: 'pattern',
        patternType: 'dots',
        backgroundColor: 'inherit',
        color: 'inherit',
        size: 1.5,
        spacing: 30,
        alpha: 0.8,
        followCamera: true
      }
    });
    canvas.layers.add(bg);

    const fixtures = new FixturesLayer({ id: 'fx', options: {} });
    canvas.layers.add(fixtures);

    // Each colour is a *source* + a swatch, mirroring the canvas-ui editor:
    // `theme` sends the `'inherit'` sentinel (the layer reads its palette role
    // on every paint), `custom` sends the swatch's hex and pins it. The swatch
    // always holds a real colour — `'inherit'` is not one, and lil-gui's
    // `addColor` throws on a value it can't parse as a colour.
    const settings = {
      type: 'pattern' as 'solid' | 'pattern',
      patternType: 'dots' as 'dots' | 'grid' | 'lines',
      backgroundSource: 'theme' as 'theme' | 'custom',
      backgroundColor: '#0f172a',
      patternSource: 'theme' as 'theme' | 'custom',
      color: '#475569',
      size: 1.5,
      spacing: 30,
      alpha: 0.8,
      followCamera: true,
      theme: 'default',
      mode: 'document' as ThemeMode
    };

    const apply = () => {
      bg.setOptions({
        type: settings.type,
        patternType: settings.patternType,
        backgroundColor:
          settings.backgroundSource === 'theme' ? 'inherit' : settings.backgroundColor,
        color: settings.patternSource === 'theme' ? 'inherit' : settings.color,
        size: settings.size,
        spacing: settings.spacing,
        alpha: settings.alpha,
        followCamera: settings.followCamera
      });
    };

    const gui = new GUI({ title: 'Background' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'type', ['solid', 'pattern']).onChange(apply);
    gui.add(settings, 'patternType', ['dots', 'grid', 'lines']).onChange(apply);
    gui.add(settings, 'backgroundSource', ['theme', 'custom']).name('background').onChange(apply);
    gui.addColor(settings, 'backgroundColor').name('background color').onChange(apply);
    gui.add(settings, 'patternSource', ['theme', 'custom']).name('pattern').onChange(apply);
    gui.addColor(settings, 'color').name('pattern color').onChange(apply);
    gui.add(settings, 'size', 0.5, 8, 0.5).onChange(apply);
    gui.add(settings, 'spacing', 10, 80, 2).onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'followCamera').onChange(apply);

    // Switch the published palette to watch every `Source: theme` colour follow
    // it, while a `Source: custom` colour stays exactly where it was pinned.
    const themeFolder = gui.addFolder('Theme');
    themeFolder
      .add(settings, 'theme', Object.keys(BUILT_IN_THEMES))
      .onChange((id: string) => theme.setTheme(id));
    themeFolder
      .add(settings, 'mode', ['document', 'system', 'light', 'dark'])
      .onChange((m: ThemeMode) => theme.setMode(m));

    canvas.camera.fitContent(fixtures.getBounds(), 80);
  }
};
