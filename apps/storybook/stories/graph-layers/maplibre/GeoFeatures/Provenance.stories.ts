import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Provenance' };
export default meta;
type Story = StoryObj;

/**
 * **Provenance and uncertainty** — how far to trust a feature, visibly.
 *
 * Every feature may carry `source`, `reportedAt`, `author`, `confidence` (0–1),
 * `reliability` (Admiralty code: source grade A–F, information grade 1–6, e.g.
 * `B2`) and `classification`. They ride on `properties` and come back out of
 * `toGeoJSON()`. A value that is present and wrong (`reliability: 'Z9'`) is
 * reported once in the console and ignored.
 *
 * Two of them change how a feature **draws**:
 *
 * - A feature with `confidence` below **Unconfirmed below** — or `confirmed: false`
 *   — draws **dashed and faded**. Here *Eastern ridge* (0.3) and *Rumoured camp*
 *   are unconfirmed; *Confirmed depot* (0.9) and *Checkpoint* (0.6) are not.
 * - `uncertaintyKm` draws a translucent ring: *Rumoured camp* is "somewhere within
 *   30 km", not a precise fix.
 *
 * **Confirm Rumoured camp** calls `layer.updateFeature` — the camp turns solid and
 * the ring stays (its uncertainty is a separate fact). Labels show the Admiralty
 * code and confidence so the data is readable without a tooltip.
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */
export const ProvenanceStory: Story = {
  name: 'Provenance',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-provenance' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-provenance')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'depot',
        properties: {
          name: 'Confirmed depot · A1 · 0.9',
          source: 'Satellite pass 41',
          reportedAt: '2026-11-16T06:40:00Z',
          author: 'analyst-3',
          confidence: 0.9,
          reliability: 'A1',
          classification: 'RESTRICTED',
          radiusKm: 6,
          fill: '#2563eb',
          stroke: '#2563eb'
        },
        geometry: { type: 'Point', coordinates: [78.49, 17.38] }
      },
      {
        type: 'Feature',
        id: 'ridge',
        properties: {
          name: 'Eastern ridge · C4 · 0.3',
          source: 'Single informant',
          reportedAt: '2026-11-15T21:10:00Z',
          confidence: 0.3,
          reliability: 'C4',
          fill: '#ea580c',
          stroke: '#ea580c'
        },
        geometry: { type: 'Polygon', coordinates: [[[79.3, 17.6], [79.7, 17.55], [79.8, 17.9], [79.4, 18.0], [79.3, 17.6]]] }
      },
      {
        type: 'Feature',
        id: 'camp',
        properties: {
          name: 'Rumoured camp · F6',
          source: 'Social media post',
          reportedAt: '2026-11-17T02:05:00Z',
          confirmed: false,
          reliability: 'F6',
          radiusKm: 4,
          uncertaintyKm: 30,
          fill: '#dc2626',
          stroke: '#dc2626'
        },
        geometry: { type: 'Point', coordinates: [79.0, 18.3] }
      },
      {
        type: 'Feature',
        id: 'checkpoint',
        properties: { name: 'Checkpoint · B2 · 0.6', confidence: 0.6, reliability: 'B2', source: 'Patrol log', stroke: '#059669', fill: '#059669' },
        geometry: { type: 'LineString', coordinates: [[78.7, 17.2], [78.95, 17.35], [79.2, 17.3]] }
      }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      behaviours: { theme: { enabled: true, mode: 'document' } },
      layers: {
        map: { basemap: 'themed', center: [79.1, 17.85], zoom: 7.8, minZoom: 4, maxZoom: 15 },
        geo: {
          defaults: { polygon: { fillOpacity: 0.25, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 }, point: { fillOpacity: 0.25, strokeWidthPx: 2.5 } },
          unconfirmed: { below: 0.5, alpha: 0.6 },
          uncertaintyFillOpacity: 0.1,
          labelFontPx: 12
        }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Provenance' });
    onStoryTeardown(() => gui.destroy());
    const rule = canvasOptions.layers.geo.unconfirmed;
    const push = (patch: Record<string, unknown>): void => canvas.update({ layers: { geo: patch } });
    gui.add(rule, 'below', 0, 1, 0.05).name('Unconfirmed below').onChange(() => push({ unconfirmed: rule }));
    gui.add(rule, 'alpha', 0.1, 1, 0.05).name('Unconfirmed opacity').onChange(() => push({ unconfirmed: rule }));
    gui.add(canvasOptions.layers.geo, 'uncertaintyFillOpacity', 0, 0.5, 0.02).name('Uncertainty ring').onChange((v: number) => push({ uncertaintyFillOpacity: v }));
    // Drive the layer's own API, not the specs under it.
    gui.add({ confirm: () => geo.updateFeature('camp', { properties: { confirmed: true } }) }, 'confirm').name('Confirm Rumoured camp');
    gui.add({ unconfirm: () => geo.updateFeature('camp', { properties: { confirmed: false } }) }, 'unconfirm').name('Unconfirm Rumoured camp');
  }
};
