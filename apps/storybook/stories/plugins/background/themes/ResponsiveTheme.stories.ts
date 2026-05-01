/**
 * Background — Themes — Responsive (auto)
 *
 * Demonstrates `BackgroundPlugin` in `mode: 'auto'` with a free-form list of
 * `kind`-tagged themes. The plugin tracks the host's `prefers-color-scheme`
 * media query and switches to the first theme in the list whose `kind`
 * matches whenever the OS preference flips.
 *
 * `setTheme(id)` switches manually and flips the plugin into `'manual'`
 * mode; `setMode('auto')` re-arms system following.
 *
 * To verify auto behavior, change your OS appearance (System Settings →
 * Appearance on macOS) while the story is open and watch the canvas re-theme.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import {
  Canvas,
  BackgroundPlugin,
  type BackgroundOptions,
  type BackgroundTheme,
  type BackgroundThemeSwitchedEvent,
} from '@invana/canvas';
import { GraphDataPlugin, type IGraphStyles } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { createContainer } from '../../../../src/div-utils.js';
import { THEMES, buildTreeGraphData } from './_themes.js';

const meta: Meta = { title: 'Plugins/Background/Themes' };
export default meta;
type Story = StoryObj;

const lightStyles: IGraphStyles = THEMES.light.styles;
const darkStyles: IGraphStyles = THEMES.dark.styles;

const themes: BackgroundTheme[] = [
  {
    id: 'minimal-light',
    kind: 'light',
    label: 'Minimal Light',
    options: {
      color: THEMES.light.background.color as string,
      backgroundColor: THEMES.light.background.backgroundColor as string,
    },
  },
  {
    id: 'midnight',
    kind: 'dark',
    label: 'Midnight',
    options: {
      color: THEMES.dark.background.color as string,
      backgroundColor: THEMES.dark.background.backgroundColor as string,
    },
  },
];

export const ResponsiveTheme: Story = {
  name: 'Responsive (system)',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#1a1a2e',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'dots',
            size: 1.5,
            spacing: 30,
            alpha: 0.6,
            mode: 'auto',
            themes,
          } satisfies BackgroundOptions,
        },
        {
          plugin: 'graph-data',
          key: 'graph-data',
          options: { styles: darkStyles },
        },
        {
          plugin: 'layout-d3-force',
          options: { charge: -250, linkDistance: 60, animate: true },
        },
      ],
    });
    await canvas.init();

    const bg = canvas.plugins.get<BackgroundPlugin>('bg')!;
    const graph = canvas.plugins.get<GraphDataPlugin>('graph-data')!;
    const layout = canvas.plugins.get<D3ForceLayoutPlugin>('layout-d3-force')!;

    graph.setData(buildTreeGraphData());
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1500);

    // Mirror the resolved theme kind into graph styles so nodes/edges stay
    // readable when the system theme flips. Cross-plugin coordination via the
    // event bus is exactly what this event is for.
    canvas.events.on('background:theme-switched', (e: BackgroundThemeSwitchedEvent) => {
      graph.setStyles(e.kind === 'dark' ? darkStyles : lightStyles);
      params.activeTheme = e.theme?.id ?? '(none)';
      params.mode = bg.getMode();
      activeCtl.updateDisplay();
      modeCtl.updateDisplay();
    });

    const params = {
      pickTheme: bg.getActiveTheme()?.id ?? themes[0]!.id,
      mode: bg.getMode(),
      activeTheme: bg.getActiveTheme()?.id ?? '(none)',
      followSystem: () => bg.setMode('auto'),
    };

    const themeChoices = Object.fromEntries(
      themes.map(t => [t.label ?? t.id, t.id]),
    );

    const gui = new GUI({ title: 'Theme', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui
      .add(params, 'pickTheme', themeChoices)
      .name('setTheme(id)')
      .onChange((v: string) => bg.setTheme(v));
    gui.add(params, 'followSystem').name("setMode('auto')");
    const modeCtl = gui.add(params, 'mode').name('Mode').disable();
    const activeCtl = gui.add(params, 'activeTheme').name('Active id').disable();
  },
};
