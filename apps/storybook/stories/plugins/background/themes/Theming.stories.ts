/**
 * Background — Themes — Toggle
 *
 * Lil-gui dropdown that hot-swaps the active preset at runtime via
 * `BackgroundPlugin.setOptions()` and `GraphDataPlugin.setStyles()`. Graph
 * data is a random tree positioned by `D3ForceLayoutPlugin`.
 *
 * API used:
 *   BackgroundPlugin.setOptions  — runtime background swap
 *   GraphDataPlugin.setStyles    — runtime style swap
 *   D3ForceLayoutPlugin.start    — begin force simulation
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { createContainer } from '../../../../src/div-utils.js';
import { THEMES, buildTreeGraphData } from './_themes.js';

const meta: Meta = { title: 'Plugins/Background/Themes' };
export default meta;
type Story = StoryObj;

export const Theming: Story = {
  name: 'Theming (toggle)',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const initial: keyof typeof THEMES = 'blueprint';
    const initialTheme = THEMES[initial];

    const canvas = new Canvas({
      container,
      backgroundColor: initialTheme.canvasBackground,
      plugins: [
        { plugin: 'background', key: 'bg', options: initialTheme.background },
        { plugin: 'graph-data', key: 'graph-data', options: { styles: initialTheme.styles } },
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

    const params = { theme: initial as keyof typeof THEMES };
    const apply = (key: keyof typeof THEMES): void => {
      const theme = THEMES[key];
      bg.setOptions(theme.background as Parameters<typeof bg.setOptions>[0]);
      graph.setStyles(theme.styles);
    };

    const gui = new GUI({ title: 'Themes', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui
      .add(params, 'theme', { Blueprint: 'blueprint', 'Minimal Light': 'light', Dark: 'dark' })
      .name('Theme')
      .onChange((v: keyof typeof THEMES) => apply(v));
  },
};
