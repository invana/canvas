import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/PointsRadius' };
export default meta;
type Story = StoryObj;

/**
 * **A point with a radius** — "within N km of here".
 *
 * A `Point` with `radiusKm` draws as a circle of that **ground** radius: it is the
 * same 10, 25 or 50 km at every zoom and grows with the map (Web Mercator is
 * conformal, so a ground circle is a circle on screen — accurate to ~0.5 % for
 * radii of tens of kilometres). The border stays a few screen pixels.
 *
 * - **Depot** (10 km), **Exclusion zone** (25 km, with a 40 km `uncertaintyKm` ring
 *   — "somewhere within this") and **Search area** (50 km).
 * - **Sighting** has no radius: it is a small disc of **Point radius** screen pixels.
 *
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */
export const PointsRadiusStory: Story = {
  name: 'PointsRadius',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-points-radius' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-points-radius')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      { type: 'Feature', id: 'depot', properties: { name: 'Depot · 10 km', radiusKm: 10, fill: '#2563eb', stroke: '#2563eb' }, geometry: { type: 'Point', coordinates: [78.49, 17.38] } },
      {
        type: 'Feature',
        id: 'exclusion',
        properties: { name: 'Exclusion zone · 25 km', radiusKm: 25, uncertaintyKm: 40, fill: '#dc2626', stroke: '#dc2626' },
        geometry: { type: 'Point', coordinates: [79.6, 17.95] }
      },
      { type: 'Feature', id: 'search', properties: { name: 'Search area · 50 km', radiusKm: 50, fill: '#059669', stroke: '#059669' }, geometry: { type: 'Point', coordinates: [78.9, 18.6] } },
      { type: 'Feature', id: 'sighting', properties: { name: 'Sighting', fill: '#7c3aed', stroke: '#ffffff' }, geometry: { type: 'Point', coordinates: [79.3, 17.4] } }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      behaviours: { theme: { enabled: true, mode: 'document' } },
      layers: {
        map: { basemap: 'themed', center: [79.2, 17.9], zoom: 7.5, minZoom: 4, maxZoom: 15 },
        geo: { defaults: { point: { pointRadiusPx: 7, strokeWidthPx: 2, fillOpacity: 0.2, strokeOpacity: 0.9 } }, uncertaintyFillOpacity: 0.1, labelFontPx: 12 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'Points and radii' });
    onStoryTeardown(() => gui.destroy());
    const point = canvasOptions.layers.geo.defaults.point;
    const push = (patch: Record<string, unknown>): void => canvas.update({ layers: { geo: patch } });
    gui.add(point, 'pointRadiusPx', 2, 24, 1).name('Point radius (px)').onChange(() => push({ defaults: { point } }));
    gui.add(point, 'fillOpacity', 0, 1, 0.05).name('Fill opacity').onChange(() => push({ defaults: { point } }));
    gui.add(point, 'strokeWidthPx', 0.5, 8, 0.5).name('Border width (px)').onChange(() => push({ defaults: { point } }));
    gui.add(canvasOptions.layers.geo, 'uncertaintyFillOpacity', 0, 0.6, 0.02).name('Uncertainty ring').onChange((v: number) => push({ uncertaintyFillOpacity: v }));
  }
};
