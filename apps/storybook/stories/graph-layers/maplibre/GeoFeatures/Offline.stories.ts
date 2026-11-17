import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Offline' };
export default meta;
type Story = StoryObj;

/**
 * **Offline by default** — a map with no network.
 *
 * A `MapLayer` given **no `styleUrl`** loads a plain bundled background: no tiles,
 * no sources, no request to anyone. Features still draw, pan and zoom still work,
 * labels still sit at their centres. This is what an air-gapped deployment gets
 * until it points `styleUrl` at its own tile server — there is deliberately no
 * default basemap, because a default would be an outside call nobody asked for.
 *
 * This story is the proof: every other geo story names OpenFreeMap tiles; this one
 * names nothing, and makes zero requests off this machine.
 */
export const OfflineStory: Story = {
  name: 'Offline',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-offline' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-offline')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'zone',
        properties: { name: 'Operating area', stroke: '#2563eb', fill: '#2563eb' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[78.0, 17.0], [79.4, 17.1], [79.6, 18.3], [78.4, 18.6], [78.0, 17.0]],
            [[78.5, 17.5], [78.9, 17.5], [78.9, 17.9], [78.5, 17.9], [78.5, 17.5]]
          ]
        }
      },
      { type: 'Feature', id: 'route', properties: { name: 'Supply route', stroke: '#ea580c' }, geometry: { type: 'LineString', coordinates: [[77.8, 16.8], [78.7, 17.7], [79.7, 18.5]] } },
      { type: 'Feature', id: 'base', properties: { name: 'Base · 20 km', radiusKm: 20, stroke: '#059669', fill: '#059669' }, geometry: { type: 'Point', coordinates: [79.1, 17.45] } }
    ];

    // No `styleUrl`: the blank bundled style. Nothing here names a server.
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      layers: {
        map: { center: [78.8, 17.7], zoom: 7.8, minZoom: 3, maxZoom: 14 },
        geo: { defaults: { polygon: { fillOpacity: 0.18 }, point: { fillOpacity: 0.2, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 } }, labelFontPx: 12 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'Offline' });
    onStoryTeardown(() => gui.destroy());
    const geo = canvasOptions.layers.geo;
    gui.add(geo, 'labelFontPx', 8, 24, 1).name('Label size (px)').onChange((v: number) => canvas.update({ layers: { geo: { labelFontPx: v } } }));
  }
};
