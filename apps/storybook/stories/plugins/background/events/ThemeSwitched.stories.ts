/**
 * Background — Events — background:theme-switched
 *
 * Live demo of `'background:theme-switched'`. Three sources can trigger it:
 *
 *   1. `'initial'` — fires once on plugin registration.
 *   2. `'manual'`  — fires when `setTheme(id)` or `setMode('auto')` is
 *                   called from app code (use the GUI buttons).
 *   3. `'system'`  — fires when the host's `prefers-color-scheme` media
 *                   query flips while the plugin is in `'auto'` mode. To
 *                   see this, click `setMode('auto')` then change your OS
 *                   appearance (System Settings → Appearance on macOS).
 *
 * Events are logged to the Storybook Actions panel.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
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
import { buildTreeGraphData } from '../themes/_themes.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);
Canvas.registerPlugin('layout-d3-force', D3ForceLayoutPlugin);

const lightStyles: IGraphStyles = {
  node: { fill: '#5cd43e', stroke: '#333333', strokeWidth: 2 },
  edge: { stroke: '#666666', strokeWidth: 2 },
};
const darkStyles: IGraphStyles = {
  node: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
  edge: { stroke: '#58a6ff', strokeWidth: 2 },
};

const meta: Meta = { title: 'Plugins/Background/Events' };
export default meta;
type Story = StoryObj;

const themes: BackgroundTheme[] = [
  { id: 'minimal',   kind: 'light', label: 'Minimal',   options: { color: '#b0b0b0', backgroundColor: '#fafafa' } },
  { id: 'paper',     kind: 'light', label: 'Paper',     options: { color: '#d4c9a8', backgroundColor: '#f3eed1' } },
  { id: 'midnight',  kind: 'dark',  label: 'Midnight',  options: { color: '#595959', backgroundColor: '#212121' } },
  { id: 'blueprint', kind: 'dark',  label: 'Blueprint', options: { color: '#5273a5', backgroundColor: '#0b2f66' } },
];

export const ThemeSwitched: Story = {
  name: 'background:theme-switched',
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

    const logThemeSwitched = action('background:theme-switched');

    // Attach the listener BEFORE init() so the 'initial' emission lands.
    canvas.events.on('background:theme-switched', (e: BackgroundThemeSwitchedEvent) => {
      logThemeSwitched(e);
    });

    await canvas.init();
    const bg = canvas.plugins.get<BackgroundPlugin>('bg')!;
    const graph = canvas.plugins.get<GraphDataPlugin>('graph-data')!;
    const layout = canvas.plugins.get<D3ForceLayoutPlugin>('layout-d3-force')!;

    graph.setData(buildTreeGraphData());
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1500);

    // Re-style nodes/edges so they stay legible against whichever theme is active.
    canvas.events.on('background:theme-switched', (e: BackgroundThemeSwitchedEvent) => {
      graph.setStyles(e.kind === 'dark' ? darkStyles : lightStyles);
    });

    const params = {
      pickTheme: bg.getActiveTheme()?.id ?? themes[0]!.id,
      followSystem: () => bg.setMode('auto'),
    };
    const themeChoices = Object.fromEntries(themes.map(t => [t.label ?? t.id, t.id]));

    const gui = new GUI({ title: 'Trigger events', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui
      .add(params, 'pickTheme', themeChoices)
      .name('setTheme(id)')
      .onChange((v: string) => bg.setTheme(v));
    gui.add(params, 'followSystem').name("setMode('auto')");
  },
};
