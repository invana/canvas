import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Scale1000' };
export default meta;
type Story = StoryObj;

/**
 * **A thousand features** — the cost of pixel-constant strokes and labels.
 *
 * The layer holds **1,000 features** (areas, routes and radii scattered across
 * India, all labelled). Its borders and labels are screen pixels, so every time a
 * zoom *settles* it republishes every feature at the new scale — geometry is
 * cached, only paint changes. That is the cost this story measures: **Last
 * republish (ms)** is the layer's own `publish` event, **Specs** how many it drew.
 *
 * Zoom with the wheel, or use the buttons; nothing is drawn per frame while the
 * view is still. Basemap tiles are OpenFreeMap, so this story needs the network.
 * Volume is the subject here, so the data is generated rather than listed.
 */
export const Scale1000Story: Story = {
  name: 'Scale1000',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-scale-1000' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-scale-1000')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Deterministic pseudo-random numbers: every load draws the same 1,000 features.
    let seed = 5;
    const rand = (): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const features: GeoFeature[] = Array.from({ length: 1000 }, (_, i): GeoFeature => {
      const lng = 72 + rand() * 12;
      const lat = 11 + rand() * 16;
      const color = ['#2563eb', '#ea580c', '#059669', '#7c3aed', '#dc2626'][i % 5]!;
      const properties = { name: `F${i}`, stroke: color, fill: color };
      if (i % 3 === 0) {
        const r = 0.05 + rand() * 0.15;
        return { type: 'Feature', id: `f${i}`, properties, geometry: { type: 'Polygon', coordinates: [[[lng, lat], [lng + r, lat], [lng + r * 1.2, lat + r], [lng, lat + r * 0.8], [lng, lat]]] } };
      }
      if (i % 3 === 1) {
        return { type: 'Feature', id: `f${i}`, properties, geometry: { type: 'LineString', coordinates: [[lng, lat], [lng + 0.1 + rand() * 0.2, lat + rand() * 0.2], [lng + 0.3 + rand() * 0.2, lat + 0.1 + rand() * 0.2]] } };
      }
      return { type: 'Feature', id: `f${i}`, properties: { ...properties, radiusKm: 2 + rand() * 10 }, geometry: { type: 'Point', coordinates: [lng, lat] } };
    });

    const map = new MapLayer({ id: 'map', options: {} });
    canvas.layers.add(map);
    const geo = new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } });
    canvas.layers.add(geo);

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [78, 19], zoom: 5.2, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.2, strokeWidthPx: 1.5 }, line: { strokeWidthPx: 2 }, point: { fillOpacity: 0.2, strokeWidthPx: 1.5 } }, labelFontPx: 11, labelMinZoom: 400 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'Scale 1,000' });
    onStoryTeardown(() => gui.destroy());
    const readout = { features: features.length, specs: 0, lastRepublishMs: 0 };
    gui.add(readout, 'features').name('Features').disable();
    const specs = gui.add(readout, 'specs').name('Specs').disable();
    const last = gui.add(readout, 'lastRepublishMs').name('Last republish (ms)').disable();
    onStoryTeardown(
      geo.events.on('publish', ({ specs: n, durationMs }) => {
        readout.specs = n;
        readout.lastRepublishMs = Math.round(durationMs * 10) / 10;
        specs.updateDisplay();
        last.updateDisplay();
      })
    );
    gui.add({ out: () => map.flyTo({ center: [78, 19], zoom: 5.2, duration: 900 }) }, 'out').name('Whole country (zoom 5)');
    gui.add({ in: () => map.flyTo({ center: [78.5, 17.4], zoom: 9, duration: 900 }) }, 'in').name('A region (zoom 9)');
    gui.add({ close: () => map.flyTo({ center: [78.5, 17.4], zoom: 12, duration: 900 }) }, 'close').name('Close (zoom 12)');
  }
};
