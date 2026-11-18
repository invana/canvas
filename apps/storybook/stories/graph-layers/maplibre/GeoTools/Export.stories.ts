import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { DrawGeoFeatureBehaviour, GeoFeaturesLayer, MapLayer, downloadGeoJSON, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoTools/Export' };
export default meta;
type Story = StoryObj;

/**
 * **GeoJSON export** — what was drawn, as a file for the brief.
 *
 * Two features are already on the map; draw more with the tool (see the DrawPolygon
 * story for the gestures). **Download .geojson** saves every feature — geometry,
 * `properties` including the `author`, `reportedAt` and `tool` the draw tool
 * recorded — as a standard GeoJSON `FeatureCollection` that opens in QGIS,
 * geojson.io or any GIS. The panel shows the size of what would be saved, and
 * **Features** follows undo and redo, so an undone drawing is not exported.
 * The draft shown while you draw is never part of it. Basemap tiles are
 * OpenFreeMap, so this story needs the network.
 */
export const ExportStory: Story = {
  name: 'Export',
  render: () => createContainer({ id: 'graph-layers-maplibre-geotools-export' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geotools-export')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      { type: 'Feature', id: 'depot', properties: { name: 'Depot', radiusKm: 10, author: 'analyst-1', stroke: '#2563eb', fill: '#2563eb' }, geometry: { type: 'Point', coordinates: [78.49, 17.38] } },
      { type: 'Feature', id: 'route', properties: { name: 'Route', author: 'analyst-1', stroke: '#ea580c' }, geometry: { type: 'LineString', coordinates: [[78.49, 17.38], [79.1, 17.8], [79.6, 18.0]] } }
    ];
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));
    canvas.behaviours.register(new DrawGeoFeatureBehaviour({ id: 'draw', mapLayerId: 'map', featuresLayerId: 'geo' }));

    const canvasOptions = {
      layers: {
        map: { basemap: 'themed', center: [79.1, 17.7], zoom: 7.8, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.2, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 }, point: { fillOpacity: 0.2, strokeWidthPx: 2.5 } }, labelFontPx: 12 }
      },
      behaviours: { theme: { enabled: true, mode: 'document' }, draw: { enabled: true, tool: null as string | null, author: 'analyst-1', properties: { stroke: '#7c3aed', fill: '#7c3aed' } } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Export' });
    onStoryTeardown(() => gui.destroy());
    const readout = { features: 0, bytes: 0 };
    const count = gui.add(readout, 'features').name('Features').disable();
    const size = gui.add(readout, 'bytes').name('File size (bytes)').disable();
    const refresh = (): void => {
      readout.features = geo.features().length;
      readout.bytes = new Blob([JSON.stringify(geo.toGeoJSON(), null, 2)]).size;
      count.updateDisplay();
      size.updateDisplay();
    };
    gui.add({ tool: () => canvas.update({ behaviours: { draw: { enabled: true, tool: 'polygon' } } }) }, 'tool').name('Draw a polygon');
    gui.add({ stop: () => canvas.update({ behaviours: { draw: { tool: null } } }) }, 'stop').name('Stop drawing');
    gui.add({ undo: () => canvas.history.undo() }, 'undo').name('Undo');
    gui.add({ download: () => downloadGeoJSON(geo.toGeoJSON(), 'drawn-features') }, 'download').name('Download .geojson');
    onStoryTeardown(geo.events.on('feature:change', refresh));
    refresh();
  }
};
