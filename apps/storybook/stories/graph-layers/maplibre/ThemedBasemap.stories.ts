/**
 * `MapLayer` `styleUrlDark` — the basemap follows the canvas light / dark theme.
 *
 * `styleUrl` is the light style, `styleUrlDark` the dark one. A `ThemeBehaviour`
 * publishes the canvas theme; `MapLayer` listens to `theme:change` and swaps the
 * basemap style to match. Flip **mode** in the GUI to watch both the canvas
 * background and the tiles change together. Needs the network (OpenFreeMap).
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { MapLayer } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/ThemedBasemap' };
export default meta;
type Story = StoryObj;

export const ThemedBasemap: Story = {
  name: 'Themed basemap (light / dark)',
  render: () => createContainer({ id: 'graph-maplibre-themed' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-maplibre-themed')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // No BackgroundLayer: it paints opaquely in Pixi, on top of the basemap, and would hide it.
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    const state = { mode: 'light' as 'light' | 'dark' | 'system' };
    await canvas.init({
      container,
      autoResize: true,
      config: {
        layers: {
          map: {
            styleUrl: 'https://tiles.openfreemap.org/styles/positron',
            styleUrlDark: 'https://tiles.openfreemap.org/styles/dark',
            center: [79.2, 17.7],
            zoom: 6
          }
        },
        behaviours: { theme: { enabled: true, mode: state.mode } }
      } as never
    });

    const gui = new GUI({ title: 'MapLayer — themed basemap' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(state, 'mode', ['light', 'dark', 'system'])
      .onChange(() => canvas.update({ behaviours: { theme: { mode: state.mode } } } as never));
  }
};
