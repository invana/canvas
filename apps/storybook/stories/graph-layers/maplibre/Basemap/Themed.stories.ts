/**
 * `MapLayer` `basemap: 'themed'` — the basemap wears the active design-kit theme
 * family, not just light / dark.
 *
 * `ThemeBehaviour` publishes the palette; `MapLayer` tints the loaded style from
 * it — land ← `surface`, water ← a tint of `accent`, roads / buildings / boundaries
 * ← blends of `foreground` / `muted`, labels ← `foreground` — and re-tints on every
 * `theme:change`. Pick a **Theme** (Rose, Ocean, Forest, …) and a **Variant** in
 * the toolbar and watch the map follow. The GUI exposes the whole `basemap` option
 * so the tinted map can be compared with the plain ones.
 *
 * `CanvasThemeSync` (reads the design-kit's CSS tokens, so any family works) is
 * what a React app mounts for the family — see `canvas-demos/…/ZoneAnalysis`. This
 * imperative story reads `<html>` through `ThemeBehaviour`'s `document` mode, whose
 * family wins when the engine has a palette of that name. Needs the network.
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { MapLayer } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/Basemap/Themed' };
export default meta;
type Story = StoryObj;

export const ThemedStory: Story = {
  name: 'Themed',
  render: () => createContainer({ id: 'graph-maplibre-basemap-themed' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-maplibre-basemap-themed')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    // Every option of the basemap preset exposed here (MapLayerOptions.basemap).
    const canvasOptions = {
      layers: { map: { basemap: 'themed', center: [79.2, 17.7], zoom: 6 } },
      behaviours: { theme: { enabled: true, mode: 'document' } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions as never });

    const gui = new GUI({ title: 'MapLayer — basemap' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(canvasOptions.layers.map, 'basemap', ['light', 'dark', 'auto', 'themed'])
      .name('basemap')
      .onChange((v: string) => canvas.update({ layers: { map: { basemap: v } } } as never));
  }
};
