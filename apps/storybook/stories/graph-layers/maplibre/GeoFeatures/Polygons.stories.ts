import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Polygons' };
export default meta;
type Story = StoryObj;

/**
 * **Polygons from GeoJSON** — what `GeoFeaturesLayer` does with areas.
 *
 * - **Hyderabad ring** is a `Polygon` with a **hole**: the fill is one closed ring
 *   joined to the hole by a zero-width bridge, and each boundary is stroked on its
 *   own, so the hole is empty and no seam is drawn along the bridge.
 * - **Two islands** is one `MultiPolygon`, one feature, two areas.
 * - **Notch** is a concave polygon — the bridge has to find a vertex it can see.
 *
 * Styles come from simplestyle properties (`stroke`, `fill`, …) on each feature;
 * the border is **screen pixels** at every zoom — zoom in and out and it keeps its
 * thickness (the layer redraws when a zoom settles). Names are labels at each
 * area's visual centre, one size on screen.
 *
 * Try the **Fill opacity** slider to 1 and zoom to the hole: nothing should
 * hairline across it. Basemap tiles are OpenFreeMap, so this story needs the
 * network; the layer itself makes no outside call.
 */
export const PolygonsStory: Story = {
  name: 'Polygons',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-polygons' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-polygons')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'ring',
        properties: { name: 'Hyderabad ring', stroke: '#7c3aed', fill: '#7c3aed' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[78.2, 17.2], [78.5, 17.12], [78.8, 17.25], [78.85, 17.55], [78.6, 17.7], [78.3, 17.62], [78.2, 17.2]],
            [[78.4, 17.35], [78.6, 17.33], [78.62, 17.5], [78.44, 17.52], [78.4, 17.35]]
          ]
        }
      },
      {
        type: 'Feature',
        id: 'islands',
        properties: { name: 'Two islands', stroke: '#ea580c', fill: '#ea580c' },
        geometry: {
          type: 'MultiPolygon',
          coordinates: [
            [[[79.1, 17.2], [79.35, 17.18], [79.4, 17.4], [79.15, 17.45], [79.1, 17.2]]],
            [[[79.5, 17.5], [79.8, 17.45], [79.85, 17.7], [79.55, 17.75], [79.5, 17.5]]]
          ]
        }
      },
      {
        type: 'Feature',
        id: 'notch',
        properties: { name: 'Notch', stroke: '#059669', fill: '#059669' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[78.1, 17.85], [78.9, 17.85], [78.9, 18.0], [78.5, 18.0], [78.5, 18.2], [78.9, 18.2], [78.9, 18.35], [78.1, 18.35], [78.1, 17.85]]
          ]
        }
      }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.15, 17.75], zoom: 7.4, minZoom: 5, maxZoom: 15 },
        geo: {
          defaults: { polygon: { strokeWidthPx: 2, strokeOpacity: 0.9, fillOpacity: 0.25 } },
          labelFontPx: 12,
          labelBackground: true
        }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Polygons' });
    onStoryTeardown(() => gui.destroy());
    const polygon = canvasOptions.layers.geo.defaults.polygon;
    const push = (patch: Record<string, unknown>): void => canvas.update({ layers: { geo: patch } });
    gui.add(polygon, 'fillOpacity', 0, 1, 0.05).name('Fill opacity').onChange(() => push({ defaults: { polygon } }));
    gui.add(polygon, 'strokeWidthPx', 0.5, 10, 0.5).name('Border width (px)').onChange(() => push({ defaults: { polygon } }));
    gui.add(polygon, 'strokeOpacity', 0, 1, 0.05).name('Border opacity').onChange(() => push({ defaults: { polygon } }));
    gui.add(canvasOptions.layers.geo, 'labelFontPx', 8, 24, 1).name('Label size (px)').onChange((v: number) => push({ labelFontPx: v }));
  }
};
