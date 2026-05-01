/**
 * ThemedBackground — Responsive (auto)
 *
 * Demonstrates `ThemedBackgroundPlugin` with `mode: 'auto'`. The plugin
 * tracks the host's `prefers-color-scheme` media query and renders the
 * matching variant of the active theme whenever the OS preference flips.
 *
 * `setTheme(id)` switches the named look; `setMode('light' | 'dark')` pins
 * a variant; `setMode('auto')` re-arms system following.
 *
 * To verify auto behavior, change your OS appearance (System Settings →
 * Appearance on macOS) while the story is open and watch the canvas re-theme.
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import {
  Canvas,
  ThemedBackgroundPlugin,
  type ThemedBackgroundOptions,
  type ThemedBackgroundMode,
  type ThemedBackgroundThemeSwitchedEvent,
  type ThemedBackgroundModeUpdatedEvent,
} from '@invana/canvas';
import { GraphDataPlugin } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { createContainer } from '../../../src/div-utils.js';
import { THEMED_BACKGROUNDS, STYLES_BY_KIND, buildTreeGraphData } from './_themed.js';

const meta: Meta = { title: 'Plugins/ThemedBackground' };
export default meta;
type Story = StoryObj;

export const Responsive: Story = {
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
    await canvas.init();

    const bg = canvas.plugins.get<ThemedBackgroundPlugin>('bg')!;
    const graph = canvas.plugins.get<GraphDataPlugin>('graph-data')!;
    const layout = canvas.plugins.get<D3ForceLayoutPlugin>('layout-d3-force')!;

    graph.setData(buildTreeGraphData());
    await layout.start();
    setTimeout(() => graph.fitContent(60), 1500);

    // Sync graph styles to whichever variant is being rendered.
    const syncGraphStyles = (kind: 'light' | 'dark') => graph.setStyles(STYLES_BY_KIND[kind]);
    syncGraphStyles(bg.getResolvedKind());

    canvas.events.on('themed-background:theme-switched', (e: ThemedBackgroundThemeSwitchedEvent) => {
      syncGraphStyles(e.resolvedKind);
      params.activeTheme = e.theme.id;
      params.resolvedKind = e.resolvedKind;
      activeCtl.updateDisplay();
      kindCtl.updateDisplay();
    });
    canvas.events.on('themed-background:mode-updated', (e: ThemedBackgroundModeUpdatedEvent) => {
      syncGraphStyles(e.resolvedKind);
      params.mode = e.mode;
      params.resolvedKind = e.resolvedKind;
      modeCtl.updateDisplay();
      kindCtl.updateDisplay();
    });

    const themeChoices = Object.fromEntries(
      THEMED_BACKGROUNDS.map(t => [t.label ?? t.id, t.id]),
    );

    const params = {
      pickTheme: bg.getActiveTheme().id,
      mode: bg.getMode(),
      activeTheme: bg.getActiveTheme().id,
      resolvedKind: bg.getResolvedKind(),
    };

    const gui = new GUI({ title: 'Theme', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
    gui
      .add(params, 'pickTheme', themeChoices)
      .name('setTheme(id)')
      .onChange((v: string) => bg.setTheme(v));
    gui
      .add(params, 'mode', ['auto', 'light', 'dark'])
      .name('setMode(...)')
      .onChange((v: ThemedBackgroundMode) => bg.setMode(v));
    const modeCtl = gui.add(params, 'mode').name('Mode').disable();
    const activeCtl = gui.add(params, 'activeTheme').name('Active id').disable();
    const kindCtl = gui.add(params, 'resolvedKind').name('Resolved kind').disable();
  },
};
