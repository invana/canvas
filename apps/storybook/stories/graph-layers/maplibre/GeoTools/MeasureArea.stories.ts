import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import {
  GeoFeaturesLayer,
  MapLayer,
  MeasureBehaviour
} from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoTools/MeasureArea' };
export default meta;
type Story = StoryObj;

/**
 * **Measure an area** — set the tool, then click on the map.
 *
 * **Click** the corners of a region; the reading is its **area in km²**. **Double-click** or **Enter** to close it (three corners at least); **Backspace** drops the last corner.
 *
 * The reading follows the pointer on a dashed draft and stays on the finished
 * shape until the next click or **Escape**. Distances and areas are computed on the
 * sphere from longitude / latitude, never from the map's pixel units, so they are
 * right at any latitude (within about 0.5 % of the ellipsoid). **Nothing is stored
 * and nothing enters the history** — a measurement is a look, not an edit.
 * While the tool is on the map does not pan or double-click-zoom (the wheel still
 * zooms); **Escape** twice leaves the tool and gives the map back. Basemap tiles are
 * OpenFreeMap, so this story needs the network.
 */

export const MeasureAreaStory: Story = {
  name: 'MeasureArea',
  render: () => createContainer({ id: 'graph-layers-maplibre-geotools-measure-area' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geotools-measure-area')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Map input is the map's: the draw tool holds it still while a tool is set (no pan, no
    // double-click zoom — the wheel still zooms) and gives it back when the tool is cleared.
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features: [] } }));
    const measure = new MeasureBehaviour({ id: 'measure', mapLayerId: 'map', featuresLayerId: 'geo' });
    canvas.behaviours.register(measure);

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.1, 17.8], zoom: 7.6, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 } }, labelFontPx: 13 }
      },
      behaviours: { measure: { enabled: true, tool: null as string | null } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Measure an area' });
    onStoryTeardown(() => gui.destroy());
    const readout = { tool: 'off', reading: '—', stored: 0 };
    const toolController = gui.add(readout, 'tool').name('Tool').disable();
    const reading = gui.add(readout, 'reading').name('Last reading').disable();
    const stored = gui.add(readout, 'stored').name('Features stored').disable();
    gui.add({ on: () => canvas.update({ behaviours: { measure: { enabled: true, tool: 'area' } } }) }, 'on').name('Start measuring (area)');
    gui.add({ off: () => canvas.update({ behaviours: { measure: { tool: null } } }) }, 'off').name('Stop (give the map back)');

    const behaviour = canvas.behaviours.get<MeasureBehaviour>('measure')!;
    onStoryTeardown(
      behaviour.subscribe(() => {
        readout.tool = behaviour.getOptions().tool ?? 'off';
        readout.reading = behaviour.reading ?? '—';
        readout.stored = geo.features().length; // always 0: a measurement is never a feature
        toolController.updateDisplay();
        reading.updateDisplay();
        stored.updateDisplay();
      })
    );

  }
};
