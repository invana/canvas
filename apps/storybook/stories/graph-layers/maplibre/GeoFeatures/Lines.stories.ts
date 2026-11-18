import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Lines' };
export default meta;
type Story = StoryObj;

/**
 * **Lines from GeoJSON** — routes, borders, cables.
 *
 * - **Primary route** is a `LineString`; **Ring road** a `MultiLineString` (two
 *   separate lines, one feature).
 * - **Planned detour** carries `confirmed: false`, so it draws dashed and faded —
 *   the same rule that marks any unconfirmed feature (see the Provenance story).
 *
 * The width is **screen pixels**, redrawn when a zoom settles: zoom in and out and
 * the line keeps its thickness. A line is clickable within **Click tolerance** px.
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */
export const LinesStory: Story = {
  name: 'Lines',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-lines' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-lines')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'route',
        properties: { name: 'Primary route', stroke: '#2563eb' },
        geometry: { type: 'LineString', coordinates: [[78.49, 17.38], [78.9, 17.6], [79.3, 17.85], [79.59, 17.97], [79.95, 18.2], [80.3, 18.4]] }
      },
      {
        type: 'Feature',
        id: 'ring',
        properties: { name: 'Ring road', stroke: '#ea580c' },
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [[78.3, 17.25], [78.4, 17.2], [78.55, 17.22], [78.62, 17.32]],
            [[78.62, 17.45], [78.55, 17.55], [78.4, 17.58], [78.3, 17.52]]
          ]
        }
      },
      {
        type: 'Feature',
        id: 'detour',
        properties: { name: 'Planned detour', stroke: '#059669', confirmed: false },
        geometry: { type: 'LineString', coordinates: [[78.9, 17.6], [79.0, 17.3], [79.4, 17.2], [79.59, 17.97]] }
      }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      behaviours: { theme: { enabled: true, mode: 'document' } },
      layers: {
        map: { basemap: 'themed', center: [79.3, 17.85], zoom: 7.6, minZoom: 5, maxZoom: 15 },
        geo: { defaults: { line: { strokeWidthPx: 3, strokeOpacity: 0.9 } }, hitTolerancePx: 6, labelFontPx: 12 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Lines' });
    onStoryTeardown(() => gui.destroy());
    const line = canvasOptions.layers.geo.defaults.line;
    const push = (patch: Record<string, unknown>): void => canvas.update({ layers: { geo: patch } });
    gui.add(line, 'strokeWidthPx', 0.5, 12, 0.5).name('Width (px)').onChange(() => push({ defaults: { line } }));
    gui.add(line, 'strokeOpacity', 0, 1, 0.05).name('Opacity').onChange(() => push({ defaults: { line } }));
    gui.add(canvasOptions.layers.geo, 'hitTolerancePx', 0, 30, 1).name('Click tolerance (px)').onChange((v: number) => push({ hitTolerancePx: v }));
    // Round-trip the layer's own event into the panel, so the GUI cannot desync from a click on the map.
    const readout = { clicked: '—' };
    const clicked = gui.add(readout, 'clicked').name('Last clicked').disable();
    onStoryTeardown(
      geo.events.on('feature:click', ({ id }) => {
        readout.clicked = id;
        clicked.updateDisplay();
      })
    );
  }
};
