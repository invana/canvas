/**
 * `MapLayer` `basemap: 'auto'` — a built-in OpenFreeMap basemap that follows the
 * canvas light / dark theme, with **no tile URL in the story**.
 *
 * `ThemeBehaviour` in `document` mode reads the light / dark kind off `<html>`,
 * which is what the **Theme × Variant** toolbar writes, so flipping the toolbar to
 * Light / Dark / System swaps Positron ⇄ Dark. The theme *family* (Rose, Ocean, …)
 * does not reach the map in this mode — see `Basemap/Themed` for that.
 * Needs the network (OpenFreeMap).
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { MapLayer } from '@invana/graph-layer-maplibre';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/Basemap/Auto' };
export default meta;
type Story = StoryObj;

export const AutoStory: Story = {
  name: 'Auto',
  render: () => createContainer({ id: 'graph-maplibre-basemap-auto' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-maplibre-basemap-auto')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // No BackgroundLayer: it paints opaquely in Pixi, on top of the basemap, and would hide it.
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    await canvas.init({
      container,
      autoResize: true,
      config: {
        layers: { map: { basemap: 'auto', center: [79.2, 17.7], zoom: 6 } },
        behaviours: { theme: { enabled: true, mode: 'document' } }
      } as never
    });
  }
};
