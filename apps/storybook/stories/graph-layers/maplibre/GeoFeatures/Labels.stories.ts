import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Labels' };
export default meta;
type Story = StoryObj;

/**
 * **Area labels** — a name at each area's **visual centre**, one size on screen.
 *
 * The centre is the pole of inaccessibility (`polylabel`): the point farthest from
 * every border, holes respected. For the ring-with-a-hole and the crescent that is
 * *not* the middle of the bounding box, which is where a naive label would sit —
 * on the hole, or off the shape.
 *
 * The text keeps its authored pixel size at every zoom (a label size policy on the
 * layer's own renderer). **Labels from map zoom** hides them below a zoom — it is
 * set as map zoom here and sent to the layer as camera scale (`2 ** zoom`).
 * **Label property** switches what is read from each feature (`name` or `code`).
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */
export const LabelsStory: Story = {
  name: 'Labels',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-labels' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-labels')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'ring',
        properties: { name: 'Ring with a hole', code: 'A-1', stroke: '#7c3aed', fill: '#7c3aed' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[78.2, 17.2], [78.9, 17.2], [78.9, 17.9], [78.2, 17.9], [78.2, 17.2]],
            [[78.3, 17.3], [78.8, 17.3], [78.8, 17.8], [78.3, 17.8], [78.3, 17.3]]
          ]
        }
      },
      {
        type: 'Feature',
        id: 'crescent',
        properties: { name: 'Crescent', code: 'B-2', stroke: '#ea580c', fill: '#ea580c' },
        geometry: {
          type: 'Polygon',
          coordinates: [[[79.2, 17.2], [79.9, 17.2], [79.9, 17.4], [79.4, 17.4], [79.4, 17.7], [79.9, 17.7], [79.9, 17.9], [79.2, 17.9], [79.2, 17.2]]]
        }
      },
      {
        type: 'Feature',
        id: 'corridor',
        properties: { name: 'Corridor', code: 'C-3', stroke: '#059669' },
        geometry: { type: 'LineString', coordinates: [[78.2, 18.2], [78.8, 18.35], [79.4, 18.3], [79.9, 18.5]] }
      },
      { type: 'Feature', id: 'unnamed', properties: { stroke: '#64748b', fill: '#64748b' }, geometry: { type: 'Polygon', coordinates: [[[80.1, 17.2], [80.4, 17.2], [80.4, 17.5], [80.1, 17.5], [80.1, 17.2]]] } }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.3, 17.8], zoom: 7.7, minZoom: 4, maxZoom: 15 },
        geo: { labelKey: 'name', labelFontPx: 13, labelBackground: true, defaults: { polygon: { fillOpacity: 0.2 } } }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'Labels' });
    onStoryTeardown(() => gui.destroy());
    const geo = canvasOptions.layers.geo;
    const push = (patch: Record<string, unknown>): void => canvas.update({ layers: { geo: patch } });
    const choice = { labelsFromMapZoom: 0 };
    gui.add(geo, 'labelKey', ['name', 'code']).name('Label property').onChange((v: string) => push({ labelKey: v }));
    gui.add(geo, 'labelFontPx', 8, 28, 1).name('Label size (px)').onChange((v: number) => push({ labelFontPx: v }));
    gui.add(geo, 'labelBackground').name('Background').onChange((v: boolean) => push({ labelBackground: v }));
    gui
      .add(choice, 'labelsFromMapZoom', 0, 12, 0.5)
      .name('Labels from map zoom')
      .onChange((z: number) => push({ labelMinZoom: z === 0 ? 0 : 2 ** z }));
  }
};
