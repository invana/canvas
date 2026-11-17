/**
 * **BubbleSetsLayer around pixel-constant markers** — the members are map markers
 * that stay `18 px` on screen at every zoom (`NodeScaleLODBehaviour`), and the
 * contour hugs them.
 *
 * `NodeScaleLODBehaviour` keeps a marker one size on screen by writing the
 * screen-pixel size into the node's shape *as if it were world units* and then
 * scaling the drawn shape back by `1 / zoom`. Measured from the shape alone, an
 * 18 px marker is 18 world units wide — dozens of times the whole region on a map.
 * The layer measures members by what is **drawn** instead, and re-checks on every
 * zoom settle, so the contour tracks the markers: zoom out and the markers (and
 * the contour around them) shrink in world terms; zoom in and they grow.
 *
 * Only a member that really resized triggers a recompute — a plain graph never
 * recomputes on zoom. Toggle **Pixel-constant markers** off to see the markers
 * (and the contour) become plain world-sized circles.
 *
 * Sample data: Hyderabad (Qutb Shahi heritage), Telangana. Coordinates are
 * approximate (± ~1 km).
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas, GraphLayer, NodeScaleLODBehaviour, type GraphNode } from '@invana/graph';
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';
import { MapLayer, projectLngLat } from '@invana/graph-layer-maplibre';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/bubble-sets/PixelConstantMembers' };
export default meta;
type Story = StoryObj;

export const PixelConstantMembersStory: Story = {
  name: 'PixelConstantMembers',
  render: () => createContainer({ id: 'graph-bubble-sets-pixel-constant-members' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-bubble-sets-pixel-constant-members')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // [lng, lat], approximate.
    const SITES: { id: string; type: 'qutb' | 'other'; lngLat: [number, number] }[] = [
      { id: 'golconda', type: 'qutb', lngLat: [78.4011, 17.3833] },
      { id: 'qutb-shahi-tombs', type: 'qutb', lngLat: [78.3949, 17.3946] },
      { id: 'charminar', type: 'qutb', lngLat: [78.4747, 17.3616] },
      { id: 'mecca-masjid', type: 'qutb', lngLat: [78.4733, 17.3604] },
      { id: 'chowmahalla', type: 'qutb', lngLat: [78.4717, 17.3577] },
      { id: 'birla-mandir', type: 'other', lngLat: [78.4691, 17.4062] },
      { id: 'hussain-sagar', type: 'other', lngLat: [78.474, 17.4239] }
    ];
    const nodes: GraphNode[] = SITES.map((s) => ({ type: s.type, id: s.id, position: projectLngLat(s.lngLat) }));

    const map = new MapLayer({ id: 'map', options: {} });
    canvas.layers.add(map);
    canvas.layers.add(new GraphLayer({ id: 'graph', zIndex: 10, options: { initData: { nodes, edges: [] } } }));

    const bubbles = new BubbleSetsLayer({
      id: 'bubble-sets',
      zIndex: 5,
      options: {
        graphLayerId: 'graph',
        sets: [
          {
            id: 'qutb-shahi',
            members: ['golconda', 'qutb-shahi-tombs', 'charminar', 'mecca-masjid', 'chowmahalla'],
            style: { fill: 0x7c3aed, fillOpacity: 0.18, stroke: 0x7c3aed, strokeWidth: 0.0015 }
          }
        ],
        pixelGroup: 0.0005,
        nodeR0: 0.003,
        nodeR1: 0.01,
        edgeR0: 0.002,
        edgeR1: 0.005,
        morphBuffer: 0.003
      }
    });
    canvas.layers.add(bubbles);

    // Pixel-constant markers — `sizePx` is the on-screen size, whatever the zoom.
    canvas.behaviours.register(
      new NodeScaleLODBehaviour({
        id: 'node-scale-lod',
        layers: [{ targetLayerId: 'graph', sizePx: 18, strokeWidthPx: 1.5 }]
      })
    );

    const canvasOptions = {
      layers: {
        map: { styleUrl: 'https://tiles.openfreemap.org/styles/positron', center: [78.44, 17.39], zoom: 11.2 },
        graph: {
          nodeStructureTemplates: {
            marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 10 }, slots: { label: false } }
          },
          nodeStylingTemplates: {
            qutb: { name: 'qutb', fill: 0x7c3aed, stroke: 0xffffff, strokeWidth: 1.5 },
            other: { name: 'other', fill: 0x64748b, stroke: 0xffffff, strokeWidth: 1.5 }
          },
          nodeTypes: {
            qutb: { structure: 'marker', styling: 'qutb', bindings: {} },
            other: { structure: 'marker', styling: 'other', bindings: {} }
          }
        }
      },
      behaviours: { 'node-scale-lod': { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const settings = { pixelConstant: true, sizePx: 18, nodeR1: 0.01 };
    const gui = new GUI({ title: 'Pixel-constant members' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'pixelConstant').name('Pixel-constant markers').onChange((v: boolean) => {
      canvas.update({ behaviours: { 'node-scale-lod': { enabled: v } } });
      // Toggling rewrites every marker's size; refresh the contour once it has landed.
      window.setTimeout(() => bubbles.recompute(), 200);
    });
    gui.add(settings, 'sizePx', 8, 40, 1).name('Marker size (px)').onChange((v: number) => {
      canvas.update({ behaviours: { 'node-scale-lod': { layers: [{ targetLayerId: 'graph', sizePx: v, strokeWidthPx: 1.5 }] } } });
      window.setTimeout(() => bubbles.recompute(), 200);
    });
    gui.add(settings, 'nodeR1', 0.002, 0.03, 0.001).name('Contour reach (world units)').onChange((v: number) => {
      (bubbles.options as unknown as Record<string, unknown>).nodeR1 = v;
      bubbles.recompute();
    });
    gui.add({ jump: () => map.flyTo({ center: [78.44, 17.39], zoom: 9, duration: 1200 }) }, 'jump').name('Zoom out (zoom 9)');
    gui.add({ jump: () => map.flyTo({ center: [78.46, 17.37], zoom: 13, duration: 1200 }) }, 'jump').name('Zoom in (zoom 13)');
  }
};
