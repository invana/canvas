/**
 * Background — Events — background:mode-updated
 *
 * Live demo of `'background:mode-updated'`. Flipping the Dark mode checkbox
 * calls `setTheme(id)` while currently in `'auto'`, which flips into
 * `'manual'` as a side effect — so a single `setTheme()` emits both
 * `'mode-updated'` and `'theme-switched'`. Events are logged to the
 * Storybook Actions panel.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import GUI from 'lil-gui';
import {
  Canvas,
  BackgroundPlugin,
  type BackgroundOptions,
  type BackgroundTheme,
  type BackgroundModeUpdatedEvent,
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
  { id: 'minimal',  kind: 'light', label: 'Minimal',  options: { color: '#b0b0b0', backgroundColor: '#fafafa' } },
  { id: 'midnight', kind: 'dark',  label: 'Midnight', options: { color: '#595959', backgroundColor: '#212121' } },
];

export const ModeUpdated: Story = {
  name: 'background:mode-updated',
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

    const logModeUpdated = action('background:mode-updated');
    const logThemeSwitched = action('background:theme-switched');

    canvas.events.on('background:mode-updated', (e: BackgroundModeUpdatedEvent) => {
      logModeUpdated(e);
    });
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

    canvas.events.on('background:theme-switched', (e: BackgroundThemeSwitchedEvent) => {
      graph.setStyles(e.kind === 'dark' ? darkStyles : lightStyles);
    });

    const params = { mode: 'auto' as 'auto' | 'light' | 'dark' };
    const gui = new GUI({ title: 'Trigger events', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui
      .add(params, 'mode', ['auto', 'light', 'dark'])
      .name('Mode')
      .onChange((v: 'auto' | 'light' | 'dark') => {
        if (v === 'auto') bg.setMode('auto');
        else bg.setTheme(v === 'dark' ? 'midnight' : 'minimal');
      });
  },
};
