import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import {
  DrawGeoFeatureBehaviour,
  GeoFeaturesLayer,
  MapLayer
} from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoTools/DrawCircle' };
export default meta;
type Story = StoryObj;

/**
 * **Draw a circle** — set the tool, then draw on the map.
 *
 * **Click** the centre, move out, **click** again to set the radius — it is the ground distance, so the circle is the same size in kilometres at every zoom. A circle is stored as a `Point` with `radiusKm`; the panel shows the last one.
 *
 * While the tool is on, the map does **not** pan or double-click-zoom under the
 * pen (the wheel still zooms); **Escape** abandons the shape, and **Escape** again
 * leaves the tool, which gives the map back. A finished shape is **one** feature
 * with `author`, `reportedAt` and `tool` filled in, and **one undo step**: use
 * **Undo** / **Redo** in the panel. The shape in progress is a dashed draft — it is
 * never stored and never in the history. Basemap tiles are OpenFreeMap, so this
 * story needs the network.
 */

export const DrawCircleStory: Story = {
  name: 'DrawCircle',
  render: () => createContainer({ id: 'graph-layers-maplibre-geotools-draw-circle' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geotools-draw-circle')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Map input is the map's: the draw tool holds it still while a tool is set (no pan, no
    // double-click zoom — the wheel still zooms) and gives it back when the tool is cleared.
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features: [] } }));
    const draw = new DrawGeoFeatureBehaviour({ id: 'draw', mapLayerId: 'map', featuresLayerId: 'geo' });
    canvas.behaviours.register(draw);

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.1, 17.8], zoom: 7.6, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.2, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 }, point: { fillOpacity: 0.15, strokeWidthPx: 2.5 } }, labelFontPx: 12 }
      },
      behaviours: { draw: { enabled: true, tool: null as string | null, author: 'analyst-1', properties: { stroke: '#2563eb', fill: '#2563eb' } } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Draw a circle' });
    onStoryTeardown(() => gui.destroy());
    const readout = { tool: 'off', features: 0, lastRadiusKm: '—' };
    const toolController = gui.add(readout, 'tool').name('Tool').disable();
    const count = gui.add(readout, 'features').name('Features drawn').disable();
    const radius = gui.add(readout, 'lastRadiusKm').name('Last radius (km)').disable();
    gui.add({ on: () => canvas.update({ behaviours: { draw: { enabled: true, tool: 'circle' } } }) }, 'on').name('Start drawing (circle)');
    gui.add({ off: () => canvas.update({ behaviours: { draw: { tool: null } } }) }, 'off').name('Stop (give the map back)');
    gui.add({ undo: () => canvas.history.undo() }, 'undo').name('Undo');
    gui.add({ redo: () => canvas.history.redo() }, 'redo').name('Redo');

    // Round-trip the behaviour's and the layer's own signals into the panel, so it cannot desync from Escape or a click on the map.
    const behaviour = canvas.behaviours.get<DrawGeoFeatureBehaviour>('draw')!;
    onStoryTeardown(
      behaviour.subscribe(() => {
        readout.tool = behaviour.getOptions().tool ?? 'off';
        toolController.updateDisplay();
      })
    );
    onStoryTeardown(
      geo.events.on('feature:change', () => {
        readout.features = geo.features().length;
        const last = geo.features()[geo.features().length - 1]?.properties?.radiusKm;
        readout.lastRadiusKm = typeof last === 'number' ? String(last) : '—';
        count.updateDisplay();
        radius.updateDisplay();
      })
    );

  }
};
