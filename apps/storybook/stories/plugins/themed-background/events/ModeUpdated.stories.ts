/**
 * ThemedBackground — Events — themed-background:mode-updated
 *
 * Live demo of `'themed-background:mode-updated'`. Sources:
 *
 *   1. `'manual'` — fires when `setMode('auto' | 'light' | 'dark')` is
 *      called from app code (use the GUI dropdown).
 *   2. `'system'` — fires when the host's `prefers-color-scheme` flips
 *      while the plugin is in `'auto'` mode. Note that `mode` itself is
 *      unchanged in this case — only `resolvedKind` changes — but the
 *      event still fires so listeners that watch the rendered variant
 *      (e.g. graph styles) get notified.
 *
 * Events are logged to the Storybook Actions panel.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import { action } from 'storybook/actions';
import GUI from 'lil-gui';
import {
  Canvas,
  ThemedBackgroundPlugin,
  type ThemedBackgroundOptions,
  type ThemedBackgroundMode,
  type ThemedBackgroundModeUpdatedEvent,
  type ThemedBackgroundThemeSwitchedEvent,
} from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { createContainer } from '../../../../src/div-utils.js';
import { THEMED_BACKGROUNDS, STYLES_BY_KIND, buildTreeGraphData } from '../_themed.js';

const meta: Meta = { title: 'Plugins/ThemedBackground/Events' };
export default meta;
type Story = StoryObj;

export const ModeUpdated: Story = {
  name: 'themed-background:mode-updated',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const canvas = new Canvas({
      container,
      backgroundColor: '#1a1a2e',
      plugins: [
        {
          plugin: 'themed-background',
          key: 'bg',
          options: {
            themes: THEMED_BACKGROUNDS,
            defaultTheme: 'minimal',
            mode: 'auto',
          } satisfies ThemedBackgroundOptions,
        },
        {
          plugin: 'graph-data',
          key: 'graph-data',
          options: { styles: STYLES_BY_KIND.dark },
        },
        {
          plugin: 'layout-d3-force',
          options: { charge: -250, linkDistance: 60, animate: true },
        },
      ],
    });

    const logModeUpdated = action('themed-background:mode-updated');
    const logThemeSwitched = action('themed-background:theme-switched');

    canvas.events.on('themed-background:mode-updated', (e: ThemedBackgroundModeUpdatedEvent) => {
      logModeUpdated(e);
    });
    canvas.events.on('themed-background:theme-switched', (e: ThemedBackgroundThemeSwitchedEvent) => {
      logThemeSwitched(e);
    });

    await canvas.init();
    const bg = canvas.plugins.get<ThemedBackgroundPlugin>('bg')!;
    const graph = canvas.plugins.get<GraphDataPlugin>('graph-data')!;
    const layout = canvas.plugins.get<D3ForceLayoutPlugin>('layout-d3-force')!;

    graph.setData(buildTreeGraphData());
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1500);
    graph.setStyles(STYLES_BY_KIND[bg.getResolvedKind()]);

    canvas.events.on('themed-background:mode-updated', (e: ThemedBackgroundModeUpdatedEvent) => {
      graph.setStyles(STYLES_BY_KIND[e.resolvedKind]);
    });

    const params = { mode: bg.getMode() };
    const gui = new GUI({ title: 'Trigger events', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui
      .add(params, 'mode', ['auto', 'light', 'dark'])
      .name('setMode(...)')
      .onChange((v: ThemedBackgroundMode) => bg.setMode(v));
  },
};
