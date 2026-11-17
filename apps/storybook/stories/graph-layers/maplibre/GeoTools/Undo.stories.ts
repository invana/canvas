import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import {
  GeoFeaturesLayer,
  MapLayer,
  type GeoFeature
} from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoTools/Undo' };
export default meta;
type Story = StoryObj;

/**
 * **Undo for drawn features** — the same history as graph edits.
 *
 * `GeoFeaturesLayer` is a **source of the canvas's operation log**: adding,
 * updating and removing a feature is recorded, and `canvas.history.undo()` /
 * `redo()` replay it — a removed feature comes back at its old place in the draw
 * order, an edited one gets its old properties back. Three features are already
 * on the map; use the panel to change them and step back and forth.
 *
 * - **Add a feature** drops a new circle at the map centre, **Rename** edits the
 *   first feature, **Remove last** deletes the newest — each one undo step.
 * - **Features loaded with the layer are not history** (nothing to undo to), and
 *   neither is the dashed draft while you draw.
 * - The readouts follow `feature:change`, which fires for undo and redo as well.
 *
 * Basemap tiles are OpenFreeMap, so this story needs the network.
 */

export const UndoStory: Story = {
  name: 'Undo',
  render: () => createContainer({ id: 'graph-layers-maplibre-geotools-undo' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geotools-undo')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const features: GeoFeature[] = [
      { type: 'Feature', id: 'depot', properties: { name: 'Depot', radiusKm: 12, stroke: '#2563eb', fill: '#2563eb' }, geometry: { type: 'Point', coordinates: [78.49, 17.38] } },
      { type: 'Feature', id: 'route', properties: { name: 'Route', stroke: '#ea580c' }, geometry: { type: 'LineString', coordinates: [[78.49, 17.38], [79.1, 17.8], [79.6, 18.0]] } },
      {
        type: 'Feature',
        id: 'zone',
        properties: { name: 'Zone', stroke: '#059669', fill: '#059669' },
        geometry: { type: 'Polygon', coordinates: [[[79.3, 17.2], [79.8, 17.2], [79.8, 17.6], [79.3, 17.6], [79.3, 17.2]]] }
      }
    ];
    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.1, 17.7], zoom: 7.7, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.2, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3 }, point: { fillOpacity: 0.2, strokeWidthPx: 2.5 } }, labelFontPx: 12 }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const geo = canvas.layers.get<GeoFeaturesLayer>('geo')!;
    const gui = new GUI({ title: 'Undo' });
    onStoryTeardown(() => gui.destroy());
    const readout = { features: '', undoable: false, redoable: false };
    const list = gui.add(readout, 'features').name('Features (draw order)').disable();
    const canUndo = gui.add(readout, 'undoable').name('Can undo').disable();
    const canRedo = gui.add(readout, 'redoable').name('Can redo').disable();
    const refresh = (): void => {
      readout.features = geo.features().map((f) => String(f.id)).join(' · ') || '—';
      readout.undoable = canvas.history.canUndo();
      readout.redoable = canvas.history.canRedo();
      list.updateDisplay();
      canUndo.updateDisplay();
      canRedo.updateDisplay();
    };
    let n = 0;
    gui.add({ add: () => geo.addFeature({ type: 'Feature', id: `new-${++n}`, properties: { name: `New ${n}`, radiusKm: 8, stroke: '#7c3aed', fill: '#7c3aed' }, geometry: { type: 'Point', coordinates: [78.2 + n * 0.25, 17.9] } }) }, 'add').name('Add a feature');
    gui.add({ rename: () => geo.updateFeature('depot', { properties: { name: `Depot ${++n}` } }) }, 'rename').name('Rename Depot');
    gui.add({ remove: () => { const last = geo.features()[geo.features().length - 1]; if (last) geo.removeFeature(last.id); } }, 'remove').name('Remove last');
    gui.add({ undo: () => canvas.history.undo() }, 'undo').name('Undo');
    gui.add({ redo: () => canvas.history.redo() }, 'redo').name('Redo');
    // `feature:change` fires while a replay is still running, before the log has moved its
    // cursor — so the undo / redo flags follow the history itself, and the list the layer.
    onStoryTeardown(geo.events.on('feature:change', refresh));
    onStoryTeardown(canvas.history.subscribe(refresh));
    refresh();

  }
};
