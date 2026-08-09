/**
 * `MapLayer` + `GraphLayer` — every world airport (2,980 from the
 * `air-routes` dataset) plus a planar **Delaunay triangulation** of those
 * positions as the route graph. The Delaunay edges trace local
 * adjacency: each airport gets connected to its geographic neighbours,
 * which on a populated continent looks like the dense web of regional
 * hops that hub-and-spoke route maps emerge from.
 *
 * Inspired by Observable's
 * [`@d3/world-airports`](https://observablehq.com/@d3/world-airports) —
 * that notebook uses Voronoi cells (the dual of this Delaunay) for
 * mouse-pick of the nearest airport. We surface the Delaunay edges
 * themselves as the graph's edge set.
 *
 * **Caveat — planar Delaunay on mercator pixels** is not spherical
 * Delaunay. Adjacent points near the antimeridian or the poles get
 * worse-than-ideal edges (a `d3-geo-voronoi` swap would fix this).
 * Acceptable for the demo; flagged so future stories can upgrade.
 */

import 'maplibre-gl/dist/maplibre-gl.css?inline';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DevInfoLayer } from '@invana/canvas';
import {
  EdgeScaleLODBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  NodeScaleLODBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import {
  DENSITY_CONTOUR_PALETTE_NAMES,
  DensityContourFillLayer,
  type DensityContourPaletteName
} from '@invana/graph-layer-d3-contour';
import { MapLayer } from '@invana/graph-layer-maplibre';
import { airports } from '@invana/graph-datasets';
import { Delaunay } from 'd3-delaunay';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/Routes' };
export default meta;
type Story = StoryObj;

export const Routes_Story: Story = {
  name: 'Routes',
  render: () => createContainer({ id: 'graph-maplibre-routes' }),

  play: async ({ canvasElement }) => {
    const NODE_DEFAULTS = {
      size: 2,
      fill: 0xff6b35,
      stroke: 0xffffff,
      strokeWidth: 0.4,
      alpha: 0.9
    };
    const EDGE_DEFAULTS = {
      stroke: 0x676767,
      strokeWidth: 2,
      // alpha: 0.18
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-maplibre-routes')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const map = new MapLayer({
      id: 'map',
      options: {
        styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
        center: [0, 25],
        zoom: 1.6
      }
    });
    canvas.layers.add(map);

    // Project every airport to world coords (mercator pixels at zoom 0)
    // once at setup. Positions are stable across map zoom because the
    // pixi camera mirrors MapLibre's transform — the camera moves, the
    // world coords don't.
    const nodes: GraphNode[] = airports.map((a, i) => {
      const { x, y } = map.project([a.lng, a.lat]);
      return { type: 'node',
        id: `ap-${i}`,
        position: { x, y },
        data: { name: a.name, lng: a.lng, lat: a.lat }
      };
    });

    // Delaunay over the projected world coords. `Delaunay.from(...)`
    // wants a flat point list; we hand it a `getX`/`getY` accessor pair
    // so we don't have to allocate an intermediate array.
    const delaunay = Delaunay.from(
      nodes,
      (n) => n.position!.x,
      (n) => n.position!.y,
    );

    // Each triangle in `delaunay.triangles` is a triplet of point
    // indices `[a, b, c]`. The three edges `a-b, b-c, c-a` are shared
    // between adjacent triangles, so we dedup via a canonical
    // `min,max` key. ~3 edges per triangle, ~2 triangles per edge after
    // dedup → roughly 2*N edges for N points (≈ 6000 edges here).
    const seen = new Set<string>();
    const edges: GraphEdge[] = [];
    const tris = delaunay.triangles;
    const pushEdge = (i: number, j: number): void => {
      const lo = i < j ? i : j;
      const hi = i < j ? j : i;
      const key = `${lo}-${hi}`;
      if (seen.has(key)) return;
      seen.add(key);
      edges.push({ type: 'edge',
        id: `e-${edges.length}`,
        source: `ap-${lo}`,
        target: `ap-${hi}`
      });
    };
    for (let i = 0; i < tris.length; i += 3) {
      const a = tris[i]!;
      const b = tris[i + 1]!;
      const c = tris[i + 2]!;
      pushEdge(a, b);
      pushEdge(b, c);
      pushEdge(c, a);
    }

    // Node + edge templates are pure literal → they live entirely in
    // config; only the content (`initData`) rides on the constructor.
    const graph = new GraphLayer({
      id: 'graph',
      zIndex: 10,
      options: { initData: { nodes, edges } }
    });
    canvas.layers.add(graph);

    // Density overlay between the map and the graph. The contour resolves
    // `graphLayerId` synchronously at mount, so it must be added AFTER
    // the graph layer; zIndex still controls paint order, so the contour
    // sits visually below the nodes and edges. `graphLayerId` is a
    // cross-layer id → stays in the constructor; literal params go to config.
    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: 5,
      visible: false,
      options: { graphLayerId: 'graph' }
    });
    canvas.layers.add(contour);

    canvas.layers.add(new DevInfoLayer({ id: 'dev-info', corner: 'bottom-left' }));

    type Region = 'World' | 'North Atlantic' | 'Trans-Pacific' | 'Europe' | 'Asia' | 'North America';
    const PRESETS: Record<Region, { center: [number, number]; zoom: number }> = {
      World: { center: [0, 25], zoom: 1.6 },
      'North Atlantic': { center: [-40, 50], zoom: 2.8 },
      'Trans-Pacific': { center: [180, 35], zoom: 2.2 },
      Europe: { center: [10, 50], zoom: 3.4 },
      'North America': { center: [-95, 40], zoom: 3 },
      Asia: { center: [110, 25], zoom: 3 }
    };

    const settings = {
      view: 'World' as Region,
      edgeColor: EDGE_DEFAULTS.stroke,
      edgeWidth: EDGE_DEFAULTS.strokeWidth,
      edgeAlpha: 1,
      nodeSize: NODE_DEFAULTS.size,
      nodeFill: NODE_DEFAULTS.fill,
      nodeAlpha: NODE_DEFAULTS.alpha,
      screenConstant: true,
      targetNodePx: 5,
      targetNodeStrokePx: 0.8,
      targetEdgePx: 0.6,
      showDensity: false,
      densityBandwidth: 10,
      densityThresholds: 8,
      densityOpacity: 0.55,
      densityPalette: 'inferno' as DensityContourPaletteName,
      hoverEnabled: true,
      hoverDegree: 1,
      hoverZoomThreshold: 4,
      hoverFarSize: 18,
      hoverFarStrokeWidth: 4
    };

    // Pixel-constant nodes + edges. Routes are the bigger problem here:
    // at world zoom 1.6, a `strokeWidth: 0.25` is a hairline; at city
    // zoom 8 it's a slab. The behaviour reinterprets the values as
    // screen px and rewrites them to `px / scale` on each `camera:zoom`,
    // which `MapLayer` bridges from MapLibre's gesture.
    // Separate behaviours for nodes vs edges — each handles its own
    // RAF coalescing. The browser batches all behaviours' RAF callbacks
    // into the same animation frame, so this is the same per-frame cost
    // as a single behaviour doing both passes. The resolver functions keep
    // these behaviours' options in the constructor.
    const nodeScaleLOD = new NodeScaleLODBehaviour({
      id: 'node-scale-lod',
      layers: [
        {
          targetLayerId: 'graph',
          sizePx: () => settings.targetNodePx,
          strokeWidthPx: () => settings.targetNodeStrokePx
        },
      ]
    });
    const edgeScaleLOD = new EdgeScaleLODBehaviour({
      id: 'edge-scale-lod',
      layers: [{ targetLayerId: 'graph', strokeWidthPx: () => settings.targetEdgePx }]
    });
    canvas.behaviours.register(nodeScaleLOD);
    canvas.behaviours.register(edgeScaleLOD);

    // Hover-to-activate — highlights the airport under the pointer plus
    // its N-hop neighbour airports and connecting Delaunay routes, and
    // dims everything else. Registered after the graph layer is mounted.
    //
    // `zoomThreshold` swaps to the bigger `hover-far` palette when the
    // MapLibre camera scale (= `2^zoom`) drops to ≤ 4 (world view). The
    // behaviour re-applies on every `camera:zoom`, so dragging the camera
    // across the threshold mid-hover swaps the visuals cleanly.
    const hover = new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' });
    canvas.behaviours.register(hover);

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: NODE_DEFAULTS.size / 2 },
              bgFill: NODE_DEFAULTS.fill,
              bgStrokeColor: NODE_DEFAULTS.stroke,
              bgStrokeWidth: NODE_DEFAULTS.strokeWidth,
              bgAlpha: NODE_DEFAULTS.alpha
            },
            state: {
              // Hover / dimmed palettes — hovered lights up the airport and
              // its connected routes (N-hop) in amber; dimmed pushes the
              // rest back. `'hover-far'` is a custom (non-canonical) state
              // swapped in via `zoomedOutState` when the camera zooms past
              // the threshold; bigger node body so it stays visible at
              // world-level zoom.
              hovered: {
                bgFill: 0xfacc15,
                bgStrokeColor: 0xfacc15,
                bgStrokeWidth: 1.5,
                shape: { kind: 'circle', radius: 2.5 }
              },
              dimmed: { bgAlpha: 0.15 },
              'hover-far': {
                bgFill: 0xfacc15,
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 2,
                shape: { kind: 'circle', radius: 9 }
              }
            }
          },
          edge: {
            style: {
              shape: { pathType: 'straight' },
              arrowTargetShape: 'none',
              strokeColor: EDGE_DEFAULTS.stroke,
              strokeWidth: EDGE_DEFAULTS.strokeWidth,
              strokeAlpha: 1
            },
            state: {
              hovered: { strokeColor: 0xfacc15, strokeWidth: 1.2, strokeAlpha: 0.95 },
              dimmed: { strokeAlpha: 0.05 },
              'hover-far': { strokeColor: 0xfacc15, strokeWidth: 4, strokeAlpha: 1 }
            }
          }
        },
        density: {
          bandwidth: 10,
          thresholds: 8,
          cellSize: 2,
          padding: 40,
          fillOpacity: 0.55,
          palette: 'inferno'
        }
      },
      behaviours: {
        'node-scale-lod': { enabled: true },
        'edge-scale-lod': { enabled: true },
        hover: {
          enabled: true,
          state: 'hovered',
          // inactiveState: 'dimmed',
          degree: settings.hoverDegree,
          direction: 'both',
          zoomThreshold: settings.hoverZoomThreshold,
          zoomedOutState: 'hover-far',
          zoomedOutEdgeState: 'hover-far'
        }
      }
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const gui = new GUI({ title: 'World Routes (Delaunay)' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'view', Object.keys(PRESETS) as Region[])
      .name('Fly to')
      .onChange((v: Region) => map.flyTo({ ...PRESETS[v], duration: 1400 }));

    // Restyle nodes / edges by pushing a fresh template into config via
    // `canvas.update(...)`. The literal style shallow-merges over the
    // mounted template, so the slider/colour edits propagate to all nodes
    // and edges.
    const restyleNodes = (): void => {
      canvasOptions.layers.graph.node.style = {
        ...canvasOptions.layers.graph.node.style,
        shape: { kind: 'circle', radius: settings.nodeSize / 2 },
        bgFill: settings.nodeFill,
        bgAlpha: settings.nodeAlpha
      };
      canvas.update({ layers: { graph: { node: { style: canvasOptions.layers.graph.node.style } } } });
    };

    const restyleEdges = (): void => {
      canvasOptions.layers.graph.edge.style = {
        ...canvasOptions.layers.graph.edge.style,
        strokeColor: settings.edgeColor,
        strokeWidth: settings.edgeWidth,
        strokeAlpha: settings.edgeAlpha
      };
      canvas.update({ layers: { graph: { edge: { style: canvasOptions.layers.graph.edge.style } } } });
    };

    const routeFolder = gui.addFolder('Routes');
    routeFolder.addColor(settings, 'edgeColor').name('Color').onChange(restyleEdges);
    routeFolder.add(settings, 'edgeWidth', 0.05, 2, 0.05).name('Width').onChange(restyleEdges);
    routeFolder.add(settings, 'edgeAlpha', 0, 1, 0.01).name('Alpha').onChange(restyleEdges);

    const nodeFolder = gui.addFolder('Airports');
    nodeFolder.add(settings, 'nodeSize', 0.5, 10, 0.25).name('Size').onChange(restyleNodes);
    nodeFolder.addColor(settings, 'nodeFill').name('Fill').onChange(restyleNodes);
    nodeFolder.add(settings, 'nodeAlpha', 0, 1, 0.01).name('Alpha').onChange(restyleNodes);

    const screenFolder = gui.addFolder('Pixel-constant sizing');
    screenFolder
      .add(settings, 'screenConstant')
      .name('Enable')
      .onChange((v: boolean) => {
        if (v) {
          nodeScaleLOD.enable();
          edgeScaleLOD.enable();
        } else {
          nodeScaleLOD.disable();
          edgeScaleLOD.disable();
        }
      });
    screenFolder
      .add(settings, 'targetNodePx', 1, 24, 0.5)
      .name('Node px')
      .onChange(() => {
        if (settings.screenConstant) nodeScaleLOD.reflow();
      });
    screenFolder
      .add(settings, 'targetNodeStrokePx', 0, 5, 0.1)
      .name('Node stroke px')
      .onChange(() => {
        if (settings.screenConstant) nodeScaleLOD.reflow();
      });
    screenFolder
      .add(settings, 'targetEdgePx', 0.1, 5, 0.1)
      .name('Edge px')
      .onChange(() => {
        if (settings.screenConstant) edgeScaleLOD.reflow();
      });

    const hoverFolder = gui.addFolder('Hover');
    hoverFolder
      .add(settings, 'hoverEnabled')
      .name('Enable')
      .onChange((v: boolean) => (v ? hover.enable() : hover.disable()));
    hoverFolder
      .add(settings, 'hoverDegree', 0, 3, 1)
      .name('Neighbour hops')
      .onChange((n: number) => canvas.update({ behaviours: { hover: { degree: n } } }));
    hoverFolder
      .add(settings, 'hoverZoomThreshold', 0.25, 64, 0.25)
      .name('Far-zoom threshold')
      .onChange((v: number) => canvas.update({ behaviours: { hover: { zoomThreshold: v } } }));
    // Far-zoom node/edge px sliders dropped — state styling is now
    // layer-template-only and can't be mutated at runtime. The baked-in
    // `hover-far` overlay (declared in `layers.graph.node.state`) covers
    // the static case.

    const densityFolder = gui.addFolder('Density overlay');
    densityFolder.add(settings, 'showDensity').name('Show density').onChange((v: boolean) => {
      contour.visible = v;
      if (v) contour.recompute();
    });

    const rebuildContour = (): void => {
      const o = contour.options as unknown as Record<string, unknown>;
      o.bandwidth = settings.densityBandwidth;
      o.thresholds = settings.densityThresholds;
      o.fillOpacity = settings.densityOpacity;
      o.palette = settings.densityPalette;
      contour.recompute();
    };

    densityFolder
      .add(settings, 'densityBandwidth', 2, 30, 0.5)
      .name('Bandwidth')
      .onChange(rebuildContour);
    densityFolder
      .add(settings, 'densityThresholds', 3, 20, 1)
      .name('Bands')
      .onChange(rebuildContour);
    densityFolder
      .add(settings, 'densityOpacity', 0, 1, 0.01)
      .name('Opacity')
      .onChange(rebuildContour);
    densityFolder
      .add(settings, 'densityPalette', [...DENSITY_CONTOUR_PALETTE_NAMES])
      .name('Palette')
      .onChange(rebuildContour);

    gui.add({ airports: nodes.length }, 'airports').name('Airport count').disable();
    gui.add({ routes: edges.length }, 'routes').name('Route count').disable();
  }
};
