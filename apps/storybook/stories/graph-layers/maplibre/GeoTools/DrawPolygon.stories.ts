import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, ThemeBehaviour } from '@invana/graph';
import {
  DrawGeoFeatureBehaviour,
  GeoFeaturesLayer,
  MapLayer
} from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoTools/DrawPolygon' };
export default meta;
type Story = StoryObj;

/**
 * **Draw a polygon** — set the tool, then draw on the map.
 *
 * **Click** to place each corner; **double-click** or **Enter** to close it (three corners at least); **Backspace** drops the last corner.
 *
 * While the tool is on, the map does **not** pan or double-click-zoom under the
 * pen (the wheel still zooms); **Escape** abandons the shape, and **Escape** again
 * leaves the tool, which gives the map back. A finished shape is **one** feature
 * with `author`, `reportedAt` and `tool` filled in, and **one undo step**: use
 * **Undo** / **Redo** in the panel. The shape in progress is a dashed draft — it is
 * never stored and never in the history. Basemap tiles are OpenFreeMap, so this
 * story needs the network.
 */

export const DrawPolygonStory: Story = {
  name: 'DrawPolygon',
  render: () => createContainer({ id: 'graph-layers-maplibre-geotools-draw-polygon' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geotools-draw-polygon')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    // Map input is the map's: the draw tool holds it still while a tool is set (no pan, no
    // double-click zoom — the wheel still zooms) and gives it back when the tool is cleared.
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features: [] } }));
    const draw = new DrawGeoFeatureBehaviour({ id: 'draw', mapLayerId: 'map', featuresLayerId: 'geo' });
    canvas.behaviours.register(draw);

    const canvasOptions = {
      layers: {
        map: { basemap: 'themed', center: [79.1, 17.8], zoom: 7.6, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.2, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 }, point: { fillOpacity: 0.15, strokeWidthPx: 2.5 } }, labelFontPx: 12 }
      },
      behaviours: { theme: { enabled: true, mode: 'document' }, draw: { enabled: true, tool: null as string | null, author: 'analyst-1', properties: { stroke: '#2563eb', fill: '#2563eb' } } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Draw a polygon' });
    onStoryTeardown(() => gui.destroy());
    const readout = { tool: 'off', features: 0, lastRadiusKm: '—' };
    const toolController = gui.add(readout, 'tool').name('Tool').disable();
    const count = gui.add(readout, 'features').name('Features drawn').disable();
    const radius = gui.add(readout, 'lastRadiusKm').name('Last radius (km)').disable();
    gui.add({ on: () => canvas.update({ behaviours: { draw: { enabled: true, tool: 'polygon' } } }) }, 'on').name('Start drawing (polygon)');
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
