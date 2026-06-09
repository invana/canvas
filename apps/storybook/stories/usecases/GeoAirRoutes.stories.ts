/**
 * **Geo Air Routes** — `MapLayer` + `GraphLayer` composition over the
 * world-airports dataset. The MapLibre basemap supplies geographic
 * context; the graph layer projects every "international" airport (a
 * curated filter from the full 2,980-point set) to mercator pixels and
 * lays a Delaunay-derived route web on top. Airport circles are sized
 * by their route degree so hub airports read at a glance; hovering an
 * airport pulls a `glow-connector` along its outbound routes.
 *
 * Exercises: `MapLayer` integration, world-coord-pinned `GraphLayer`,
 * data-driven node radius, hover-driven edge decoration, swappable
 * basemap style, optional `MiniMapLayer`.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  EdgeSizeLODBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  MiniMapLayer,
  NodeSizeLODBehaviour,
  type EdgeData,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { MapLayer } from '@invana/graph-layer-maplibre';
import { airports, type Airport } from '@invana/graph-datasets';
import { Delaunay } from 'd3-delaunay';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Geo Air Routes' };
export default meta;
type Story = StoryObj;

export const GeoAirRoutes: Story = {
  render: () => createContainer({ id: 'usecase-geo-air-routes' }),

  play: async ({ canvasElement }) => {
    interface AirportData {
      readonly name: string;
      readonly degree: number;
    }

    // OpenFreeMap (no key required) — three styles cover the most-asked-for
    // basemap modes for a graph overlay.
    const STYLES = {
      liberty:   'https://tiles.openfreemap.org/styles/liberty',
      bright:    'https://tiles.openfreemap.org/styles/bright',
      positron:  'https://tiles.openfreemap.org/styles/positron',
    } as const;
    type StyleKey = keyof typeof STYLES;

    const settings = {
      basemap: 'positron' as StyleKey,
      edgeAlpha: 0.45,
      showMiniMap: false,
      hoverNeighbours: 1,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-geo-air-routes')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // The MapLayer drives the camera; the canvas's own pan / wheel
    // behaviours are NOT registered (MapLibre handles gestures), which
    // matches the maplibre/Routes story precedent.
    const map = new MapLayer({ id: 'map', options: {} });
    canvas.layers.add(map);

    // ── Curated subset: airports whose name reads as a major hub ────────
    // The full set has 2,980 entries — too noisy for a hover-led story.
    // Filtering to names that contain "International" / "Intl" gives
    // ~250 airports, the headline city-hub set every traveller recognises.
    const HUB_RE = /\b(International|Intl|Heathrow|Gatwick|Frankfurt|Charles De Gaulle|Schiphol|Haneda)\b/i;
    const hubs: readonly Airport[] = airports.filter((a) => HUB_RE.test(a.name));

    // Project to world coords; positions are stable across map gestures
    // because the canvas camera mirrors MapLibre's transform. `project`
    // is pure mercator math, so it's safe to call before `init()`.
    const points: { id: string; x: number; y: number; name: string }[] = hubs.map((a, i) => {
      const { x, y } = map.project([a.lng, a.lat]);
      return { id: `ap-${i}`, x, y, name: a.name };
    });

    // Delaunay edges on the projected coords. Same approach the
    // maplibre/Routes story uses, but over the curated hub subset so the
    // edge count stays in the low hundreds.
    const delaunay = Delaunay.from(
      points,
      (p) => p.x,
      (p) => p.y,
    );
    const seen = new Set<string>();
    const rawEdges: { id: string; source: string; target: string }[] = [];
    const tris = delaunay.triangles;
    const pushEdge = (i: number, j: number): void => {
      const lo = i < j ? i : j;
      const hi = i < j ? j : i;
      const key = `${lo}-${hi}`;
      if (seen.has(key)) return;
      seen.add(key);
      rawEdges.push({
        id: `e-${rawEdges.length}`,
        source: `ap-${lo}`,
        target: `ap-${hi}`,
      });
    };
    for (let i = 0; i < tris.length; i += 3) {
      const a = tris[i]!, b = tris[i + 1]!, c = tris[i + 2]!;
      pushEdge(a, b); pushEdge(b, c); pushEdge(c, a);
    }

    // Degree per node, used to scale airport circles.
    const degree = new Map<string, number>();
    for (const p of points) degree.set(p.id, 0);
    for (const e of rawEdges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }

    const nodes: NodeData<AirportData>[] = points.map((p) => ({
      id: p.id,
      position: { x: p.x, y: p.y },
      data: { name: p.name, degree: degree.get(p.id) ?? 0 },
    }));
    const edges: EdgeData<Record<string, never>>[] = rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: {},
    }));

    // ── GraphLayer ──────────────────────────────────────────────────────
    // Resolver functions (`shape`, `labelText`) stay in the constructor;
    // the literal style fields live in `canvasOptions.layers.graph`.
    const graph = new GraphLayer({
      id: 'graph',
      zIndex: 10,
      options: {
        initData: { nodes, edges },
        node: {
          style: {
            shape: (n: GraphNode) => ({
              kind: 'circle',
              // Scale 1 → 12 degree to 2 → 7 px radius (log-ish curve
              // keeps the long tail from blowing up).
              radius: 2 + Math.sqrt((n.data as AirportData).degree) * 1.4,
            }),
            labelText: (n: GraphNode) => (n.data as AirportData).name,
          },
        },
      },
    });
    canvas.layers.add(graph);

    // ── Behaviours ──────────────────────────────────────────────────────
    // Pixel-constant node sizing keeps the airport circles legible as
    // the user zooms from world view down to street level.
    // `layers` carries cross-layer `layerId` wiring, so it stays in the
    // constructor; only `enabled` lives in config.
    canvas.behaviours.register(
      new NodeSizeLODBehaviour({
        id: 'node-size-lod',
        layers: [{ layerId: 'graph', sizePx: 5, strokeWidthPx: 0.6 }],
      }),
    );
    canvas.behaviours.register(
      new EdgeSizeLODBehaviour({
        id: 'edge-size-lod',
        layers: [{ layerId: 'graph', strokeWidthPx: 0.6 }],
      }),
    );

    const hover = new HoverActivateBehaviour({ id: 'hover', layerId: 'graph' });
    canvas.behaviours.register(hover);

    // The MiniMapLayer is added once but its `visible` is toggled by the
    // GUI checkbox. Starts hidden so the basemap reads cleanly on first
    // load. `graphLayerId` is a cross-layer id, so it stays in the ctor.
    const minimap = new MiniMapLayer({
      id: 'minimap',
      visible: false,
      options: { graphLayerId: 'graph' },
    });
    canvas.layers.add(minimap);

    const canvasOptions = {
      layers: {
        map: {
          styleUrl: STYLES[settings.basemap],
          center: [0, 25],
          zoom: 1.6,
        },
        graph: {
          node: {
            style: {
              bgFill: 0xff6b35,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 0.6,
              bgAlpha: 0.92,
              labelColor: 0x111827,
              labelFontSize: 10,
              labelPlacement: 'bottom',
              labelOffsetY: 4,
              labelBackgroundFill: 0xffffff,
              labelBackgroundAlpha: 0.85,
              labelBackgroundPadding: 2,
              labelBackgroundCornerRadius: 2,
              // Hide all labels until zoomed past world-view, then collision
              // takes over (LabelCollisionBehaviour isn't registered here —
              // the label set is small enough that overlap is rare past
              // zoom 3).
              labelMinZoom: 3,
            },
            state: {
              hovered: {
                bgFill: 0xfacc15,
                bgStrokeColor: 0xfacc15,
                bgStrokeWidth: 1.8,
                labelForceShow: true,
              },
              dimmed: { bgAlpha: 0.15 },
            },
          },
          edge: {
            style: {
              shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.35 } },
              strokeColor: 0x475569,
              strokeWidth: 0.6,
              strokeAlpha: settings.edgeAlpha,
              arrowTargetShape: 'none',
            },
            state: {
              hovered: {
                strokeColor: 0xfacc15,
                strokeAlpha: 0.95,
                strokeWidth: 1.4,
                decorations: [
                  { id: 'route-glow', kind: 'flow-particles-connector', color: 0xfacc15, count: 3, size: 3, speedPxPerSec: 120 },
                ],
              },
              dimmed: { strokeAlpha: 0.05 },
            },
          },
        },
        minimap: {
          position: 'top-right',
          width: 200,
          height: 140,
          backgroundColor: 0x111827,
        },
      },
      behaviours: {
        'node-size-lod': { enabled: true },
        'edge-size-lod': { enabled: true },
        hover: {
          enabled: true,
          state: 'hovered',
          inactiveState: 'dimmed',
          degree: settings.hoverNeighbours,
          direction: 'both',
        },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Geo Air Routes' });
    onStoryTeardown(() => gui.destroy());

    gui
      .add(settings, 'basemap', Object.keys(STYLES) as StyleKey[])
      .name('basemap')
      .onChange((s: StyleKey) => map.maplibre?.setStyle(STYLES[s]));

    gui
      .add(settings, 'edgeAlpha', 0, 1, 0.05)
      .name('route alpha')
      .onChange((alpha: number) => {
        graph.store.batch(() => {
          for (const e of edges) {
            graph.store.updateEdge(e.id, { style: { strokeAlpha: alpha } });
          }
        });
      });

    gui
      .add(settings, 'hoverNeighbours', 0, 3, 1)
      .name('hover hops')
      .onChange((n: number) => hover.setOptions({ degree: n }));

    gui
      .add(settings, 'showMiniMap')
      .name('show minimap')
      .onChange((v: boolean) => { minimap.visible = v; });

    const counters = { airports: hubs.length, routes: rawEdges.length };
    gui.add(counters, 'airports').disable();
    gui.add(counters, 'routes').disable();
  },
};
