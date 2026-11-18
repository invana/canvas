/**
 * **BubbleSetsLayer at map scale** — contours round two groups of places on a
 * MapLibre basemap.
 *
 * On a `MapLayer` canvas the whole earth is 512 world units across, so a cluster
 * a few kilometres wide is a fraction of one unit — and `bubblesets-js` grids in
 * whole units. The layer runs the algorithm in a normalised space (`pixelGroup` is
 * the grid cell in **world units**, at any scale), so the options below are map
 * scale: a `pixelGroup` of `0.01` and radii of a few hundredths to a tenth. Radii
 * are in **world units**, so size them for the zoom you are looking at — `0.15` is
 * about 25 px at the overview zoom and about 300 px at street level.
 *
 * **Try the grid resolution.** The default `4` is right for a graph and far too
 * coarse here: the cell is wider than the whole region, so the contour vanishes.
 * Anything from about `0.002` to `0.05` draws it; finer is sharper and costlier.
 *
 * Members are small world-sized circles (radius `0.012` world units), so they
 * grow as you zoom — see `PixelConstantMembers` for markers that stay one size on
 * screen. Two places that belong to neither group sit between them; the contour
 * routes around them.
 *
 * Sample data: Hyderabad (Qutb Shahi heritage) and Warangal / Mulugu (Kakatiya
 * heritage), Telangana. Coordinates are approximate (± ~1 km).
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, GraphLayer, type GraphNode, ThemeBehaviour } from '@invana/graph';
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';
import { MapLayer, projectLngLat } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/bubble-sets/AtMapScale' };
export default meta;
type Story = StoryObj;

export const AtMapScaleStory: Story = {
  name: 'AtMapScale',
  render: () => createContainer({ id: 'graph-bubble-sets-at-map-scale' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-bubble-sets-at-map-scale')!;
    const canvas = new GraphCanvas();
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    onStoryTeardown(() => canvas.destroy());

    // [lng, lat], approximate. `type` picks the node look (below, in the config).
    const SITES: { id: string; type: 'qutb' | 'kakatiya' | 'other'; lngLat: [number, number] }[] = [
      { id: 'golconda', type: 'qutb', lngLat: [78.4011, 17.3833] },
      { id: 'qutb-shahi-tombs', type: 'qutb', lngLat: [78.3949, 17.3946] },
      { id: 'charminar', type: 'qutb', lngLat: [78.4747, 17.3616] },
      { id: 'mecca-masjid', type: 'qutb', lngLat: [78.4733, 17.3604] },
      { id: 'chowmahalla', type: 'qutb', lngLat: [78.4717, 17.3577] },
      { id: 'warangal-fort', type: 'kakatiya', lngLat: [79.6067, 17.9566] },
      { id: 'thousand-pillar', type: 'kakatiya', lngLat: [79.5745, 18.0037] },
      { id: 'bhadrakali', type: 'kakatiya', lngLat: [79.5833, 17.9933] },
      { id: 'pakhal', type: 'kakatiya', lngLat: [79.98, 17.95] },
      { id: 'ramappa', type: 'kakatiya', lngLat: [79.9436, 18.2593] },
      { id: 'laknavaram', type: 'kakatiya', lngLat: [80.0526, 18.1617] },
      // In neither group — the contours route around these.
      { id: 'yadagirigutta', type: 'other', lngLat: [78.9451, 17.5873] },
      { id: 'komuravelli', type: 'other', lngLat: [78.9637, 17.9926] }
    ];
    const nodes: GraphNode[] = SITES.map((s) => ({
      type: s.type,
      id: s.id,
      position: projectLngLat(s.lngLat)
    }));

    const map = new MapLayer({ id: 'map', options: {} });
    canvas.layers.add(map);
    const graph = new GraphLayer({ id: 'graph', zIndex: 10, options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(graph);

    // Sets and the cross-layer id stay in the constructor; the algorithm options
    // are in world units (a map is ~512 units across).
    const bubbles = new BubbleSetsLayer({
      id: 'bubble-sets',
      zIndex: 5,
      options: {
        graphLayerId: 'graph',
        sets: [
          {
            id: 'qutb-shahi',
            members: ['golconda', 'qutb-shahi-tombs', 'charminar', 'mecca-masjid', 'chowmahalla'],
            label: { text: 'Qutb Shahi', placement: 'centroid' },
            style: { fill: 0x7c3aed, fillOpacity: 0.18, stroke: 0x7c3aed, strokeWidth: 0.004 }
          },
          {
            id: 'kakatiya',
            members: ['warangal-fort', 'thousand-pillar', 'bhadrakali', 'pakhal', 'ramappa', 'laknavaram'],
            label: { text: 'Kakatiya', placement: 'contour-end' },
            style: { fill: 0xea580c, fillOpacity: 0.18, stroke: 0xea580c, strokeWidth: 0.004 }
          }
        ],
        pixelGroup: 0.01,
        nodeR0: 0.05,
        nodeR1: 0.15,
        edgeR0: 0.03,
        edgeR1: 0.08,
        morphBuffer: 0.05
      }
    });
    canvas.layers.add(bubbles);

    const canvasOptions = {
      behaviours: { theme: { enabled: true, mode: 'document' } },
      layers: {
        map: { basemap: 'themed', center: [79.2, 17.9], zoom: 7.4 },
        graph: {
          nodeStructureTemplates: {
            site: { name: 'site', kind: 'simple', shape: { kind: 'circle', radius: 0.012 }, slots: { label: false } }
          },
          nodeStylingTemplates: {
            qutb: { name: 'qutb', fill: 0x7c3aed, stroke: 0xffffff, strokeWidth: 0.004 },
            kakatiya: { name: 'kakatiya', fill: 0xea580c, stroke: 0xffffff, strokeWidth: 0.004 },
            other: { name: 'other', fill: 0x64748b, stroke: 0xffffff, strokeWidth: 0.004 }
          },
          nodeTypes: {
            qutb: { structure: 'site', styling: 'qutb', bindings: {} },
            kakatiya: { structure: 'site', styling: 'kakatiya', bindings: {} },
            other: { structure: 'site', styling: 'other', bindings: {} }
          }
        }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const settings = {
      visible: true,
      pixelGroup: 0.01,
      nodeR0: 0.05,
      nodeR1: 0.15,
      morphBuffer: 0.05,
      smoothness: 'chaikin' as 'chaikin' | 'bspline' | 'none',
      'qutb-shahi': true,
      kakatiya: true
    };
    const gui = new GUI({ title: 'BubbleSetsLayer — map scale' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'visible').name('Show layer').onChange((v: boolean) => {
      bubbles.visible = v;
    });

    // `BubbleSetsLayer` has no `setOptions`: tune its options in place, then recompute.
    const rebuild = (): void => {
      const o = bubbles.options as unknown as Record<string, unknown>;
      o.pixelGroup = settings.pixelGroup;
      o.nodeR0 = settings.nodeR0;
      o.nodeR1 = settings.nodeR1;
      o.morphBuffer = settings.morphBuffer;
      o.smoothness = settings.smoothness;
      bubbles.recompute();
    };
    const algo = gui.addFolder('Algorithm (world units)');
    algo.add(settings, 'pixelGroup', [0.002, 0.005, 0.01, 0.02, 0.05, 4]).name('pixelGroup (4 = too coarse)').onChange(rebuild);
    algo.add(settings, 'nodeR0', 0, 0.2, 0.005).onChange(rebuild);
    algo.add(settings, 'nodeR1', 0.02, 0.4, 0.005).onChange(rebuild);
    algo.add(settings, 'morphBuffer', 0, 0.2, 0.005).onChange(rebuild);
    algo.add(settings, 'smoothness', ['chaikin', 'bspline', 'none']).onChange(rebuild);

    const sets = gui.addFolder('Sets');
    const original = bubbles.getSets();
    const toggle = (id: 'qutb-shahi' | 'kakatiya') => (v: boolean) => {
      if (v) bubbles.addSet(original.find((s) => s.id === id)!);
      else bubbles.removeSet(id);
    };
    sets.add(settings, 'qutb-shahi').onChange(toggle('qutb-shahi'));
    sets.add(settings, 'kakatiya').onChange(toggle('kakatiya'));

    gui.add({ jump: () => map.flyTo({ center: [78.45, 17.38], zoom: 11, duration: 1200 }) }, 'jump').name('Fly to Hyderabad');
    gui.add({ jump: () => map.flyTo({ center: [79.2, 17.9], zoom: 7.4, duration: 1200 }) }, 'jump').name('Fly to overview');
  }
};
