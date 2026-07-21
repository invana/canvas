/**
 * `MapLayer` + `GraphLayer` — major world airports pinned to lng/lat over
 * an OpenFreeMap basemap, with an optional density contour overlay.
 *
 * Demonstrates the minimal MapLayer integration: nodes are positioned once
 * via `mapLayer.project([lng, lat])` (web-mercator pixels at zoom 0), and
 * MapLibre's native pan/zoom drives the canvas camera so the dots stay
 * locked to their geographic locations as the user explores the map.
 *
 * The density layer is purely additive — toggle it off and the story
 * degenerates to the airports-only base case.
 *
 * Inspired by Observable's [`@d3/world-airports`](https://observablehq.com/@d3/world-airports);
 * we swap the static `geoNaturalEarth1` projection for a real interactive
 * basemap.
 */

import 'maplibre-gl/dist/maplibre-gl.css';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DevInfoLayer } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  NodeScaleLODBehaviour,
  type GraphNode,
} from '@invana/graph';
import { MapLayer } from '@invana/graph-layer-maplibre';
import {
  DENSITY_CONTOUR_PALETTE_NAMES,
  DensityContourFillLayer,
  type DensityContourPaletteName,
} from '@invana/graph-layer-d3-contour';
import { airports } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/maplibre/Airports' };
export default meta;
type Story = StoryObj;

export const Airports_Story: Story = {
  name: 'Airports',
  render: () => createContainer({ id: 'graph-maplibre-airports' }),

  play: async ({ canvasElement }) => {
    const NODE_DEFAULTS = {
      size: 3,
      fill: 0xff6b35,
      stroke: 0xffffff,
      strokeWidth: 0.5,
      alpha: 0.95,
    } as const;

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-maplibre-airports')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // MapLibre owns input — don't register DragPan / WheelZoom behaviours
    // alongside this layer (the pixi canvas is pointer-event-transparent
    // by default, so they wouldn't see input anyway).
    const map = new MapLayer({
      id: 'map',
      options: {
        styleUrl: 'https://tiles.openfreemap.org/styles/liberty',
        center: [0, 25],
        zoom: 1.6,
      },
    });
    canvas.layers.add(map);

    // Synthesize stable ids from the array index — the source CSV has
    // no id column.
    const nodes: GraphNode[] = airports.map((a, i) => {
      const { x, y } = map.project([a.lng, a.lat]);
      return {
        id: `ap-${i}`,
        position: { x, y },
        data: { name: a.name, lng: a.lng, lat: a.lat },
      };
    });

    // GraphLayer has to mount before the contour layer — the contour's
    // `onMount` resolves its `graphLayerId` dependency synchronously and
    // throws if the graph isn't already registered. zIndex still controls
    // paint order, so the contour can sit visually below the nodes.
    // Node template is pure literal style → lives entirely in config; only
    // the content (`initData`) rides on the constructor.
    const graph = new GraphLayer({
      id: 'graph',
      zIndex: 10,
      options: { initData: { nodes, edges: [] } },
    });
    canvas.layers.add(graph);

    // Density overlay between the map and the airport dots. World-space
    // contour bands track the camera through MapLayer's transform mirror,
    // so they pan and zoom with the basemap. Toggle visible from the GUI.
    // `graphLayerId` is a cross-layer id → stays in the constructor; the
    // literal contour params go to config.
    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: 5,
      visible: false,
      options: { graphLayerId: 'graph' },
    });
    canvas.layers.add(contour);

    canvas.layers.add(new DevInfoLayer({ id: 'dev-info', corner: 'bottom-left' }));

    // Pixel-constant marker behaviour — opt-in via the GUI. On enable,
    // every node's `data.size` is reinterpreted as screen px and rewritten
    // to `px / scale` on each `camera:zoom`. `MapLayer` bridges its
    // direct viewport writes to `camera:zoom` so this works under
    // MapLibre's native zoom gesture too. The `sizePx` getter reads
    // `settings.targetNodePx` fresh each reflow, so the slider below
    // updates sizes live without recreating the behaviour. The resolver
    // functions keep this behaviour's options in the constructor.
    const nodeScaleLOD = new NodeScaleLODBehaviour({
      id: 'node-scale-lod',
      layers: [
        {
          targetLayerId: 'graph',
          sizePx: () => settings.targetNodePx,
          strokeWidthPx: () => settings.targetStrokePx,
        },
      ],
    });
    canvas.behaviours.register(nodeScaleLOD);

    // Hover-to-activate — highlights the airport under the pointer and
    // dims the rest. Registered after the graph layer is mounted so the
    // behaviour can resolve its target at register-time.
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
              bgAlpha: NODE_DEFAULTS.alpha,
            },
            state: {
              // Hovered state palette — bright fill + ring on the hovered
              // airport, everything else dimmed. No edges in this dataset.
              hovered: {
                bgFill: 0xfacc15,
                bgStrokeColor: 0xfacc15,
                bgStrokeWidth: 1.5,
                shape: { kind: 'circle', radius: 3 },
              },
              dimmed: { bgAlpha: 0.25 },
            },
          },
        },
        density: {
          // World coords are mercator pixels at zoom 0 — the whole world is
          // 512 units wide. A bandwidth of ~10 reads as "city-cluster scale"
          // at most basemap zooms.
          bandwidth: 10,
          thresholds: 8,
          cellSize: 2,
          padding: 40,
          fillOpacity: 0.55,
          palette: 'inferno',
        },
      },
      behaviours: {
        'node-scale-lod': { enabled: true },
        hover: { enabled: true, state: 'hovered', inactiveState: 'dimmed' },
      },
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // GUI — fly between continents to show the camera-sync in action, and
    // toggle / tune the density overlay.
    type Region = 'World' | 'Europe' | 'North America' | 'Asia' | 'Africa' | 'Australia';
    const PRESETS: Record<Region, { center: [number, number]; zoom: number }> = {
      World: { center: [0, 25], zoom: 1.6 },
      Europe: { center: [10, 50], zoom: 3.5 },
      'North America': { center: [-95, 40], zoom: 3 },
      Asia: { center: [105, 25], zoom: 3 },
      Africa: { center: [20, 0], zoom: 2.8 },
      Australia: { center: [135, -25], zoom: 3.3 },
    };

    const settings = {
      view: 'World' as Region,
      nodeSize: NODE_DEFAULTS.size,
      nodeFill: NODE_DEFAULTS.fill,
      nodeAlpha: NODE_DEFAULTS.alpha,
      screenConstant: true,
      targetNodePx: 6,
      targetStrokePx: 1,
      showDensity: false,
      densityBandwidth: 10,
      densityThresholds: 8,
      densityOpacity: 0.55,
      densityPalette: 'inferno' as DensityContourPaletteName,
    };

    const gui = new GUI({ title: 'World Airports' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'view', Object.keys(PRESETS) as Region[])
      .name('Fly to')
      .onChange((v: Region) => map.flyTo({ ...PRESETS[v], duration: 1400 }));

    // Restyle every node by pushing a fresh node template into config via
    // `canvas.update(...)`. The literal style shallow-merges over the
    // mounted template, so the slider/colour edits propagate to all nodes.
    const restyleNodes = (): void => {
      canvasOptions.layers.graph.node.style = {
        ...canvasOptions.layers.graph.node.style,
        shape: { kind: 'circle', radius: settings.nodeSize / 2 },
        bgFill: settings.nodeFill,
        bgAlpha: settings.nodeAlpha,
      };
      canvas.update({ layers: { graph: { node: { style: canvasOptions.layers.graph.node.style } } } });
    };

    const nodeFolder = gui.addFolder('Node style');
    nodeFolder.add(settings, 'nodeSize', 1, 20, 0.5).name('Size').onChange(restyleNodes);
    nodeFolder.addColor(settings, 'nodeFill').name('Fill').onChange(restyleNodes);
    nodeFolder.add(settings, 'nodeAlpha', 0, 1, 0.01).name('Alpha').onChange(restyleNodes);

    const screenFolder = gui.addFolder('Pixel-constant nodes');
    screenFolder
      .add(settings, 'screenConstant')
      .name('Enable')
      .onChange((v: boolean) => {
        if (v) nodeScaleLOD.enable();
        else nodeScaleLOD.disable();
      });
    screenFolder
      .add(settings, 'targetNodePx', 1, 24, 0.5)
      .name('Node px')
      .onChange(() => {
        // Reflow only matters while enabled. Off → originals are already
        // restored; turning it on later will pick up the slider value
        // from the closure.
        if (settings.screenConstant) nodeScaleLOD.reflow();
      });
    screenFolder
      .add(settings, 'targetStrokePx', 0, 5, 0.1)
      .name('Stroke px')
      .onChange(() => {
        if (settings.screenConstant) nodeScaleLOD.reflow();
      });

    const hoverFolder = gui.addFolder('Hover');
    const hoverSettings = { enable: true };
    hoverFolder
      .add(hoverSettings, 'enable')
      .name('Enable')
      .onChange((v: boolean) => (v ? hover.enable() : hover.disable()));

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

    gui.add({ count: nodes.length }, 'count').name('Airports').disable();
  },
};
