import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ClickSelectBehaviour, GraphCanvas, GraphLayer, NodeScaleLODBehaviour, type GraphNode } from '@invana/graph';
import { AreaQueryBehaviour, GeoFeaturesLayer, MapLayer, projectLngLat, type GeoFeature } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/GeoTools/AreaQuery' };
export default meta;
type Story = StoryObj;

/**
 * **Area query** — "which of these were inside that zone?"
 *
 * Eighty vessels are scattered across the Telangana sample. A **zone** (a polygon
 * with a hole), a **route** and a **point** sit on the map. The panel asks:
 *
 * - **Inside the zone** — nodes inside the polygon; the hole is not inside.
 * - **Within N km of the zone** — inside, or within that distance of its boundary.
 * - **Within N km of the route** — geodesic distance to the line (a line has no
 *   inside, so a distance is required).
 * - **Within N km of the point** — a circle on the sphere.
 *
 * A node is where its **position** is (not its drawn size, so the answer does not
 * change with zoom), and distances are measured on the sphere, not in the map's
 * pixel units. The result **replaces the selection** through `ClickSelectBehaviour`
 * — the same selection a lasso makes — and the panel lists how many matched.
 * **Select on draw** (see the DrawPolygon story) re-selects whenever a feature is
 * added. Basemap tiles are OpenFreeMap, so this story needs the network.
 */
export const AreaQueryStory: Story = {
  name: 'AreaQuery',
  render: () => createContainer({ id: 'graph-layers-maplibre-geotools-area-query' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-layers-maplibre-geotools-area-query')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Deterministic scatter, so every load asks the same question of the same fleet.
    let seed = 3;
    const rand = (): number => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    const nodes: GraphNode[] = Array.from({ length: 80 }, (_, i) => ({
      id: `v${i}`,
      type: 'Vessel',
      position: projectLngLat([78.0 + rand() * 2.4, 16.9 + rand() * 1.6]),
      data: { name: `V${i}` }
    }));

    const features: GeoFeature[] = [
      {
        type: 'Feature',
        id: 'zone',
        properties: { name: 'Zone', stroke: '#7c3aed', fill: '#7c3aed' },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [[78.3, 17.1], [79.0, 17.1], [79.1, 17.8], [78.4, 17.9], [78.3, 17.1]],
            [[78.55, 17.4], [78.85, 17.4], [78.85, 17.65], [78.55, 17.65], [78.55, 17.4]]
          ]
        }
      },
      { type: 'Feature', id: 'route', properties: { name: 'Route', stroke: '#ea580c' }, geometry: { type: 'LineString', coordinates: [[79.2, 16.9], [79.5, 17.4], [79.9, 17.8], [80.3, 18.3]] } }
    ];

    canvas.layers.add(new MapLayer({ id: 'map', options: {} }));
    canvas.layers.add(new GeoFeaturesLayer({ id: 'geo', zIndex: 5, options: { mapLayerId: 'map', features } }));
    canvas.layers.add(new GraphLayer({ id: 'graph', zIndex: 10, options: { initData: { nodes, edges: [] } } }));
    canvas.behaviours.register(new NodeScaleLODBehaviour({ id: 'marker-scale', layers: [{ targetLayerId: 'graph', sizePx: 10, strokeWidthPx: 1.5 }] }));
    canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
    canvas.behaviours.register(new AreaQueryBehaviour({ id: 'query', targetLayerId: 'graph', featuresLayerId: 'geo', clickSelectId: 'select' }));

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [79.1, 17.6], zoom: 7.9, minZoom: 3, maxZoom: 15 },
        geo: { defaults: { polygon: { fillOpacity: 0.15, strokeWidthPx: 2.5 }, line: { strokeWidthPx: 3.5 } }, labelFontPx: 12 },
        graph: { node: { style: { shape: { kind: 'circle', radius: 6 }, bgFill: 0x0284c7, bgStrokeColor: 0xffffff } } }
      },
      behaviours: { 'marker-scale': { enabled: true }, select: { enabled: true }, query: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const query = canvas.behaviours.get<AreaQueryBehaviour>('query')!;
    const gui = new GUI({ title: 'Area query' });
    onStoryTeardown(() => gui.destroy());
    const settings = { zoneKm: 20, routeKm: 15, pointKm: 40 };
    const readout = { matched: '—' };
    const matched = gui.add(readout, 'matched').name('Matched').disable();
    const run = (label: string, ids: string[]): void => {
      readout.matched = `${ids.length} of ${nodes.length} · ${label}`;
      matched.updateDisplay();
    };
    gui.add(settings, 'zoneKm', 1, 60, 1).name('Zone distance (km)');
    gui.add(settings, 'routeKm', 1, 60, 1).name('Route distance (km)');
    gui.add(settings, 'pointKm', 5, 120, 1).name('Point distance (km)');
    gui.add({ go: () => run('inside the zone', query.select({ featureId: 'zone' })) }, 'go').name('Inside the zone');
    gui.add({ go: () => run(`within ${settings.zoneKm} km of the zone`, query.select({ featureId: 'zone', km: settings.zoneKm })) }, 'go').name('Within N km of the zone');
    gui.add({ go: () => run(`within ${settings.routeKm} km of the route`, query.select({ featureId: 'route', km: settings.routeKm })) }, 'go').name('Within N km of the route');
    gui.add({ go: () => run(`within ${settings.pointKm} km of Warangal`, query.select({ point: [79.59, 17.97], km: settings.pointKm })) }, 'go').name('Within N km of Warangal');
    gui.add({ clear: () => { canvas.behaviours.get<ClickSelectBehaviour>('select')!.selectMultiple([]); run('selection cleared', []); } }, 'clear').name('Clear selection');
  }
};
