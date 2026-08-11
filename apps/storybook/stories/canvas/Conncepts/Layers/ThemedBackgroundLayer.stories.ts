import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import { ThemeBehaviour, BUILT_IN_THEMES, type ThemeMode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

/**
 * Themed background via the engine theme signal: a plain {@link BackgroundLayer}
 * subscribes to `'theme:change'` and recolours its backdrop + grid from the
 * active palette's `surface` / `divider` roles. The {@link ThemeBehaviour} is
 * the sole publisher — switch its named theme or mode and the background (and
 * every other theme-aware layer) recolours. This replaces the former
 * `ThemedBackgroundLayer`, whose multi-theme logic now lives in the shared
 * theme signal.
 */
const meta: Meta = { title: 'canvas/concepts/Layers/Themed Background' };
export default meta;
type Story = StoryObj;

export const ThemedBackground: Story = {
  render: () => createContainer({ id: 'cvs-themed-background-layer' }),

  play: async ({ canvasElement }) => {
    class FixturesLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() {
        return {};
      }
      protected onMount() {
        this.renderer = this.surface.primitives;
        this.renderer.addShape('a', { kind: 'circle', x: -120, y: 0, radius: 36, fill: 0x3b82f6 });
        this.renderer.addShape('b', { kind: 'circle', x: 120, y: 0, radius: 36, fill: 0xf59e0b });
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

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-themed-background-layer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());

    // A plain pattern background — it recolours itself from the published theme.
    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: { type: 'pattern', patternType: 'grid', size: 1, spacing: 30, alpha: 0.7 }
      }),
    );
    const fixtures = new FixturesLayer({ id: 'fx', options: {} });
    canvas.layers.add(fixtures);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    // The sole theme publisher. Named-palette path (no single-layer shorthand),
    // so the background reads `surface` / `divider` straight off the palette.
    const theme = new ThemeBehaviour({ id: 'theme', enabled: true });
    canvas.behaviours.register(theme);

    await canvas.init({ container, autoResize: true });
    canvas.camera.fitContent(fixtures.getBounds(), 80);

    const settings = { theme: 'default', mode: 'system' as ThemeMode };
    const gui = new GUI({ title: 'Theme' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(settings, 'theme', Object.keys(BUILT_IN_THEMES))
      .onChange((id: string) => theme.setTheme(id));
    gui.add(settings, 'mode', ['system', 'light', 'dark']).onChange((m: ThemeMode) => theme.setMode(m));
  }
};
