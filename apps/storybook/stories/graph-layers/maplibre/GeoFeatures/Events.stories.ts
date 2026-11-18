import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import { GeoFeaturesLayer, MapLayer, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoFeatures/Events' };
export default meta;
type Story = StoryObj;

/**
 * **Click and hover** — picking an area, a route or a radius on a map.
 *
 * Under a `MapLayer` the **map owns the pointer**: the canvas is pointer-transparent
 * so MapLibre can pan and zoom. So the layer is given the map's id (`mapLayerId`)
 * and listens to the map's forwarded `map:click` / `map:hover`, then hit-tests its
 * own geometry — point-in-polygon (a click in a hole misses), distance to a line,
 * containment in a circle. Points beat lines beat areas where they overlap.
 *
 * The panel shows the last `feature:hover` and `feature:click` the layer emitted —
 * those two events are the whole API. The panel's **Select** drops the id of the
 * clicked feature into `Selected`; **Remove selected** calls `removeFeature`.
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */
export const EventsStory: Story = {
  name: 'Events',
  render: () => createContainer({ id: 'graph-layers-maplibre-geofeatures-events' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geofeatures-events')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'ring',
        properties: { name: 'Ring with a hole', stroke: '#7c3aed', fill: '#7c3aed' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[78.2, 17.2], [78.9, 17.2], [78.9, 17.9], [78.2, 17.9], [78.2, 17.2]],
            [[78.4, 17.4], [78.7, 17.4], [78.7, 17.7], [78.4, 17.7], [78.4, 17.4]]
          ]
        }
      },
      { type: 'Feature', id: 'route', properties: { name: 'Route', stroke: '#2563eb' }, geometry: { type: 'LineString', coordinates: [[78.1, 17.1], [78.55, 17.55], [79.1, 17.9], [79.6, 18.0]] } },
      { type: 'Feature', id: 'zone', properties: { name: 'Zone · 30 km', radiusKm: 30, stroke: '#dc2626', fill: '#dc2626' }, geometry: { type: 'Point', coordinates: [79.5, 17.4] } }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      behaviours: { theme: { enabled: true, mode: 'document' } },
      layers: {
        map: { basemap: 'themed', center: [79.1, 17.6], zoom: 7.9, minZoom: 4, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.2 }, point: { fillOpacity: 0.2, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 4 } }, hitTolerancePx: 8, labelFontPx: 12 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Events' });
    onStoryTeardown(() => gui.destroy());
    const readout = { hover: '—', click: '—', selected: '—' };
    const hover = gui.add(readout, 'hover').name('feature:hover').disable();
    const click = gui.add(readout, 'click').name('feature:click').disable();
    const selected = gui.add(readout, 'selected').name('Selected').disable();
    gui.add(canvasOptions.layers.geo, 'hitTolerancePx', 0, 30, 1).name('Tolerance (px)').onChange((v: number) => canvas.update({ layers: { geo: { hitTolerancePx: v } } }));
    gui
      .add(
        {
          remove: () => {
            if (readout.selected === '—') return;
            geo.removeFeature(readout.selected);
            readout.selected = '—';
            selected.updateDisplay();
          }
        },
        'remove'
      )
      .name('Remove selected');

    // Round-trip the layer's events into the panel, so it cannot desync from the map.
    onStoryTeardown(
      geo.events.on('feature:hover', ({ id }) => {
        readout.hover = id ?? '—';
        hover.updateDisplay();
      })
    );
    onStoryTeardown(
      geo.events.on('feature:click', ({ id, lngLat }) => {
        readout.click = `${id} @ ${lngLat[0].toFixed(3)}, ${lngLat[1].toFixed(3)}`;
        readout.selected = id;
        click.updateDisplay();
        selected.updateDisplay();
      })
    );
  }
};
